require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
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
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: true, credentials: true }));

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3000,
  message: { error: 'Too many requests' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many login attempts' }
});

app.use('/api/', generalLimiter);
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
app.use('/api/orders', require('./routes/orders'));
app.use('/api/billing', require('./routes/billing'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/proxy', require('./routes/proxy'));
app.use('/api/generate', require('./routes/generate'));
const aiGenerateRouter = require('./routes/aiGenerate');
app.use('/api/ai-generate', aiGenerateRouter);
app.use('/api/coupon', require('./routes/coupon'));
app.use('/api/admin', require('./routes/admin'));

// 启动 BullMQ Worker
const { createPollingWorker, recoverPendingTasks } = require('./config/queue');
let pollingWorker = null;

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../public')));

// SPA fallback
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({ error: 'Validation error', details: err.errors.map(e => e.message) });
  }
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({ error: 'Duplicate entry' });
  }
  res.status(err.statusCode || 500).json({ error: err.message || 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Initialize user balances in Redis
async function initializeBalanceCache() {
  try {
    const { User } = require('./models');
    const users = await User.findAll({ attributes: ['id', 'balance'] });
    const pipeline = redis.pipeline();
    for (const user of users) {
      pipeline.set(`balance:${user.id}`, user.balance, 'EX', 86400);
    }
    await pipeline.exec();
    console.log(`Cached ${users.length} user balances`);
  } catch (error) {
    console.error('Failed to initialize balance cache:', error.message);
  }
}

// Create default accounts
async function createDefaultAccounts() {
  try {
    const { User } = require('./models');
    const bcrypt = require('bcryptjs');
    const { v4: uuidv4 } = require('uuid');

    // Admin account
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    let admin = await User.findOne({ where: { email: adminEmail } });

    if (!admin) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      admin = await User.create({
        email: adminEmail,
        password: hashedPassword,
        username: 'Administrator',
        role: 'admin',
        balance: 10000,
        apiKey: uuidv4().replace(/-/g, '')
      });
      console.log(`Admin created: ${adminEmail}`);
    }

    // Test account
    const testEmail = 'test@example.com';
    let testUser = await User.findOne({ where: { email: testEmail } });

    if (!testUser) {
      const hashedPassword = await bcrypt.hash('test123', 10);
      testUser = await User.create({
        email: testEmail,
        password: hashedPassword,
        username: 'TestUser',
        role: 'user',
        balance: 5000,
        apiKey: uuidv4().replace(/-/g, '')
      });
      console.log(`Test user created: ${testEmail}`);
    }
  } catch (error) {
    console.error('Failed to create accounts:', error.message);
  }
}

// Start server
async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');

    // 使用 { force: false } 避免自动创建表，依赖 init.sql 创建表结构
    // 如果需要更新表结构，请手动执行 init.sql
    await sequelize.sync({ force: false, alter: false });
    console.log('Models synchronized.');

    await createDefaultAccounts();

    await redis.ping();
    console.log('Redis connected.');

    await initializeBalanceCache();

    // 启动 BullMQ Worker
    pollingWorker = createPollingWorker();
    console.log('BullMQ Worker started');

    // 延迟恢复未完成的任务（等待 Worker 启动）
    setTimeout(async () => {
      await recoverPendingTasks();
    }, 3000);

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down...');
  if (pollingWorker) {
    await pollingWorker.close();
  }
  await sequelize.close();
  await redis.quit();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Shutting down...');
  if (pollingWorker) {
    await pollingWorker.close();
  }
  await sequelize.close();
  await redis.quit();
  process.exit(0);
});

startServer();

module.exports = app;
