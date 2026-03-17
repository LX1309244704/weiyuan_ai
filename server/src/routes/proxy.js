const express = require('express');
const router = express.Router({ mergeParams: true });
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const { User, ApiEndpoint, ApiInvocation, Skill, Invocation } = require('../models');
const { redis, KEYS, TTL } = require('../config/redis');
const { decrypt } = require('../utils/encryption');

const PROXY_RATE_LIMIT_WINDOW = 60;

router.get('/endpoints', async (req, res, next) => {
  try {
    const { category } = req.query;
    
    const where = { isActive: true };
    if (category) {
      where.category = category;
    }

    const endpoints = await ApiEndpoint.findAll({
      where,
      attributes: ['id', 'name', 'description', 'category', 'pathPrefix', 'method', 'pricePerCall', 'rateLimit', 'requestExample', 'responseExample'],
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      endpoints: endpoints.map(ep => ({
        id: ep.id,
        name: ep.name,
        description: ep.description,
        category: ep.category,
        path: `/api/proxy/${ep.pathPrefix}`,
        method: ep.method,
        pricePerCall: ep.pricePerCall,
        rateLimit: ep.rateLimit,
        requestExample: ep.requestExample,
        responseExample: ep.responseExample
      }))
    });
  } catch (error) {
    next(error);
  }
});

router.get('/endpoints/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const endpoint = await ApiEndpoint.findByPk(id, {
      attributes: ['id', 'name', 'description', 'category', 'pathPrefix', 'method', 
                   'pricePerCall', 'rateLimit', 'timeout', 'headersMapping', 'requestExample', 'responseExample']
    });

    if (!endpoint) {
      return res.status(404).json({ 
        success: false,
        error: 'Endpoint not found' 
      });
    }

    res.json({
      success: true,
      endpoint: {
        id: endpoint.id,
        name: endpoint.name,
        description: endpoint.description,
        category: endpoint.category,
        path: `/api/proxy/${endpoint.pathPrefix}`,
        method: endpoint.method,
        pricePerCall: endpoint.pricePerCall,
        rateLimit: endpoint.rateLimit,
        timeout: endpoint.timeout,
        requestExample: endpoint.requestExample,
        responseExample: endpoint.responseExample,
        curl: `curl -X ${endpoint.method} "${process.env.SERVER_URL || 'http://localhost:3000'}/api/proxy/${endpoint.pathPrefix}" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{}'`
      }
    });
  } catch (error) {
    next(error);
  }
});

function getRateLimitKey(userId, endpointId) {
  return `rate:proxy:${userId}:${endpointId}`;
}

async function checkRateLimit(userId, endpointId, limit) {
  const key = getRateLimitKey(userId, endpointId);
  const current = await redis.incr(key);
  
  if (current === 1) {
    await redis.expire(key, PROXY_RATE_LIMIT_WINDOW);
  }
  
  return {
    allowed: current <= limit,
    current,
    limit,
    resetIn: await redis.ttl(key)
  };
}

function buildTargetHeaders(endpoint, userHeaders) {
  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': 'XWOW-AMS-Proxy/1.0'
  };

  if (endpoint.authType === 'bearer' && endpoint.authValue) {
    const token = decrypt(endpoint.authValue);
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  } else if (endpoint.authType === 'api_key' && endpoint.authValue) {
    const apiKey = decrypt(endpoint.authValue);
    if (apiKey) {
      headers['X-API-Key'] = apiKey;
    }
  } else if (endpoint.authType === 'basic' && endpoint.authValue) {
    const credentials = decrypt(endpoint.authValue);
    if (credentials) {
      headers['Authorization'] = `Basic ${Buffer.from(credentials).toString('base64')}`;
    }
  }

  if (endpoint.headersMapping) {
    const mapping = typeof endpoint.headersMapping === 'string' 
      ? JSON.parse(endpoint.headersMapping) 
      : endpoint.headersMapping;
    
    for (const [key, value] of Object.entries(mapping)) {
      if (value === '$timestamp') {
        headers[key] = Date.now().toString();
      } else if (value === '$uuid') {
        headers[key] = uuidv4();
      } else {
        headers[key] = value;
      }
    }
  }

  const skipHeaders = ['host', 'authorization', 'x-api-key', 'content-length'];
  for (const [key, value] of Object.entries(userHeaders)) {
    if (!skipHeaders.includes(key.toLowerCase())) {
      headers[key] = value;
    }
  }

  return headers;
}

