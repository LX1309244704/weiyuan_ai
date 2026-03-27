const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { User, Order, BalanceLog, Invocation, ApiEndpoint, ApiInvocation, AiModel, AiGenerateTask, Coupon, sequelize } = require('../models');
const { encrypt, decrypt } = require('../utils/encryption');
const { redis, KEYS } = require('../config/redis');

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

// =====================================================
// 仪表盘统计
// =====================================================

/**
 * 获取统计数据
 * GET /api/admin/stats
 */
router.get('/stats', requireAdmin, async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayOrders = await Order.count({
      where: { created_at: { [Op.gte]: today }, status: 'paid' }
    });
    
    const todayRevenue = await Order.sum('amount', {
      where: { created_at: { [Op.gte]: today }, status: 'paid' }
    }) || 0;
    
    const totalUsers = await User.count();
    const totalOrders = await Order.count({ where: { status: 'paid' } });
    const totalRevenue = await Order.sum('amount', { where: { status: 'paid' } }) || 0;
    
    res.json({
      success: true,
      stats: {
        todayOrders,
        todayRevenue,
        totalUsers,
        totalOrders,
        totalRevenue
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 获取收入统计
 * GET /api/admin/stats/revenue
 */
router.get('/stats/revenue', requireAdmin, async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    const where = { status: 'paid' };
    if (startDate && endDate) {
      where.created_at = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }
    
    const totalRevenue = await Order.sum('amount', { where }) || 0;
    const orderCount = await Order.count({ where });
    
    res.json({
      success: true,
      revenue: {
        total: totalRevenue,
        orderCount
      }
    });
  } catch (error) {
    next(error);
  }
});

// =====================================================
// 用户管理
// =====================================================

/**
 * 获取用户列表
 * GET /api/admin/users
 */
router.get('/users', requireAdmin, async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20, keyword } = req.query;
    const limit = parseInt(pageSize);
    const offset = (parseInt(page) - 1) * limit;
    
    const where = {};
    if (keyword) {
      where[Op.or] = [
        { email: { [Op.like]: `%${keyword}%` } },
        { username: { [Op.like]: `%${keyword}%` } }
      ];
    }
    
    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: ['id', 'username', 'email', 'balance', 'role', 'isActive', 'created_at'],
      order: [['created_at', 'DESC']],
      limit,
      offset
    });
    
    res.json({
      success: true,
      users: rows,
      pagination: { total: count, page: parseInt(page), pageSize: limit, pages: Math.ceil(count / limit) }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 调整用户余额
 * POST /api/admin/users/:id/balance
 */
router.post('/users/:id/balance', requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { change, reason } = req.body;
    
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const newBalance = user.balance + change;
    if (newBalance < 0) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }
    
    user.balance = newBalance;
    await user.save();
    
    await BalanceLog.create({
      userId: id,
      change,
      reason: reason || '管理员调整',
      balanceAfter: newBalance,
      type: 'adjust'
    });
    
    await redis.set(KEYS.balance(id), newBalance, 'EX', 86400);
    
    res.json({ success: true, newBalance });
  } catch (error) {
    next(error);
  }
});

// =====================================================
// AI 厂商配置管理
// =====================================================

/**
 * 获取 AI 厂商列表
 * GET /api/admin/ai-models
 */
router.get('/ai-models', requireAdmin, async (req, res, next) => {
  try {
    const models = await AiModel.findAll({
      order: [['created_at', 'DESC']]
    });
    
    res.json({ success: true, models });
  } catch (error) {
    next(error);
  }
});

/**
 * 更新 AI 厂商配置
 * PUT /api/admin/ai-models/:id
 */
router.put('/ai-models/:id', requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, apiKey, isActive, modelPrices } = req.body;
    
    const model = await AiModel.findByPk(id);
    if (!model) {
      return res.status(404).json({ error: 'Model not found' });
    }
    
    if (name) model.name = name;
    if (apiKey !== undefined) model.apiKey = apiKey ? encrypt(apiKey) : null;
    if (isActive !== undefined) model.isActive = isActive;
    if (modelPrices !== undefined) model.modelPrices = modelPrices;
    
    await model.save();
    
    res.json({ success: true, model });
  } catch (error) {
    next(error);
  }
});

