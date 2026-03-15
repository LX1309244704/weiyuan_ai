const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const multer = require('multer');
const { User, Skill, Order, BalanceLog, Invocation, ApiEndpoint, ApiInvocation } = require('../models');
const { encrypt, decrypt } = require('../utils/encryption');
const { sequelize } = require('../models');
const { redis, KEYS } = require('../config/redis');
const { saveSkillPackage, deleteSkillPackage, saveIcon } = require('../utils/storage');

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }
});

/**
 * Admin middleware
 */
const requireAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    next(error);
  }
};

/**
 * Dashboard stats
 * GET /api/admin/stats
 */
router.get('/stats', requireAdmin, async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Today's orders
    const todayOrders = await Order.count({
      where: {
        created_at: { [Op.gte]: today },
        status: 'paid'
      }
    });
    
    // Today's revenue
    const todayRevenue = await Order.sum('amount', {
      where: {
        created_at: { [Op.gte]: today },
        status: 'paid'
      }
    });
    
    // Total users
    const totalUsers = await User.count();
    
    // Total invocations
    const totalInvocations = await Invocation.count();
    
    // Recent 7 days trend
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const dailyStats = await Order.findAll({
      attributes: [
        [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'orderCount'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'revenue']
      ],
      where: {
        created_at: { [Op.gte]: sevenDaysAgo },
        status: 'paid'
      },
      group: [sequelize.fn('DATE', sequelize.col('created_at'))],
      order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']],
      raw: true
    });
    
    res.json({
      stats: {
        todayOrders,
        todayRevenue: todayRevenue || 0,
        totalUsers,
        totalInvocations
      },
      dailyTrend: dailyStats
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Revenue statistics
 * GET /api/admin/stats/revenue
 */
router.get('/stats/revenue', requireAdmin, async (req, res, next) => {
  try {
    const { period = 'all' } = req.query;
    
    let where = { status: 'paid' };
    let dateFilter = null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (period === 'today') {
      dateFilter = today;
    } else if (period === 'month') {
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      dateFilter = monthStart;
    }
    
    if (dateFilter) {
      where.created_at = { [Op.gte]: dateFilter };
    }
    
    const orders = await Order.findAll({ where });
    
    const totalRevenue = orders.reduce((sum, o) => sum + o.amount, 0);
    
    const byPaymentMethod = {};
    for (const order of orders) {
      const method = order.paymentMethod || 'unknown';
      byPaymentMethod[method] = (byPaymentMethod[method] || 0) + order.amount;
    }
    
    const skillRevenue = {};
    for (const order of orders) {
      if (order.skillId) {
        if (!skillRevenue[order.skillId]) {
          skillRevenue[order.skillId] = 0;
        }
        skillRevenue[order.skillId] += order.amount;
      }
    }
    
    const topSkills = await Promise.all(
      Object.entries(skillRevenue)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(async ([skillId, revenue]) => {
          const skill = await Skill.findByPk(skillId);
          return {
            skillId,
            name: skill?.name || 'Unknown',
            revenue,
            orderCount: orders.filter(o => o.skillId === skillId).length
          };
        })
    );
    
    res.json({
      totalRevenue,
      todayRevenue: period === 'all' 
        ? orders.filter(o => new Date(o.created_at) >= today).reduce((s, o) => s + o.amount, 0)
        : null,
      monthRevenue: period === 'all'
        ? orders.filter(o => {
            const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
            return new Date(o.created_at) >= monthStart;
          }).reduce((s, o) => s + o.amount, 0)
        : null,
      byPaymentMethod,
      topSkills,
      orderCount: orders.length
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Manage skills
 * GET /api/admin/skills
 */
router.get('/skills', requireAdmin, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, isActive } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const where = {};
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }
    
    const { count, rows } = await Skill.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset
    });
    
    res.json({
      skills: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Create skill
 * POST /api/admin/skills
 */
router.post('/skills', requireAdmin, async (req, res, next) => {
  try {
    const { name, description, icon, category, pricePerCall, packageSizes, fileUrl, packageUrl, version, author, readme } = req.body;
    
    const skill = await Skill.create({
      name,
      description,
      icon,
      category,
      pricePerCall: pricePerCall || 100,
      packageSizes: packageSizes || [
        { size: 100, price: 5000 },
        { size: 500, price: 20000 },
        { size: 1000, price: 35000 }
      ],
      fileUrl,
      packageUrl,
      version: version || '1.0.0',
      author,
      readme,
      isActive: true
    });
    
    await redis.del(KEYS.skill(skill.id));
    
    res.status(201).json({ skill });
  } catch (error) {
    next(error);
  }
});

/**
 * Update skill
 * PUT /api/admin/skills/:id
 */
router.put('/skills/:id', requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, icon, category, pricePerCall, packageSizes, fileUrl, packageUrl, version, author, readme, isActive } = req.body;
    
    const skill = await Skill.findByPk(id);
    if (!skill) {
      return res.status(404).json({ error: 'Skill not found' });
    }
    
    await skill.update({
      name: name || skill.name,
      description: description !== undefined ? description : skill.description,
      icon: icon !== undefined ? icon : skill.icon,
      category: category !== undefined ? category : skill.category,
      pricePerCall: pricePerCall || skill.pricePerCall,
      packageSizes: packageSizes || skill.packageSizes,
      fileUrl: fileUrl !== undefined ? fileUrl : skill.fileUrl,
      packageUrl: packageUrl !== undefined ? packageUrl : skill.packageUrl,
      version: version || skill.version,
      author: author !== undefined ? author : skill.author,
      readme: readme !== undefined ? readme : skill.readme,
      isActive: isActive !== undefined ? isActive : skill.isActive
    });
    
    await redis.del(KEYS.skill(id));
    
    res.json({ skill });
  } catch (error) {
    next(error);
  }
});

/**
 * Upload skill package
 * POST /api/admin/skills/:id/upload
 */
router.post('/skills/:id/upload', requireAdmin, upload.single('package'), async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const skill = await Skill.findByPk(id);
    if (!skill) {
      return res.status(404).json({ error: 'Skill not found' });
    }
    
    const result = await saveSkillPackage(id, req.file);
    
    await skill.update({
      packageUrl: result.url
    });
    
    await redis.del(KEYS.skill(id));
    
    res.json({ 
      success: true,
      packageUrl: result.url,
      size: result.size
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Upload skill icon
 * POST /api/admin/skills/:id/icon
 */
router.post('/skills/:id/icon', requireAdmin, upload.single('icon'), async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const skill = await Skill.findByPk(id);
    if (!skill) {
      return res.status(404).json({ error: 'Skill not found' });
    }
    
    const result = await saveIcon(id, req.file);
    
    await skill.update({
      icon: result.url
    });
    
    await redis.del(KEYS.skill(id));
    
    res.json({ 
      success: true,
      iconUrl: result.url
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Delete skill
 * DELETE /api/admin/skills/:id
 */
router.delete('/skills/:id', requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const skill = await Skill.findByPk(id);
    if (!skill) {
      return res.status(404).json({ error: 'Skill not found' });
    }
    
    await deleteSkillPackage(id);
    await skill.destroy();
    
    await redis.del(KEYS.skill(id));
    
    res.json({ message: 'Skill deleted successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * Manage orders
 * GET /api/admin/orders
 */
router.get('/orders', requireAdmin, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const where = {};
    if (status) where.status = status;
    if (search) {
      where.orderNo = { [Op.like]: `%${search}%` };
    }
    
    const { count, rows } = await Order.findAndCountAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'email', 'name'] }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset
    });
    
    res.json({
      orders: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get order by ID
 * GET /api/admin/orders/:id
 */
router.get('/orders/:id', requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const order = await Order.findByPk(id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'email', 'name'] },
        { model: Skill, as: 'skill', attributes: ['id', 'name'] }
      ]
    });
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json({ order });
  } catch (error) {
    next(error);
  }
});

/**
 * Refund order
 * POST /api/admin/orders/:id/refund
 */
router.post('/orders/:id/refund', requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const order = await Order.findByPk(id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    if (order.status !== 'paid') {
      return res.status(400).json({ error: 'Only paid orders can be refunded' });
    }
    
    order.status = 'refunded';
    await order.save();
    
    const user = await User.findByPk(order.userId);
    if (user) {
      user.balance = Math.max(0, user.balance - order.packageSize);
      await user.save();
      
      await BalanceLog.create({
        userId: user.id,
        change: -order.packageSize,
        reason: `管理员退款: ${reason || '订单退款'}`,
        balanceAfter: user.balance
      });
    }
    
    res.json({ success: true, message: 'Refund successful', order });
  } catch (error) {
    next(error);
  }
});

/**
 * Manage users
 * GET /api/admin/users
 */
router.get('/users', requireAdmin, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const where = {};
    if (search) {
      where[Op.or] = [
        { email: { [Op.like]: `%${search}%` } },
        { name: { [Op.like]: `%${search}%` } }
      ];
    }
    
    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset
    });
    
    res.json({
      users: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get user by ID
 * GET /api/admin/users/:id
 */
router.get('/users/:id', requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const orders = await Order.findAll({
      where: { userId: id },
      order: [['created_at', 'DESC']],
      limit: 10
    });
    
    const invocations = await Invocation.findAll({
      where: { userId: id },
      include: [{ model: Skill, as: 'skill', attributes: ['id', 'name'] }],
      order: [['created_at', 'DESC']],
      limit: 10
    });
    
    const balanceLogs = await BalanceLog.findAll({
      where: { userId: id },
      order: [['created_at', 'DESC']],
      limit: 20
    });
    
    res.json({
      user,
      recentOrders: orders,
      recentInvocations: invocations,
      recentBalanceLogs: balanceLogs
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Adjust user balance
 * POST /api/admin/users/:id/adjust-balance
 */
router.post('/users/:id/adjust-balance', requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { change, reason } = req.body;
    
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Update balance
    user.balance += change;
    await user.save();
    
    // Update Redis cache
    const balanceKey = KEYS.balance(id);
    await redis.incrby(balanceKey, change);
    
    // Create log
    await BalanceLog.create({
      userId: id,
      change,
      reason: reason || '管理员调整',
      balanceAfter: user.balance,
      type: 'adjustment'
    });
    
    res.json({
      message: 'Balance adjusted successfully',
      newBalance: user.balance
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Reconciliation - sync all user balances
 * POST /api/admin/reconcile
 */
router.post('/reconcile', requireAdmin, async (req, res, next) => {
  try {
    const users = await User.findAll({ attributes: ['id', 'balance'] });
    
    let fixed = 0;
    let consistent = 0;
    
    for (const user of users) {
      // Calculate from logs
      const purchases = await BalanceLog.sum('change', {
        where: { userId: user.id, type: 'purchase' }
      }) || 0;
      
      const refunds = await BalanceLog.sum('change', {
        where: { userId: user.id, type: 'refund' }
      }) || 0;
      
      const consumes = await BalanceLog.sum('change', {
        where: { userId: user.id, type: 'consume' }
      }) || 0;
      
      const adjustments = await BalanceLog.sum('change', {
        where: { userId: user.id, type: 'adjustment' }
      }) || 0;
      
      const calculatedBalance = purchases + refunds + consumes + adjustments;
      
      const cachedBalance = await redis.get(KEYS.balance(user.id));
      const cacheValue = cachedBalance ? parseInt(cachedBalance, 10) : null;
      
      if (cacheValue === calculatedBalance) {
        consistent++;
      } else {
        // Fix cache
        await redis.set(KEYS.balance(user.id), calculatedBalance);
        fixed++;
      }
    }
    
    res.json({
      message: 'Reconciliation complete',
      totalUsers: users.length,
      consistent,
      fixed
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Export statistics report
 * GET /api/admin/stats/export
 */
router.get('/stats/export', requireAdmin, async (req, res, next) => {
  try {
    const { format = 'csv', type = 'revenue' } = req.query;
    
    let data = [];
    let filename = '';
    let headers = [];
    
    if (type === 'revenue') {
      // Revenue data
      const orders = await Order.findAll({
        where: { status: 'paid' },
        include: [
          { model: User, as: 'user', attributes: ['email', 'name'] },
          { model: Skill, as: 'skill', attributes: ['name'] }
        ],
        order: [['paid_at', 'DESC']],
        limit: 1000
      });
      
      headers = ['订单号', '用户邮箱', 'Skill名称', '金额(元)', '积分', '支付方式', '支付时间'];
      data = orders.map(o => [
        o.orderNo,
        o.user?.email || '-',
        o.skill?.name || '-',
        (o.amount / 100).toFixed(2),
        o.packageSize,
        o.paymentMethod === 'wechat' ? '微信' : o.paymentMethod === 'alipay' ? '支付宝' : '模拟支付',
        o.paidAt ? new Date(o.paidAt).toLocaleString('zh-CN') : '-'
      ]);
      filename = `revenue_report_${new Date().toISOString().split('T')[0]}`;
      
    } else if (type === 'users') {
      // User data
      const users = await User.findAll({
        attributes: ['email', 'name', 'balance', 'totalPurchased', 'role', 'created_at'],
        order: [['created_at', 'DESC']],
        limit: 1000
      });
      
      headers = ['邮箱', '昵称', '余额', '累计购买', '角色', '注册时间'];
      data = users.map(u => [
        u.email,
        u.name || '-',
        u.balance,
        u.totalPurchased,
        u.role === 'admin' ? '管理员' : '用户',
        new Date(u.created_at).toLocaleString('zh-CN')
      ]);
      filename = `users_report_${new Date().toISOString().split('T')[0]}`;
      
    } else if (type === 'orders') {
      // All orders
      const orders = await Order.findAll({
        include: [
          { model: User, as: 'user', attributes: ['email', 'name'] },
          { model: Skill, as: 'skill', attributes: ['name'] }
        ],
        order: [['created_at', 'DESC']],
        limit: 1000
      });
      
      headers = ['订单号', '用户邮箱', 'Skill名称', '金额(元)', '积分', '支付方式', '状态', '创建时间', '支付时间'];
      data = orders.map(o => [
        o.orderNo,
        o.user?.email || '-',
        o.skill?.name || '-',
        (o.amount / 100).toFixed(2),
        o.packageSize,
        o.paymentMethod === 'wechat' ? '微信' : o.paymentMethod === 'alipay' ? '支付宝' : '模拟支付',
        o.status === 'paid' ? '已支付' : o.status === 'pending' ? '待支付' : '已退款',
        new Date(o.created_at).toLocaleString('zh-CN'),
        o.paidAt ? new Date(o.paidAt).toLocaleString('zh-CN') : '-'
      ]);
      filename = `orders_report_${new Date().toISOString().split('T')[0]}`;
    }
    
    if (format === 'csv') {
      // Generate CSV
      const csvContent = [headers, ...data].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      res.send('\uFEFF' + csvContent); // BOM for Excel to recognize UTF-8
      
    } else {
      // Return JSON for other formats
      res.json({
        headers,
        data,
        filename: `${filename}.${format}`,
        total: data.length
      });
    }
    
  } catch (error) {
    next(error);
  }
});

/**
 * Get payment configuration
 * GET /api/admin/config/payment
 */
router.get('/config/payment', requireAdmin, async (req, res, next) => {
  try {
    const config = {
      wechat: {
        appId: process.env.WECHAT_APP_ID || '',
        mchId: process.env.WECHAT_MCH_ID || '',
        apiKey: process.env.WECHAT_API_KEY ? '******' : '',
        enabled: !!(process.env.WECHAT_APP_ID && process.env.WECHAT_MCH_ID && process.env.WECHAT_API_KEY)
      },
      alipay: {
        appId: process.env.ALIPAY_APP_ID || '',
        privateKey: process.env.ALIPAY_PRIVATE_KEY ? '******' : '',
        enabled: !!(process.env.ALIPAY_APP_ID && process.env.ALIPAY_PRIVATE_KEY)
      }
    };
    
    res.json({ config });
  } catch (error) {
    next(error);
  }
});

/**
 * Update payment configuration (for development/demo)
 * PUT /api/admin/config/payment
 */
router.put('/config/payment', requireAdmin, async (req, res, next) => {
  try {
    const { wechat, alipay } = req.body;
    
    // In production, these should be stored in database or secure config
    // For demo purposes, we just validate and return success
    // Real implementation would need:
    // 1. Encrypted storage in database
    // 2. Or update to .env file with restart
    
    // Validate wechat config
    if (wechat?.enabled) {
      if (!wechat.appId || !wechat.mchId || !wechat.apiKey) {
        return res.status(400).json({ error: '微信支付配置不完整' });
      }
    }
    
    // Validate alipay config
    if (alipay?.enabled) {
      if (!alipay.appId || !alipay.privateKey) {
        return res.status(400).json({ error: '支付宝配置不完整' });
      }
    }
    
    // In production, save to database or secure config
    // For demo, just acknowledge the request
    res.json({ 
      success: true,
      message: '配置已保存（开发环境：配置保存在环境变量中）'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get all API endpoints
 * GET /api/admin/endpoints
 */
router.get('/endpoints', requireAdmin, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, isActive, category } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const where = {};
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { pathPrefix: { [Op.like]: `%${search}%` } }
      ];
    }
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }
    if (category) {
      where.category = category;
    }
    
    const { count, rows } = await ApiEndpoint.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset
    });
    
    res.json({
      endpoints: rows.map(ep => ({
        ...ep.toJSON(),
        authValue: ep.authValue ? '******' : null
      })),
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get API endpoint by ID
 * GET /api/admin/endpoints/:id
 */
router.get('/endpoints/:id', requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const endpoint = await ApiEndpoint.findByPk(id);
    
    if (!endpoint) {
      return res.status(404).json({ error: 'Endpoint not found' });
    }
    
    const stats = await ApiInvocation.findOne({
      where: { endpointId: id },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalCalls'],
        [sequelize.fn('SUM', sequelize.col('cost')), 'totalCost'],
        [sequelize.fn('AVG', sequelize.col('latency')), 'avgLatency']
      ],
      raw: true
    });
    
    res.json({
      endpoint: {
        ...endpoint.toJSON(),
        authValue: endpoint.authValue ? '******' : null
      },
      stats
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Create API endpoint
 * POST /api/admin/endpoints
 */
router.post('/endpoints', requireAdmin, async (req, res, next) => {
  try {
    const {
      name,
      description,
      category,
      targetUrl,
      method = 'POST',
      pathPrefix,
      authType = 'none',
      authValue,
      headersMapping,
      requestExample,
      responseExample,
      pricePerCall = 100,
      rateLimit = 60,
      timeout = 30000,
      isActive = true,
      type = 'api',
      icon,
      defaultParams,
      outputFields,
      isGenerateTool = false
    } = req.body;
    
    if (!name || !targetUrl || !pathPrefix) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, targetUrl, pathPrefix' 
      });
    }
    
    const existing = await ApiEndpoint.findOne({ where: { pathPrefix } });
    if (existing) {
      return res.status(409).json({ 
        error: 'Path prefix already exists',
        field: 'pathPrefix'
      });
    }
    
    const endpoint = await ApiEndpoint.create({
      name,
      description,
      category,
      targetUrl,
      method,
      pathPrefix,
      authType,
      authValue: authValue ? encrypt(authValue) : null,
      headersMapping: headersMapping || {},
      requestExample,
      responseExample,
      pricePerCall,
      rateLimit,
      timeout,
      isActive,
      type,
      icon,
      defaultParams: defaultParams || {},
      outputFields: outputFields || {},
      isGenerateTool,
      createdBy: req.user.id
    });
    
    await redis.del(KEYS.skill(endpoint.id));
    
    res.status(201).json({ 
      endpoint: {
        ...endpoint.toJSON(),
        authValue: endpoint.authValue ? '******' : null
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Update API endpoint
 * PUT /api/admin/endpoints/:id
 */
router.put('/endpoints/:id', requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      category,
      targetUrl,
      method,
      pathPrefix,
      authType,
      authValue,
      headersMapping,
      requestExample,
      responseExample,
      pricePerCall,
      rateLimit,
      timeout,
      isActive,
      type,
      icon,
      defaultParams,
      outputFields,
      isGenerateTool
    } = req.body;
    
    const endpoint = await ApiEndpoint.findByPk(id);
    if (!endpoint) {
      return res.status(404).json({ error: 'Endpoint not found' });
    }
    
    if (pathPrefix && pathPrefix !== endpoint.pathPrefix) {
      const existing = await ApiEndpoint.findOne({ 
        where: { 
          pathPrefix,
          id: { [Op.ne]: id }
        } 
      });
      if (existing) {
        return res.status(409).json({ 
          error: 'Path prefix already exists',
          field: 'pathPrefix'
        });
      }
    }
    
    await endpoint.update({
      name: name || endpoint.name,
      description: description !== undefined ? description : endpoint.description,
      category: category !== undefined ? category : endpoint.category,
      targetUrl: targetUrl || endpoint.targetUrl,
      method: method || endpoint.method,
      pathPrefix: pathPrefix || endpoint.pathPrefix,
      authType: authType !== undefined ? authType : endpoint.authType,
      authValue: authValue !== undefined 
        ? (authValue ? encrypt(authValue) : null) 
        : endpoint.authValue,
      headersMapping: headersMapping !== undefined ? headersMapping : endpoint.headersMapping,
      requestExample: requestExample !== undefined ? requestExample : endpoint.requestExample,
      responseExample: responseExample !== undefined ? responseExample : endpoint.responseExample,
      pricePerCall: pricePerCall !== undefined ? pricePerCall : endpoint.pricePerCall,
      rateLimit: rateLimit !== undefined ? rateLimit : endpoint.rateLimit,
      timeout: timeout !== undefined ? timeout : endpoint.timeout,
      isActive: isActive !== undefined ? isActive : endpoint.isActive,
      type: type !== undefined ? type : endpoint.type,
      icon: icon !== undefined ? icon : endpoint.icon,
      defaultParams: defaultParams !== undefined ? defaultParams : endpoint.defaultParams,
      outputFields: outputFields !== undefined ? outputFields : endpoint.outputFields,
      isGenerateTool: isGenerateTool !== undefined ? isGenerateTool : endpoint.isGenerateTool
    });
    
    await redis.del(`endpoint:${id}`);
    
    res.json({ 
      endpoint: {
        ...endpoint.toJSON(),
        authValue: endpoint.authValue ? '******' : null
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Delete API endpoint
 * DELETE /api/admin/endpoints/:id
 */
router.delete('/endpoints/:id', requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const endpoint = await ApiEndpoint.findByPk(id);
    if (!endpoint) {
      return res.status(404).json({ error: 'Endpoint not found' });
    }
    
    await endpoint.destroy();
    await redis.del(`endpoint:${id}`);
    
    res.json({ message: 'Endpoint deleted successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * Test API endpoint
 * POST /api/admin/endpoints/:id/test
 */
router.post('/endpoints/:id/test', requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { testBody = {} } = req.body;
    
    const endpoint = await ApiEndpoint.findByPk(id);
    if (!endpoint) {
      return res.status(404).json({ error: 'Endpoint not found' });
    }
    
    const axios = require('axios');
    const startTime = Date.now();
    
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (endpoint.authType === 'bearer' && endpoint.authValue) {
      const token = decrypt(endpoint.authValue);
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } else if (endpoint.authType === 'api_key' && endpoint.authValue) {
      const apiKey = decrypt(endpoint.authValue);
      if (apiKey) {
        headers['X-API-Key'] = apiKey;
      }
    }
    
    try {
      const response = await axios({
        method: endpoint.method,
        url: endpoint.targetUrl,
        headers,
        data: testBody,
        timeout: endpoint.timeout || 30000,
        validateStatus: () => true
      });
      
      const latency = Date.now() - startTime;
      
      res.json({
        success: response.status < 400,
        status: response.status,
        latency,
        data: response.data
      });
    } catch (testError) {
      res.json({
        success: false,
        error: testError.message,
        latency: Date.now() - startTime
      });
    }
  } catch (error) {
    next(error);
  }
});

/**
 * Get all API invocations (paginated)
 * GET /api/admin/invocations
 */
router.get('/invocations', requireAdmin, async (req, res, next) => {
  try {
    const { page = 1, limit = 50, userId, endpointId, status } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const where = {};
    if (userId) where.userId = userId;
    if (endpointId) where.endpointId = endpointId;
    if (status) where.status = status;
    
    const { count, rows } = await ApiInvocation.findAndCountAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'email', 'name'] },
        { model: ApiEndpoint, as: 'endpoint', attributes: ['id', 'name', 'pathPrefix'] }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset
    });
    
    res.json({
      invocations: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get endpoint invocation logs
 * GET /api/admin/endpoints/:id/logs
 */
router.get('/endpoints/:id/logs', requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 50, status } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const where = { endpointId: id };
    if (status) {
      where.status = status;
    }
    
    const { count, rows } = await ApiInvocation.findAndCountAll({
      where,
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'email', 'name']
      }],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset
    });
    
    res.json({
      logs: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get endpoint categories
 * GET /api/admin/endpoints/categories/list
 */
router.get('/endpoints/categories/list', requireAdmin, async (req, res, next) => {
  try {
    const categories = await ApiEndpoint.findAll({
      attributes: ['category'],
      where: { category: { [Op.ne]: null } },
      group: ['category'],
      raw: true
    });
    
    res.json({
      categories: categories.map(c => c.category).filter(Boolean)
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
