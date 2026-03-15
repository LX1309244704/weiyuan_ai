const Redis = require('ioredis');

// Redis client for high-performance operations
// Uses connection pooling for high concurrency (5000+ QPS)

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
  enableReadyCheck: true,
  lazyConnect: false,
  // Performance tuning for high concurrency
  family: 4,
  keepAlive: 30000,
  connectTimeout: 10000,
  commandTimeout: 5000,
});

// Redis keys pattern
const KEYS = {
  // User balance: balance:{userId}
  balance: (userId) => `balance:${userId}`,
  
  // Idempotent check: invocation:{invocationId}
  invocation: (invocationId) => `invocation:${invocationId}`,
  
  // Rate limiting: rate:{userId}:{endpoint}
  rateLimit: (userId, endpoint) => `rate:${userId}:${endpoint}`,
  
  // Skill cache: skill:{skillId}
  skill: (skillId) => `skill:${skillId}`,
  
  // Token blacklist: token:{tokenId}
  token: (token) => `token:${token}`,
};

// TTL constants (in seconds)
const TTL = {
  SKILL_CACHE: 300,        // 5 minutes
  INVOCATION_CHECK: 86400, // 24 hours (for idempotency)
  RATE_LIMIT: 60,         // 1 minute
  TOKEN_BLACKLIST: 86400, // 24 hours
};

// Event handlers
redis.on('connect', () => {
  console.log('Redis connected successfully');
});

redis.on('error', (err) => {
  console.error('Redis error:', err.message);
});

module.exports = {
  redis,
  KEYS,
  TTL,
};
