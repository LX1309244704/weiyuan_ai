const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { User, Skill, Invocation, BalanceLog } = require('../models');
const { redis, KEYS, TTL } = require('../config/redis');

/**
 * High-performance billing API
 * POST /api/billing/consume
 * 
 * Uses Redis for atomic balance operations to support 5000+ QPS
 * Implements idempotency via invocationId
 */
router.post('/consume', async (req, res, next) => {
  try {
    const { apiKey, skillId, invocationId } = req.body;
    
    // Validate required fields
    if (!apiKey || !skillId || !invocationId) {
      return res.status(400).json({ 
        error: 'Missing required fields: apiKey, skillId, invocationId' 
      });
    }
    
    // Step 1: Check idempotency - prevent duplicate charges
    const idempotencyKey = KEYS.invocation(invocationId);
    const existingInvocation = await redis.get(idempotencyKey);
    
    if (existingInvocation) {
      // Already processed - return cached result
      const cached = JSON.parse(existingInvocation);
      return res.status(200).json(cached);
    }
    
    // Step 2: Find user by API key
    const user = await User.findOne({ where: { apiKey } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid API key' });
    }
    
    // Step 3: Find skill
    const skill = await Skill.findByPk(skillId);
    if (!skill || !skill.isActive) {
      return res.status(404).json({ error: 'Skill not found or inactive' });
    }
    
    // Step 4: Get balance from Redis (fast path)
    const balanceKey = KEYS.balance(user.id);
    let currentBalance = await redis.get(balanceKey);
    
    if (currentBalance === null) {
      // Cache miss - sync from database
      currentBalance = user.balance;
      await redis.set(balanceKey, currentBalance, 'EX', TTL.INVOCATION_CHECK);
    } else {
      currentBalance = parseInt(currentBalance, 10);
    }
    
    // Step 5: Check if balance is sufficient
    const cost = skill.pricePerCall;
    if (currentBalance < cost) {
      const result = {
        success: false,
        error: '余额不足',
        buyLink: `/skills/${skillId}/buy`
      };
      
      // Cache failed result for idempotency (shorter TTL)
      await redis.set(idempotencyKey, JSON.stringify(result), 'EX', 3600);
      
      return res.status(402).json(result);
    }
    
    // Step 6: Atomic balance deduction using Redis
    const newBalance = await redis.decrby(balanceKey, cost);
    
    // Step 7: Set idempotency marker
    const successResult = {
      success: true,
      remaining: newBalance,
      message: '扣费成功',
      skillName: skill.name
    };
    
    await redis.set(
      idempotencyKey, 
      JSON.stringify(successResult), 
      'EX', 
      TTL.INVOCATION_CHECK
    );
    
    // Step 8: Async database write (fire and forget for performance)
    // This ensures the API responds quickly while maintaining eventual consistency
    setImmediate(async () => {
      try {
        // Write invocation record
        await Invocation.create({
          invocationId,
          userId: user.id,
          skillId: skill.id,
          cost,
          balanceAfter: newBalance,
          status: 'success'
        });
        
        // Update user balance in database
        await User.decrement('balance', { by: cost, where: { id: user.id } });
        
        // Update skill usage count
        await skill.increment('usageCount');
        
        console.log(`[BILLING] Consumed ${cost} for user ${user.id}, skill ${skillId}, new balance: ${newBalance}`);
      } catch (err) {
        console.error('[BILLING] Async write failed:', err.message);
      }
    });
    
    // Step 9: Return immediately
    return res.status(200).json(successResult);
    
  } catch (error) {
    next(error);
  }
});

/**
 * Get balance for a user (for display purposes)
 */
router.get('/balance/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    const cachedBalance = await redis.get(KEYS.balance(userId));
    
    if (cachedBalance !== null) {
      return res.json({ 
        balance: parseInt(cachedBalance, 10),
        source: 'cache'
      });
    }
    
    const user = await User.findByPk(userId, {
      attributes: ['id', 'balance']
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
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
 * Get invocation records for a user
 */
router.get('/records/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const { count, rows } = await Invocation.findAndCountAll({
      where: { userId },
      include: [{
        model: Skill,
        as: 'skill',
        attributes: ['id', 'name', 'icon']
      }],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset
    });
    
    res.json({
      records: rows,
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
 * Reconciliation endpoint - sync Redis cache with database
 */
router.post('/reconcile/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const purchases = await BalanceLog.sum('change', {
      where: { userId, type: 'purchase' }
    });
    const refunds = await BalanceLog.sum('change', {
      where: { userId, type: 'refund' }
    });
    const consumes = await BalanceLog.sum('change', {
      where: { userId, type: 'consume' }
    });
    
    const calculatedBalance = (purchases || 0) + (refunds || 0) + (consumes || 0);
    
    const cachedBalance = await redis.get(KEYS.balance(userId));
    const cacheBalance = cachedBalance ? parseInt(cachedBalance, 10) : null;
    
    if (cacheBalance === calculatedBalance) {
      return res.json({
        status: 'consistent',
        userId,
        balance: calculatedBalance
      });
    }
    
    await redis.set(KEYS.balance(userId), calculatedBalance, 'EX', TTL.INVOCATION_CHECK);
    
    res.json({
      status: 'reconciled',
      userId,
      previousBalance: cacheBalance,
      actualBalance: calculatedBalance,
      corrected: true
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
