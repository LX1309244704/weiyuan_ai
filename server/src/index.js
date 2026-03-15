require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const { sequelize } = require('./models');
const { redis } = require('./config/redis');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(cors({
  origin: true,
  credentials: true
}));

// Serve static files (uploaded skill packages)
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
  setHeaders: (res) => {
    res.setHeader('Content-Disposition', 'attachment');
  }
}));

// Serve static files (uploaded skill packages)
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
  setHeaders: (res) => {
    res.setHeader('Content-Disposition', 'attachment');
  }
}));

// Rate limiting - high concurrency config
const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1000, // 1000 requests per minute for general routes
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

const billingLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5000, // 5000 QPS for billing API
  message: { error: 'Billing service busy, please try again.' },
  standardHeaders: true,
  legacyHeaders: false
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 attempts per 15 minutes for auth
  message: { error: 'Too many login attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply rate limiters
app.use('/api/', generalLimiter);
app.use('/api/billing', billingLimiter);
app.use('/api/auth', authLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/skills', require('./routes/skills'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/billing', require('./routes/billing'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/proxy', require('./routes/proxy'));
app.use('/api/generate', require('./routes/generate'));

app.use('/api/admin', require('./routes/admin'));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../public')));

// SPA fallback - serve index.html for all non-API routes
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      error: 'Validation error',
      details: err.errors.map(e => e.message)
    });
  }
  
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      error: 'Duplicate entry',
      details: err.errors.map(e => e.message)
    });
  }
  
  res.status(err.statusCode || 500).json({
    error: err.message || 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Initialize database and start server
async function startServer() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Sync models (use { force: true } to reset tables)
    // Use alter: false to avoid index duplication issues
    await sequelize.sync({ alter: false });
    console.log('Database models synchronized.');
    
    // Create default admin account if not exists
    await createDefaultAdmin();
    
    // Test Redis connection
    await redis.ping();
    console.log('Redis connection established.');
    
    // Initialize Redis balance cache from database
    await initializeBalanceCache();
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Initialize user balances in Redis from database
async function initializeBalanceCache() {
  try {
    const { User } = require('./models');
    const users = await User.findAll({ attributes: ['id', 'balance'] });
    
    const pipeline = redis.pipeline();
    for (const user of users) {
      pipeline.set(`balance:${user.id}`, user.balance, 'EX', 86400); // 24h TTL
    }
    await pipeline.exec();
    console.log(`Cached ${users.length} user balances in Redis`);
  } catch (error) {
    console.error('Failed to initialize balance cache:', error.message);
  }
}

// Create default admin account
async function createDefaultAdmin() {
  try {
    const { User, sequelize } = require('./models');
    const bcrypt = require('bcryptjs');
    
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    
    console.log('Creating admin account...');
    console.log('Admin email:', adminEmail);
    
    // Check by email first
    let admin = await User.findOne({ where: { email: adminEmail } });
    
    if (admin) {
      admin.password = await bcrypt.hash(adminPassword, 10);
      admin.role = 'admin';
      await admin.save();
      console.log(`Admin account updated: ${adminEmail}, role: ${admin.role}`);
    } else {
      // Use upsert to create or update
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      admin = await User.upsert({
        email: adminEmail,
        password: hashedPassword,
        name: 'Administrator',
        role: 'admin',
        balance: 0,
        apiKey: require('uuid').v4().replace(/-/g, '')
      });
      console.log(`Default admin account created: ${adminEmail} (password: ${adminPassword})`);
    }
    
    // Verify
    const verifyAdmin = await User.findOne({ where: { email: adminEmail } });
    console.log('Admin account verify:', verifyAdmin ? 'EXISTS' : 'NOT FOUND', 'role:', verifyAdmin?.role);
    
  } catch (error) {
    console.error('Failed to create default admin:', error.message, error.stack);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  await sequelize.close();
  await redis.quit();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received. Shutting down gracefully...');
  await sequelize.close();
  await redis.quit();
  process.exit(0);
});

startServer();

module.exports = app;
