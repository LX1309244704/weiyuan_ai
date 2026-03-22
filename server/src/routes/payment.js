const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { Order, User, BalanceLog } = require('../models');
const { redis, KEYS } = require('../config/redis');

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
 * 创建支付
 * POST /api/payment/create
 */
router.post('/create', authenticate, async (req, res, next) => {
  try {
    const { orderId, paymentMethod } = req.body;
    
    const order = await Order.findByPk(orderId);
    
    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }
    
    if (order.status !== 'pending') {
      return res.status(400).json({ error: '订单已支付或已取消' });
    }
    
    // Mock payment - 开发模式
    if (paymentMethod === 'mock' || process.env.PAYMENT_MODE === 'mock') {
      const mockPaymentUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/payment/${order.id}`;
      
      return res.json({
        success: true,
        paymentUrl: mockPaymentUrl,
        paymentMethod: 'mock',
        amount: order.amount,
        packageSize: order.packageSize
      });
    }
    
    // WeChat Pay
    if (paymentMethod === 'wechat') {
      const mockPaymentUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/payment/${order.id}`;
      
      return res.json({
        success: true,
        paymentUrl: mockPaymentUrl,
        qrCode: `weixin://wxpay/bizpayurl?pr=${order.id}`,
        paymentMethod: 'wechat',
        amount: order.amount,
        packageSize: order.packageSize
      });
    }
    
    // Alipay
    if (paymentMethod === 'alipay') {
      const mockPaymentUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/payment/${order.id}`;
      
      return res.json({
        success: true,
        paymentUrl: mockPaymentUrl,
        qrCode: `https://qr.alipay.com/${order.id}`,
        paymentMethod: 'alipay',
        amount: order.amount,
        packageSize: order.packageSize
      });
    }
    
    return res.status(400).json({ error: '不支持的支付方式' });
    
  } catch (error) {
    next(error);
  }
});

/**
 * 支付回调（模拟）
 * POST /api/payment/callback
 */
router.post('/callback', async (req, res, next) => {
  try {
    const { orderId } = req.body;
    
    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }
    
    if (order.status !== 'pending') {
      return res.status(400).json({ error: '订单状态异常' });
    }
    
    // 更新订单状态
    order.status = 'paid';
    order.paidAt = new Date();
    await order.save();
    
    // 增加用户余额
    const user = await User.findByPk(order.userId);
    if (user) {
      user.balance += order.packageSize;
      await user.save();
      
      // 更新 Redis 缓存
      await redis.set(KEYS.balance(user.id), user.balance, 'EX', 86400);
      
      // 记录余额变动
      await BalanceLog.create({
        userId: user.id,
        change: order.packageSize,
        reason: `购买积分套餐`,
        balanceAfter: user.balance,
        type: 'recharge',
        relatedId: order.id
      });
    }
    
    res.json({ success: true, message: '支付成功' });
  } catch (error) {
    next(error);
  }
});

/**
 * 模拟支付完成（开发用）
 * POST /api/payment/mock-complete/:orderId
 */
router.post('/mock-complete/:orderId', authenticate, async (req, res, next) => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }
    
    if (order.userId !== req.user.userId) {
      return res.status(403).json({ error: '无权操作此订单' });
    }
    
    if (order.status !== 'pending') {
      return res.status(400).json({ error: '订单已支付或已取消' });
    }
    
    // 更新订单状态
    order.status = 'paid';
    order.paidAt = new Date();
    await order.save();
    
    // 增加用户余额
    const user = await User.findByPk(order.userId);
    if (user) {
      user.balance += order.packageSize;
      await user.save();
      
      // 更新 Redis 缓存
      await redis.set(KEYS.balance(user.id), user.balance, 'EX', 86400);
      
      // 记录余额变动
      await BalanceLog.create({
        userId: user.id,
        change: order.packageSize,
        reason: `购买积分套餐（模拟支付）`,
        balanceAfter: user.balance,
        type: 'recharge',
        relatedId: order.id
      });
    }
    
    res.json({ 
      success: true, 
      message: '支付成功',
      newBalance: user.balance
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
