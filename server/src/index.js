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

// Trust proxy - required when behind Nginx/reverse proxy
// This allows express-rate-limit to correctly identify user IPs from X-Forwarded-For header
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: true, credentials: true }));

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3000,
  message: { error: 'Too many requests' },
  standardHeaders: true,
  legacyHeaders: false
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many login attempts' },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', generalLimiter);
app.use('/api/auth', authLimiter);

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// File upload - multer 仅在上传路由中使用 (避免与 express.json 冲突)
// 路由层面应用见 routes/upload.js

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
app.use('/api/upload', require('./routes/upload'));
const aiGenerateRouter = require('./routes/aiGenerate');
app.use('/api/ai-generate', aiGenerateRouter);
app.use('/api/coupon', require('./routes/coupon'));
app.use('/api/admin', require('./routes/admin'));

// 启动 BullMQ Worker
const { createPollingWorker, recoverPendingTasks } = require('./config/queue');
let pollingWorker = null;

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../public')));

// Error handling (must be before SPA fallback)
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

// SPA fallback - 所有非 API 路由返回 index.html（让 React Router 处理）
app.get('*', (req, res, next) => {
  // API 路由返回 404
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Not found' });
  }
  // 其他路由返回 index.html（SPA 路由）
  res.sendFile(path.join(__dirname, '../public/index.html'));
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

    // 启动 BullMQ Worker（支持多实例并发处理）
    // 4核8G 服务器推荐: 2 Worker + 3 并发 = 6 总并发
    const workerConcurrency = parseInt(process.env.WORKER_CONCURRENCY) || 3;
    const workerCount = parseInt(process.env.WORKER_COUNT) || 2;
    
    console.log(`Starting ${workerCount} Worker(s), each with ${workerConcurrency} concurrency`);
    
    // 创建多个 Worker 实例
    const workers = [];
    for (let i = 0; i < workerCount; i++) {
      const worker = createPollingWorker(workerConcurrency);
      workers.push(worker);
      console.log(`Worker ${i + 1}/${workerCount} started`);
    }
    
    // 保存第一个 Worker 作为主引用（用于关闭等操作）
    pollingWorker = workers[0];

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