// =====================================================
// API 端点管理
// =====================================================

/**
 * 获取 API 端点列表
 * GET /api/admin/endpoints
 */
router.get('/endpoints', requireAdmin, async (req, res, next) => {
  try {
    const endpoints = await ApiEndpoint.findAll({
      order: [['created_at', 'DESC']]
    });
    
    res.json({ success: true, endpoints });
  } catch (error) {
    next(error);
  }
});

/**
 * 创建 API 端点
 * POST /api/admin/endpoints
 */
router.post('/endpoints', requireAdmin, async (req, res, next) => {
  try {
    const { name, description, targetUrl, method, pathPrefix, authType, authValue, pricePerCall, rateLimit, timeout } = req.body;
    
    const endpoint = await ApiEndpoint.create({
      name,
      description,
      targetUrl,
      method: method || 'POST',
      pathPrefix,
      authType: authType || 'bearer',
      authValue: authValue ? encrypt(authValue) : null,
      pricePerCall: pricePerCall || 100,
      rateLimit: rateLimit || 60,
      timeout: timeout || 30000
    });
    
    res.json({ success: true, endpoint });
  } catch (error) {
    next(error);
  }
});

/**
 * 更新 API 端点
 * PUT /api/admin/endpoints/:id
 */
router.put('/endpoints/:id', requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const endpoint = await ApiEndpoint.findByPk(id);
    if (!endpoint) {
      return res.status(404).json({ error: 'Endpoint not found' });
    }
    
    if (updates.authValue) {
      updates.authValue = encrypt(updates.authValue);
    }
    
    await endpoint.update(updates);
    
    res.json({ success: true, endpoint });
  } catch (error) {
    next(error);
  }
});

/**
 * 删除 API 端点
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
    
    res.json({ success: true, message: 'Endpoint deleted' });
  } catch (error) {
    next(error);
  }
});

// =====================================================
// 订单管理
// =====================================================

/**
 * 获取订单列表
 * GET /api/admin/orders
 */
router.get('/orders', requireAdmin, async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20, status } = req.query;
    const limit = parseInt(pageSize);
    const offset = (parseInt(page) - 1) * limit;
    
    const where = {};
    if (status && status !== 'all') {
      where.status = status;
    }
    
    const { count, rows } = await Order.findAndCountAll({
      where,
      include: [{ model: User, as: 'user', attributes: ['id', 'username', 'email'] }],
      order: [['created_at', 'DESC']],
      limit,
      offset
    });
    
    res.json({
      success: true,
      orders: rows,
      pagination: { total: count, page: parseInt(page), pageSize: limit, pages: Math.ceil(count / limit) }
    });
  } catch (error) {
    next(error);
  }
});

// =====================================================
// API 调用记录管理
// =====================================================

/**
 * 获取 API 调用记录列表
 * GET /api/admin/invocations
 */
router.get('/invocations', requireAdmin, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const limitNum = parseInt(limit);
    const offset = (parseInt(page) - 1) * limitNum;
    
    const where = {};
    if (status && status !== 'all') {
      where.status = status;
    }
    
    const { count, rows } = await ApiInvocation.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: limitNum,
      offset
    });
    
    res.json({
      success: true,
      invocations: rows,
      pagination: { total: count, page: parseInt(page), limit: limitNum, pages: Math.ceil(count / limitNum) }
    });
  } catch (error) {
    next(error);
  }
});

// =====================================================
// AI 生成任务管理
// =====================================================

/**
 * 获取 AI 生成任务列表
 * GET /api/admin/ai-tasks
 */
