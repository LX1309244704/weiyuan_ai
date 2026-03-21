const express = require('express');
const router = express.Router();
const { User, Coupon, BalanceLog } = require('../models');
const { redis, KEYS, TTL } = require('../config/redis');

router.post('/redeem', async (req, res) => {
  const { code } = req.body;
  
  let apiKey = req.headers['x-api-key'] || req.headers['authorization'];
  if (apiKey && apiKey.startsWith('Bearer ')) {
    apiKey = apiKey.substring(7);
  }
  
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'API Key is required'
    });
  }
  
  if (!code) {
    return res.status(400).json({
      success: false,
      error: '兑换码不能为空'
    });
  }
  
  const user = await User.findOne({ where: { apiKey } });
  if (!user) {
    return res.status(401).json({
      success: false,
      error: '无效的API Key'
    });
  }
  
  try {
    const coupon = await Coupon.findOne({
      where: {
        code: code.toUpperCase(),
        isActive: true
      }
    });
    
    if (!coupon) {
      return res.status(404).json({
        success: false,
        error: '兑换码不存在或已失效'
      });
    }
    
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return res.status(400).json({
        success: false,
        error: '兑换码已过期'
      });
    }
    
    if (coupon.usedCount >= coupon.maxUses) {
      return res.status(400).json({
        success: false,
        error: '兑换码已达使用上限'
      });
    }
    
    const amount = coupon.amount;
    const balanceKey = KEYS.balance(user.id);
    
    let currentBalance = await redis.get(balanceKey);
    if (currentBalance === null) {
      currentBalance = user.balance;
      await redis.set(balanceKey, currentBalance, 'EX', TTL.INVOCATION_CHECK);
    } else {
      currentBalance = parseInt(currentBalance, 10);
    }
    
    const newBalance = currentBalance + amount;
    await redis.set(balanceKey, newBalance, 'EX', TTL.INVOCATION_CHECK);
    
    user.balance = newBalance;
    await user.save();
    
    coupon.usedCount += 1;
    if (coupon.usedCount >= coupon.maxUses) {
      coupon.isActive = false;
    }
    await coupon.save();
    
    await BalanceLog.create({
      userId: user.id,
      change: amount,
      reason: `兑换码兑换 (${coupon.code})`,
      balanceAfter: newBalance,
      relatedId: coupon.id,
      type: 'purchase'
    });
    
    res.json({
      success: true,
      message: '兑换成功',
      amount: amount,
      balance: newBalance
    });
    
  } catch (error) {
    console.error('[Coupon] Redeem error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/create', async (req, res) => {
  const { amount, type, maxUses, expiresAt, count } = req.body;
  
  let apiKey = req.headers['x-api-key'] || req.headers['authorization'];
  if (apiKey && apiKey.startsWith('Bearer ')) {
    apiKey = apiKey.substring(7);
  }
  
  const adminUser = await User.findOne({ where: { apiKey } });
  if (!adminUser || adminUser.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: '仅管理员可创建兑换码'
    });
  }
  
  try {
    const generateCode = () => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let code = 'WY';
      for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    };
    
    const coupons = [];
    const numCodes = count || 1;
    
    for (let i = 0; i < numCodes; i++) {
      let code = generateCode();
      let exists = await Coupon.findOne({ where: { code } });
      while (exists) {
        code = generateCode();
        exists = await Coupon.findOne({ where: { code } });
      }
      
      const coupon = await Coupon.create({
        code,
        amount: amount || 100,
        type: type || 'gift',
        maxUses: maxUses || 1,
        expiresAt: expiresAt || null,
        isActive: true,
        createdBy: adminUser.id
      });
      coupons.push(coupon);
    }
    
    res.json({
      success: true,
      message: `成功创建 ${coupons.length} 个兑换码`,
      coupons: coupons.map(c => ({
        code: c.code,
        amount: c.amount,
        maxUses: c.maxUses,
        expiresAt: c.expiresAt
      }))
    });
    
  } catch (error) {
    console.error('[Coupon] Create error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/list', async (req, res) => {
  let apiKey = req.headers['x-api-key'] || req.headers['authorization'];
  if (apiKey && apiKey.startsWith('Bearer ')) {
    apiKey = apiKey.substring(7);
  }
  
  const adminUser = await User.findOne({ where: { apiKey } });
  if (!adminUser || adminUser.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: '仅管理员可查看兑换码'
    });
  }
  
  try {
    const coupons = await Coupon.findAll({
      order: [['created_at', 'DESC']]
    });
    
    res.json({
      success: true,
      coupons
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;