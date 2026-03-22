const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { Order, User } = require('../models');

const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
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
 * 创建订单
 * POST /api/orders/create
 */
router.post('/create', authenticate, async (req, res, next) => {
  try {
    const { packageSize, paymentMethod } = req.body;
    const userId = req.user.userId;
    
    // 验证用户
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // 计算价格
    const amount = packageSize * 100; // 1元/100积分
    
    // 生成订单号
    const orderNo = `ORD${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    const order = await Order.create({
      userId,
      amount,
      packageSize,
      paymentMethod: paymentMethod || 'wechat',
      status: 'pending'
    });
    
    res.json({
      success: true,
      order: {
        id: order.id,
        orderNo,
        amount,
        packageSize,
        status: order.status
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 获取订单列表
 * GET /api/orders
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const { count, rows } = await Order.findAndCountAll({
      where: { userId: req.user.userId },
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
 * 获取订单详情
 * GET /api/orders/:id
 */
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const order = await Order.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.userId 
      }
    });
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json({ order });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
