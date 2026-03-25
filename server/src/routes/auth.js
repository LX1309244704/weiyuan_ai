const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { User } = require('../models');
const { KEYS: REDIS_KEYS, TTL } = require('../config/redis');

// 临时API - 创建管理员账户
router.post('/create-admin', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const apiKey = uuidv4().replace(/-/g, '');
    
    const [user, created] = await User.upsert({
      email,
      password: hashedPassword,
      username: 'Administrator',
      role: 'admin',
      balance: 0,
      apiKey
    });
    
    
    res.json({ 
      success: true, 
      email: user.email, 
      role: user.role,
      message: created ? 'Admin created' : 'Admin updated'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Register
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, username } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    
    // Generate API key
    const apiKey = uuidv4().replace(/-/g, '');
    
    // Hash password if provided
    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;
    
    // Create user
    const user = await User.create({
      email,
      username: username || email.split('@')[0],
      apiKey,
      password: hashedPassword,
      balance: 0
    });
    
    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Cache balance in Redis
    const { redis } = require('../config/redis');
    await redis.set(`balance:${user.id}`, 0, 'EX', TTL.INVOCATION_CHECK);
    
    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        apiKey: user.apiKey,
        balance: user.balance,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
});

// Login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Verify password
    if (password && user.password) {
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
    }
    
    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        apiKey: user.apiKey,
        balance: user.balance,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get current user info
router.get('/me', async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId, {
      attributes: ['id', 'email', 'username', 'apiKey', 'balance', 'role', 'created_at']
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ user });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    next(error);
  }
});

module.exports = router;