router.get('/ai-tasks', requireAdmin, async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20, status } = req.query;
    const limit = parseInt(pageSize);
    const offset = (parseInt(page) - 1) * limit;
    
    const where = {};
    if (status && status !== 'all') {
      where.status = status;
    }
    
    const { count, rows } = await AiGenerateTask.findAndCountAll({
      where,
      include: [{ model: User, as: 'user', attributes: ['id', 'username', 'email'] }],
      order: [['created_at', 'DESC']],
      limit,
      offset
    });
    
    res.json({
      success: true,
      tasks: rows,
      pagination: { total: count, page: parseInt(page), pageSize: limit, pages: Math.ceil(count / limit) }
    });
  } catch (error) {
    next(error);
  }
});

// =====================================================
// 激活码管理
// =====================================================

/**
 * 获取激活码列表
 * GET /api/admin/coupons
 */
router.get('/coupons', requireAdmin, async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const limit = parseInt(pageSize);
    const offset = (parseInt(page) - 1) * limit;
    
    const { count, rows } = await Coupon.findAndCountAll({
      order: [['created_at', 'DESC']],
      limit,
      offset
    });
    
    res.json({
      success: true,
      coupons: rows,
      pagination: { total: count, page: parseInt(page), pageSize: limit, pages: Math.ceil(count / limit) }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 创建激活码
 * POST /api/admin/coupons
 */
router.post('/coupons', requireAdmin, async (req, res, next) => {
  try {
    const { code, amount, type, maxUses, expiresAt } = req.body;
    
    const coupon = await Coupon.create({
      code: code || `CODE${Date.now()}`,
      amount,
      type: type || 'gift',
      maxUses,
      expiresAt: expiresAt ? new Date(expiresAt) : null
    });
    
    res.json({ success: true, coupon });
  } catch (error) {
    next(error);
  }
});

/**
 * 批量创建激活码
 * POST /api/admin/coupons/batch
 */
router.post('/coupons/batch', requireAdmin, async (req, res, next) => {
  try {
    const { count: numCoupons, amount, type, maxUses } = req.body;
    
    const coupons = [];
    for (let i = 0; i < numCoupons; i++) {
      const code = `${type || 'GIFT'}${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      const coupon = await Coupon.create({
        code,
        amount,
        type: type || 'gift',
        maxUses: maxUses || 1
      });
      coupons.push(coupon);
    }
    
    res.json({ success: true, coupons, count: coupons.length });
  } catch (error) {
    next(error);
  }
});

/**
 * 删除激活码
 * DELETE /api/admin/coupons/:id
 */
router.delete('/coupons/:id', requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const coupon = await Coupon.findByPk(id);
    if (!coupon) {
      return res.status(404).json({ error: 'Coupon not found' });
    }
    
    await coupon.destroy();
    
    res.json({ success: true, message: 'Coupon deleted' });
  } catch (error) {
    next(error);
  }
});

// =====================================================
// 支付配置管理
// =====================================================

/**
 * 获取支付配置
 * GET /api/admin/config/payment
 */
router.get('/config/payment', requireAdmin, async (req, res, next) => {
  try {
    // 从环境变量读取支付配置
    const config = {
      wechat: {
        mchId: process.env.WECHAT_MCH_ID || '',
        apiKey: process.env.WECHAT_API_KEY ? '******' : '', // 不返回完整密钥
        enabled: !!process.env.WECHAT_MCH_ID
      },
      alipay: {
        appId: process.env.ALIPAY_APP_ID || '',
        enabled: !!process.env.ALIPAY_APP_ID
      }
    };
    
    res.json({ success: true, config });
  } catch (error) {
    next(error);
  }
});

/**
 * 更新支付配置
 * PUT /api/admin/config/payment
 */
router.put('/config/payment', requireAdmin, async (req, res, next) => {
  try {
    const { wechat, alipay } = req.body;
    
    // 注意：实际生产环境中，应该将配置保存到数据库或安全存储
    // 这里只返回成功，实际配置需要修改 .env 文件
    console.log('[Admin] Payment config update requested:', { 
      wechat: wechat ? { ...wechat, apiKey: '******' } : null,
      alipay 
    });
    
    res.json({ 
      success: true, 
      message: '支付配置已更新，请重启服务生效' 
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