router.use(async (req, res, next) => {
  const startTime = Date.now();
  let invocationRecord = null;
  let user = null;
  let endpoint = null;
  let cost = 0;

  try {
    let apiKey = req.headers['x-api-key'] || req.headers['authorization'];
    if (apiKey && apiKey.startsWith('Bearer ')) {
      apiKey = apiKey.substring(7);
    }

    if (!apiKey) {
      return res.status(401).json({ 
        success: false,
        error: 'API Key is required',
        code: 'MISSING_API_KEY'
      });
    }

    user = await User.findOne({ where: { apiKey } });
    if (!user) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid API Key',
        code: 'INVALID_API_KEY'
      });
    }

    const pathParts = req.path.split('/').filter(Boolean);
    if (pathParts.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Endpoint path is required',
        code: 'MISSING_ENDPOINT'
      });
    }

    const fullPath = pathParts.join('/');
    endpoint = await ApiEndpoint.findOne({
      where: {
        pathPrefix: fullPath,
        isActive: true
      }
    });

    if (!endpoint) {
      return res.status(404).json({ 
        success: false,
        error: 'API endpoint not found or inactive',
        code: 'ENDPOINT_NOT_FOUND'
      });
    }

    cost = endpoint.pricePerCall;
    console.log(`[PROXY] Endpoint found: ${endpoint.name}, cost: ${cost} points`);

    const rateLimitResult = await checkRateLimit(user.id, endpoint.id, endpoint.rateLimit);
    if (!rateLimitResult.allowed) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: rateLimitResult.resetIn,
        limit: rateLimitResult.limit
      });
    }

    const invocationId = req.headers['x-invocation-id'] || uuidv4();
    const idempotencyKey = `api_invocation:${invocationId}`;
    const existingInvocation = await redis.get(idempotencyKey);

    if (existingInvocation) {
      const cached = JSON.parse(existingInvocation);
      return res.status(200).json({
        ...cached,
        cached: true
      });
    }

    const balanceKey = KEYS.balance(user.id);
    let currentBalance = await redis.get(balanceKey);

    if (currentBalance === null) {
      currentBalance = user.balance;
      await redis.set(balanceKey, currentBalance, 'EX', TTL.INVOCATION_CHECK);
    } else {
      currentBalance = parseInt(currentBalance, 10);
    }

    console.log(`[PROXY] User ${user.id} balance: ${currentBalance} points, cost: ${cost} points`);
    
    if (currentBalance < cost) {
      return res.status(402).json({
        success: false,
        error: 'Insufficient balance',
        code: 'INSUFFICIENT_BALANCE',
        required: cost,
        current: currentBalance,
        buyLink: '/recharge'
      });
    }

    const newBalance = await redis.decrby(balanceKey, cost);
    console.log(`[PROXY] Deducted ${cost} points, new balance: ${newBalance} points`);
    
    await redis.set(idempotencyKey, JSON.stringify({ 
      success: true, 
      pending: true,
      invocationId 
    }), 'EX', TTL.INVOCATION_CHECK);

    const endpointPath = endpoint.pathPrefix;
    const requestPath = pathParts.join('/');
    const extraPath = requestPath.substring(endpointPath.length).replace(/^\//, '');
    let targetUrl = endpoint.targetUrl;
    if (extraPath) {
      targetUrl = targetUrl.replace(/\/$/, '') + '/' + extraPath;
    }

    if (req.query && Object.keys(req.query).length > 0) {
      const queryString = new URLSearchParams(req.query).toString();
      targetUrl += '?' + queryString;
    }

    const targetHeaders = buildTargetHeaders(endpoint, req.headers);

    let response;
    try {
      const axiosConfig = {
        method: req.method,
        url: targetUrl,
        headers: targetHeaders,
        data: req.body,
        timeout: endpoint.timeout || 30000,
        validateStatus: () => true,
        maxBodyLength: 50 * 1024 * 1024,
        maxContentLength: 50 * 1024 * 1024
      };

      response = await axios(axiosConfig);
    } catch (proxyError) {
      const isTimeout = proxyError.code === 'ECONNABORTED' || proxyError.code === 'ETIMEDOUT';
      
      let requestBodyStr = '';
      try {
        requestBodyStr = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      } catch (e) {
        requestBodyStr = String(req.body);
      }
      
      invocationRecord = {
        invocationId,
        endpointId: endpoint.id,
        userId: user.id,
        cost: 0,
        status: isTimeout ? 'timeout' : 'failed',
        errorMessage: proxyError.message,
        latency: Date.now() - startTime,
        ipAddress: req.ip || req.connection.remoteAddress,
        requestPath: req.path,
        responseCode: null,
        requestBody: requestBodyStr,
        responseBody: null
      };

      await ApiInvocation.create(invocationRecord);

      const refundKey = `refund:${invocationId}`;
      const refundResult = await redis.incrby(balanceKey, cost);
      await redis.set(refundKey, '1', 'EX', 3600);

      return res.status(isTimeout ? 504 : 502).json({
        success: false,
        error: isTimeout ? 'Upstream API timeout' : 'Failed to connect to upstream API',
        code: isTimeout ? 'UPSTREAM_TIMEOUT' : 'UPSTREAM_ERROR',
        invocationId
      });
    }

    const latency = Date.now() - startTime;

    let requestBodyStr = '';
    let responseBodyStr = '';
    try {
      requestBodyStr = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      responseBodyStr = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
    } catch (e) {
      requestBodyStr = String(req.body);
      responseBodyStr = String(response.data);
    }

    invocationRecord = {
      invocationId,
      endpointId: endpoint.id,
      userId: user.id,
      cost,
      status: response.status < 400 ? 'success' : 'failed',
      latency,
      ipAddress: req.ip || req.connection.remoteAddress,
      requestPath: req.path,
      responseCode: response.status,
      requestBody: requestBodyStr,
      responseBody: responseBodyStr
    };

    setImmediate(async () => {
      try {
        await ApiInvocation.create(invocationRecord);
        await User.decrement('balance', { by: cost, where: { id: user.id } });
        await endpoint.increment('usageCount');
        
        console.log(`[PROXY] Invocation saved: ${invocationId}, cost=${cost} points, user=${user.id}`);
      } catch (err) {
        console.error('[PROXY] Failed to save invocation:', err.message);
      }
    });

    const result = {
      success: response.status < 400,
      invocationId,
      latency,
      balance: newBalance,
      data: response.data
    };

    await redis.set(idempotencyKey, JSON.stringify(result), 'EX', TTL.INVOCATION_CHECK);

    res.status(response.status).json(result);

  } catch (error) {
    console.error('[PROXY] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;