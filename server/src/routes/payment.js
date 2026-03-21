const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { Order, User, BalanceLog, Skill } = require('../models');
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

router.post('/create', authenticate, async (req, res, next) => {
  try {
    const { orderId, paymentMethod } = req.body;
    
    const order = await Order.findByPk(orderId, {
      include: [{ model: Skill, as: 'skill' }]
    });
    
    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }
    
    if (order.status !== 'pending') {
      return res.status(400).json({ error: '订单已支付或已取消' });
    }
    
    // Mock payment - development mode
    if (paymentMethod === 'mock' || process.env.PAYMENT_MODE === 'mock') {
      const mockPaymentUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/payment/${order.orderNo}`;
      
      return res.json({
        paymentUrl: mockPaymentUrl,
        orderNo: order.orderNo,
        qrCode: null,
        paymentMethod: 'mock',
        amount: order.amount,
        packageSize: order.packageSize
      });
    }
    
    // WeChat Pay
    if (paymentMethod === 'wechat') {
      // TODO: 实际调用微信支付API
      // const wechatPay = require('../utils/wechat-pay');
      // const result = await wechatPay.createNativeOrder(order);
      
      const mockPaymentUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/payment/${order.orderNo}`;
      
      return res.json({
        paymentUrl: mockPaymentUrl,
        orderNo: order.orderNo,
        qrCode: `weixin://wxpay/bizpayurl?pr=${order.orderNo}`,
        paymentMethod: 'wechat',
        amount: order.amount,
        packageSize: order.packageSize
      });
    }
    
    // Alipay
    if (paymentMethod === 'alipay') {
      // TODO: 实际调用支付宝API
      // const alipay = require('../utils/alipay');
      // const result = await alipay.createPagePay(order);
      
      const mockPaymentUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/payment/${order.orderNo}`;
      
      return res.json({
        paymentUrl: mockPaymentUrl,
        orderNo: order.orderNo,
        qrCode: `https://qr.alipay.com/${order.orderNo}`,
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

router.get('/status/:orderNo', authenticate, async (req, res, next) => {
  try {
    const { orderNo } = req.params;
    
    const order = await Order.findOne({
      where: { orderNo },
      include: [
        { model: User, as: 'user', attributes: ['id', 'email', 'name', 'balance'] },
        { model: Skill, as: 'skill', attributes: ['id', 'name'] }
      ]
    });
    
    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }
    
    if (order.userId !== req.user.userId) {
      return res.status(403).json({ error: '无权访问此订单' });
    }
    
    res.json({
      orderNo: order.orderNo,
      status: order.status,
      amount: order.amount,
      packageSize: order.packageSize,
      paymentMethod: order.paymentMethod,
      paidAt: order.paidAt,
      createdAt: order.created_at,
      user: order.user,
      skill: order.skill
    });
    
  } catch (error) {
    next(error);
  }
});

router.post('/mock-pay', authenticate, async (req, res, next) => {
  try {
    const { orderNo } = req.body;
    
    const order = await Order.findOne({ where: { orderNo } });
    
    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }
    
    if (order.userId !== req.user.userId) {
      return res.status(403).json({ error: '无权操作此订单' });
    }
    
    if (order.status !== 'pending') {
      return res.status(400).json({ error: '订单已支付或已取消' });
    }
    
    // Process payment
    await processSuccessfulPayment(orderNo, `MOCK_${Date.now()}`, 'mock');
    
    res.json({
      success: true,
      message: '模拟支付成功',
      orderNo: order.orderNo,
      newBalance: await getUserBalance(order.userId)
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * WeChat Pay callback
 * POST /api/payment/callback/wechat
 */
router.post('/callback/wechat', async (req, res, next) => {
  try {
    const { out_trade_no, transaction_id, result_code } = req.body;
    
    // TODO: 验证微信支付签名
    
    if (result_code === 'SUCCESS') {
      await processSuccessfulPayment(out_trade_no, transaction_id, 'wechat');
    }
    
    res.set('Content-Type', 'text/xml');
    res.send('<xml><return_code><![CDATA[SUCCESS]]></return_code></xml>');
  } catch (error) {
    console.error('WeChat callback error:', error);
    res.set('Content-Type', 'text/xml');
    res.send('<xml><return_code><![CDATA[FAIL]]></return_code></xml>');
  }
});

/**
 * Alipay callback
 * POST /api/payment/callback/alipay
 */
router.post('/callback/alipay', async (req, res, next) => {
  try {
    const { out_trade_no, trade_no, trade_status } = req.body;
    
    // TODO: 验证支付宝签名
    
    if (trade_status === 'TRADE_SUCCESS' || trade_status === 'TRADE_FINISHED') {
      await processSuccessfulPayment(out_trade_no, trade_no, 'alipay');
    }
    
    res.send('success');
  } catch (error) {
    console.error('Alipay callback error:', error);
    res.send('fail');
  }
});

/**
 * Process successful payment
 */
async function processSuccessfulPayment(orderNo, transactionId, paymentMethod) {
  const order = await Order.findOne({ where: { orderNo } });
  
  if (!order || order.status !== 'pending') {
    return;
  }
  
  // Update order status
  order.status = 'paid';
  order.transactionId = transactionId;
  order.paidAt = new Date();
  await order.save();
  
  // Get user
  const user = await User.findByPk(order.userId);
  if (!user) return;
  
  // Update user balance in database
  user.balance += order.packageSize;
  user.totalPurchased += order.packageSize;
  await user.save();
  
  // Update Redis cache
  const balanceKey = KEYS.balance(user.id);
  await redis.incrby(balanceKey, order.packageSize);
  
  // Create balance log
  await BalanceLog.create({
    userId: user.id,
    change: order.packageSize,
    reason: `购买次数包 (${paymentMethod === 'mock' ? '模拟支付' : paymentMethod === 'wechat' ? '微信' : '支付宝'})`,
    balanceAfter: user.balance,
    relatedId: order.id,
    type: 'purchase'
  });
  
  console.log(`[PAYMENT] Order ${orderNo} paid successfully. Added ${order.packageSize} to user ${user.id}`);
}

/**
 * Get user balance
 */
async function getUserBalance(userId) {
  const cached = await redis.get(KEYS.balance(userId));
  if (cached !== null) {
    return parseInt(cached, 10);
  }
  
  const user = await User.findByPk(userId, { attributes: ['balance'] });
  if (user) {
    await redis.set(KEYS.balance(userId), user.balance);
    return user.balance;
  }
  return 0;
}

module.exports = router;