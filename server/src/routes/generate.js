const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const { User, ApiEndpoint, ApiInvocation } = require('../models');
const { redis, KEYS, TTL } = require('../config/redis');
const { decrypt } = require('../utils/encryption');

const PROXY_RATE_LIMIT_WINDOW = 60;

function getRateLimitKey(userId, endpointId) {
  return `rate:generate:${userId}:${endpointId}`;
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
    'User-Agent': 'Weiyuan-AI-Generate/1.0'
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

function extractOutputFields(outputFields, responseData) {
  if (!outputFields || Object.keys(outputFields).length === 0) {
    return responseData;
  }

  const result = {};
  for (const [key, path] of Object.entries(outputFields)) {
    try {
      const value = path.replace(/^data\.?/, '').replace(/\[(\d+)\]/g, '.$1').split('.').reduce((obj, k) => obj?.[k], responseData);
      result[key] = value;
    } catch (e) {
      result[key] = null;
    }
  }
  return result;
}

router.get('/tools', async (req, res, next) => {
  try {
    const { type } = req.query;
    
    const where = { 
      isActive: true,
      isGenerateTool: true
    };
    
    if (type) {
      where.type = type;
    }

    const tools = await ApiEndpoint.findAll({
      where,
      attributes: ['id', 'name', 'description', 'category', 'type', 'icon', 'defaultParams', 'outputFields', 'pricePerCall'],
      order: [['type', 'ASC'], ['name', 'ASC']]
    });

    res.json({
      success: true,
      tools: tools.map(tool => ({
        id: tool.id,
        name: tool.name,
        description: tool.description,
        category: tool.category,
        type: tool.type,
        icon: tool.icon || (tool.type === 'image' ? '🖼️' : '🎬'),
        defaultParams: typeof tool.defaultParams === 'string' ? JSON.parse(tool.defaultParams) : tool.defaultParams,
        outputFields: typeof tool.outputFields === 'string' ? JSON.parse(tool.outputFields) : tool.outputFields,
        pricePerCall: tool.pricePerCall
      }))
    });
  } catch (error) {
    next(error);
  }
});

router.get('/tools/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const tool = await ApiEndpoint.findByPk(id, {
      attributes: ['id', 'name', 'description', 'category', 'type', 'icon', 'defaultParams', 'outputFields', 'pricePerCall', 'targetUrl', 'method', 'timeout', 'headersMapping', 'authType']
    });

    if (!tool) {
      return res.status(404).json({ 
        success: false,
        error: 'Tool not found' 
      });
    }

    if (!tool.isGenerateTool) {
      return res.status(400).json({
        success: false,
        error: 'This endpoint is not a generate tool'
      });
    }

    res.json({
      success: true,
      tool: {
        id: tool.id,
        name: tool.name,
        description: tool.description,
        category: tool.category,
        type: tool.type,
        icon: tool.icon || (tool.type === 'image' ? '🖼️' : '🎬'),
        defaultParams: typeof tool.defaultParams === 'string' ? JSON.parse(tool.defaultParams) : tool.defaultParams,
        outputFields: typeof tool.outputFields === 'string' ? JSON.parse(tool.outputFields) : tool.outputFields,
        pricePerCall: tool.pricePerCall
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/generate', async (req, res, next) => {
  const startTime = Date.now();

  try {
    const { toolId, prompt, imageUrl, parameters } = req.body;

    if (!toolId) {
      return res.status(400).json({
        success: false,
        error: 'toolId is required'
      });
    }

    const tool = await ApiEndpoint.findByPk(toolId);
    if (!tool || !tool.isGenerateTool) {
      return res.status(404).json({
        success: false,
        error: 'Generate tool not found'
      });
    }

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

    const user = await User.findOne({ where: { apiKey } });
    if (!user) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid API Key',
        code: 'INVALID_API_KEY'
      });
    }

    const rateLimitResult = await checkRateLimit(user.id, tool.id, tool.rateLimit);
    if (!rateLimitResult.allowed) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: rateLimitResult.resetIn,
        limit: rateLimitResult.limit
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

    const cost = tool.pricePerCall;
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

    const defaultParams = typeof tool.defaultParams === 'string' ? JSON.parse(tool.defaultParams) : tool.defaultParams;
    const outputFields = typeof tool.outputFields === 'string' ? JSON.parse(tool.outputFields) : tool.outputFields;

    const requestBody = {
      prompt,
      ...defaultParams,
      ...parameters
    };

    if (imageUrl) {
      requestBody.image_url = imageUrl;
    }

    let response;
    try {
      const axiosConfig = {
        method: tool.method || 'POST',
        url: tool.targetUrl,
        headers: buildTargetHeaders(tool, req.headers),
        data: requestBody,
        timeout: tool.timeout || 60000,
        validateStatus: () => true,
        maxBodyLength: 50 * 1024 * 1024,
        maxContentLength: 50 * 1024 * 1024
      };

      response = await axios(axiosConfig);
    } catch (proxyError) {
      const isTimeout = proxyError.code === 'ECONNABORTED' || proxyError.code === 'ETIMEDOUT';

      await ApiInvocation.create({
        invocationId: uuidv4(),
        endpointId: tool.id,
        userId: user.id,
        cost: 0,
        status: isTimeout ? 'timeout' : 'failed',
        errorMessage: proxyError.message,
        latency: Date.now() - startTime,
        ipAddress: req.ip || req.connection?.remoteAddress,
        requestPath: `/api/generate/${toolId}`,
        responseCode: null,
        requestBody: JSON.stringify(requestBody),
        responseBody: null
      });

      const refundKey = `refund:generate:${uuidv4()}`;
      await redis.incrby(balanceKey, cost);
      await redis.set(refundKey, '1', 'EX', 3600);

      return res.status(isTimeout ? 504 : 502).json({
        success: false,
        error: isTimeout ? 'Upstream API timeout' : 'Failed to connect to upstream API',
        code: isTimeout ? 'UPSTREAM_TIMEOUT' : 'UPSTREAM_ERROR'
      });
    }

    const latency = Date.now() - startTime;

    const invocationRecord = {
      invocationId: uuidv4(),
      endpointId: tool.id,
      userId: user.id,
      cost,
      status: response.status < 400 ? 'success' : 'failed',
      latency,
      ipAddress: req.ip || req.connection?.remoteAddress,
      requestPath: `/api/generate/${toolId}`,
      responseCode: response.status,
      requestBody: JSON.stringify(requestBody),
      responseBody: typeof response.data === 'string' ? response.data : JSON.stringify(response.data)
    };

    setImmediate(async () => {
      try {
        await ApiInvocation.create(invocationRecord);
        await User.decrement('balance', { by: cost, where: { id: user.id } });
        await tool.increment('usageCount');
        
        console.log(`[GENERATE] ${tool.type} ${tool.name} [${response.status}] ${latency}ms cost=${cost}`);
      } catch (err) {
        console.error('[GENERATE] Failed to save invocation:', err.message);
      }
    });

    const extractedResult = extractOutputFields(outputFields, response.data);

    res.json({
      success: response.status < 400,
      invocationId: invocationRecord.invocationId,
      latency,
      balance: newBalance,
      result: extractedResult,
      data: response.data
    });

  } catch (error) {
    console.error('[GENERATE] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;