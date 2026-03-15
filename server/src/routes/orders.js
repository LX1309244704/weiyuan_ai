const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { Order, User, Skill } = require('../models');
const { redis, KEYS } = require('../config/redis');

/**
 * Create order
 * POST /api/orders/create
 */
router.post('/create', async (req, res, next) => {
  try {
    const { userId, skillId, packageSize, paymentMethod } = req.body;
    
    // Validate user
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Determine price based on package size
    let amount = 0;
    if (skillId) {
      const skill = await Skill.findByPk(skillId);
      if (!skill) {
        return res.status(404).json({ error: 'Skill not found' });
      }
      
      const pkg = skill.packageSizes.find(p => p.size === packageSize);
      if (!pkg) {
        return res.status(400).json({ error: 'Invalid package size' });
      }
      amount = pkg.price;
    } else {
      // General balance purchase
      amount = packageSize * 100; // 1 yuan per call
    }
    
    // Generate order number
    const orderNo = `ORD${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    const order = await Order.create({
      orderNo,
      userId,
      skillId: skillId || null,
      amount,
      packageSize,
      paymentMethod,
      status: 'pending'
    });
    
    res.status(201).json({
      order: {
        id: order.id,
        orderNo: order.orderNo,
        amount: order.amount,
        packageSize: order.packageSize,
        paymentMethod: order.paymentMethod,
        status: order.status
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get user's orders
 * GET /api/orders
 */
router.get('/', async (req, res, next) => {
  try {
    const { userId, page = 1, limit = 20, status } = req.query;
    
    const where = {};
    if (userId) where.userId = userId;
    if (status) where.status = status;
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const { count, rows } = await Order.findAndCountAll({
      where,
      include: [
        { model: Skill, as: 'skill', attributes: ['id', 'name', 'icon'] }
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
 * GET /api/orders/:id
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const order = await Order.findByPk(id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'email', 'name'] },
        { model: Skill, as: 'skill', attributes: ['id', 'name', 'icon'] }
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
 * Get order by order number
 * GET /api/orders/no/:orderNo
 */
router.get('/no/:orderNo', async (req, res, next) => {
  try {
    const { orderNo } = req.params;
    
    const order = await Order.findOne({
      where: { orderNo },
      include: [
        { model: User, as: 'user', attributes: ['id', 'email', 'name'] },
        { model: Skill, as: 'skill', attributes: ['id', 'name', 'icon'] }
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

module.exports = router;
