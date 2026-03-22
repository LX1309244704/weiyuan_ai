const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { User, Invocation, BalanceLog } = require('../models');
const { redis, KEYS, TTL } = require('../config/redis');

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
 * 获取余额
 * GET /api/billing/balance
 */
router.get('/balance', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.userId;
    
    // 先从 Redis 获取
    const cachedBalance = await redis.get(KEYS.balance(userId));
    
    if (cachedBalance !== null) {
      return res.json({ 
        balance: parseInt(cachedBalance, 10),
        source: 'cache'
      });
    }
    
    // 缓存未命中，从数据库获取
    const user = await User.findByPk(userId, {
      attributes: ['id', 'balance']
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // 更新缓存
    await redis.set(KEYS.balance(userId), user.balance, 'EX', TTL.INVOCATION_CHECK);
    
    res.json({ 
      balance: user.balance,
      source: 'database'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 余额对账
 * POST /api/billing/reconcile
 */
router.post('/reconcile', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.userId;
    
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // 计算余额
    const recharges = await BalanceLog.sum('change', {
      where: { userId, type: 'recharge' }
    }) || 0;
    
    const refunds = await BalanceLog.sum('change', {
      where: { userId, type: 'refund' }
    }) || 0;
    
    const consumes = await BalanceLog.sum('change', {
      where: { userId, type: 'consume' }
    }) || 0;
    
    const adjustments = await BalanceLog.sum('change', {
      where: { userId, type: 'adjust' }
    }) || 0;
    
    const calculatedBalance = recharges + refunds + consumes + adjustments;
    
    const cachedBalance = await redis.get(KEYS.balance(userId));
    const cacheBalance = cachedBalance ? parseInt(cachedBalance, 10) : null;
    
    if (cacheBalance === calculatedBalance && user.balance === calculatedBalance) {
      return res.json({
        status: 'consistent',
        balance: calculatedBalance
      });
    }
    
    // 修复余额
    user.balance = calculatedBalance;
    await user.save();
    await redis.set(KEYS.balance(userId), calculatedBalance, 'EX', TTL.INVOCATION_CHECK);
    
    res.json({
      status: 'reconciled',
      previousBalance: user.balance,
      actualBalance: calculatedBalance,
      corrected: true
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
