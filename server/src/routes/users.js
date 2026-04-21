const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User, BalanceLog, Order, Invocation, ApiInvocation, ApiEndpoint } = require('../models');
const { redis, KEYS } = require('../config/redis');

/**
 * Middleware to authenticate JWT token
 */
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
 * Get current user profile
 * GET /api/users/me
 */
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.userId, {
      attributes: ['id', 'email', 'username', 'apiKey', 'balance', 'role', 'created_at']
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ user });
  } catch (error) {
    next(error);
  }
});

/**
 * Reset API key
 * POST /api/users/reset-key
 */
router.post('/reset-key', authenticate, async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Generate new API key
    const newApiKey = uuidv4().replace(/-/g, '');
    user.apiKey = newApiKey;
    await user.save();
    
    res.json({
      message: 'API key reset successfully',
      apiKey: newApiKey
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get balance logs
 * GET /api/users/balance-logs
 */
router.get('/balance-logs', authenticate, async (req, res, next) => {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const validPageSizes = [10, 20, 30, 50];
    const limit = validPageSizes.includes(parseInt(pageSize)) ? parseInt(pageSize) : 10;
    const offset = (parseInt(page) - 1) * limit;
    
    const { count, rows } = await BalanceLog.findAndCountAll({
      where: { userId: req.user.userId },
      order: [['created_at', 'DESC']],
      limit,
      offset
    });
    
    res.json({
      success: true,
      logs: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        pageSize: limit,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get invocation records
 * GET /api/users/invocations
 */
router.get('/invocations', authenticate, async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const { count, rows } = await Invocation.findAndCountAll({
      where: { userId: req.user.userId },
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset
    });
    
    res.json({
      records: rows || [],
      pagination: {
        total: count || 0,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil((count || 0) / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('[Invocations] Error:', error.message);
    res.json({ records: [], pagination: { total: 0, page: 1, limit: 20, pages: 0 } });
  }
});

/**
 * Get API invocation records
 * GET /api/users/api-invocations
 */
router.get('/api-invocations', authenticate, async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const { count, rows } = await ApiInvocation.findAndCountAll({
      where: { userId: req.user.userId },
      include: [{
        model: ApiEndpoint,
        as: 'endpoint',
        attributes: ['id', 'name', 'pathPrefix']
      }],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset
    });
    
    res.json({
      records: rows || [],
      pagination: {
        total: count || 0,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil((count || 0) / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('[ApiInvocations] Error:', error.message);
    res.json({ records: [], pagination: { total: 0, page: 1, limit: 20, pages: 0 } });
  }
});

/**
 * Get user's orders
 * GET /api/users/orders
 */
router.get('/orders', authenticate, async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const { count, rows } = await Order.findAndCountAll({
      where: { userId: req.user.userId },
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset,
      attributes: { exclude: ['skillId'] }
    });
    
    res.json({
      orders: rows || [],
      pagination: {
        total: count || 0,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil((count || 0) / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('[Orders] Error:', error.message);
    res.json({ orders: [], pagination: { total: 0, page: 1, limit: 20, pages: 0 } });
  }
});

/**
 * Change password
 * POST /api/users/change-password
 */
router.post('/change-password', authenticate, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password required' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }
    
    const user = await User.findByPk(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();
    
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
