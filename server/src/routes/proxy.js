const express = require('express');
const router = express.Router({ mergeParams: true });
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const { User, ApiEndpoint, ApiInvocation, Invocation, BalanceLog, sequelize } = require('../models');
const { redis, KEYS, TTL } = require('../config/redis');
const { decrypt } = require('../utils/encryption');

const PROXY_RATE_LIMIT_WINDOW = 60;

router.get('/endpoints', async (req, res, next) => {
  try {
    const { category, showInGenerate } = req.query;
    
    const where = { isActive: true };
    if (category) {
      where.category = category;
    }
    if (showInGenerate === '1' || showInGenerate === 'true') {
      where.showInGenerate = true;
    }

    const endpoints = await ApiEndpoint.findAll({
      where,
      attributes: ['id', 'name', 'description', 'category', 'pathPrefix', 'method', 'pricePerCall', 'rateLimit', 'requestExample', 'responseExample', 'type', 'icon', 'defaultParams', 'outputFields', 'showInGenerate'],
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      endpoints: endpoints.map(ep => ({
        id: ep.id,
        name: ep.name,
        description: ep.description,
        category: ep.category,
        pathPrefix: ep.pathPrefix,
        path: `/api/proxy/${ep.pathPrefix}`,
        method: ep.method,
        type: ep.type,
        icon: ep.icon,
        pricePerCall: ep.pricePerCall,
        rateLimit: ep.rateLimit,
        requestExample: ep.requestExample,
        responseExample: ep.responseExample,
        defaultParams: ep.defaultParams,
        outputFields: ep.outputFields,
        showInGenerate: ep.showInGenerate
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
  console.log('[PROXY] buildTargetHeaders - endpoint.authType:', endpoint.authType);
  console.log('[PROXY] buildTargetHeaders - endpoint.headersMapping:', endpoint.headersMapping);
  console.log('[PROXY] buildTargetHeaders - userHeaders:', userHeaders);
  
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

function transformRequestBody(requestExample, clientBody) {
  if (!requestExample) {
    return clientBody;
  }

  try {
    let example;
    if (typeof requestExample === 'string') {
      example = JSON.parse(requestExample);
    } else {
      example = requestExample;
    }

    const prompt = clientBody.prompt || '';
    const params = { ...clientBody };
    delete params.prompt;
    
    console.log('[PROXY] Transform - prompt:', prompt);
    console.log('[PROXY] Transform - params:', params);

    const result = { ...example };
    
    for (const [key, value] of Object.entries(result)) {
      const strValue = String(value);
      if (strValue.includes('${prompt}')) {
        result[key] = strValue.replace(/\$\{prompt\}/g, prompt);
      } else if (strValue === '${prompt}') {
        result[key] = prompt;
      }
    }
    
    for (const [key, value] of Object.entries(params)) {
      if (result[key] !== undefined) {
        if (typeof result[key] === 'object' && result[key] !== null) {
          result[key] = { ...result[key], ...(typeof value === 'object' ? value : { value }) };
        } else {
          result[key] = typeof value === 'object' ? value : String(value);
        }
      } else {
        result[key] = value;
      }
    }

    console.log('[PROXY] Transformed body:', JSON.stringify(result, null, 2));
    return result;
  } catch (e) {
    console.error('[PROXY] Failed to transform request body:', e.message);
    return clientBody;
  }
}

async function waitForTaskCompletion(endpoint, taskId, maxWaitTime = 120000, pollInterval = 3000) {
  const startTime = Date.now();
  const authValue = endpoint.authValue ? decrypt(endpoint.authValue) : null;
  const authHeader = endpoint.authType === 'bearer' ? `Bearer ${authValue}` : authValue;
  
  while (Date.now() - startTime < maxWaitTime) {
    await new Promise(resolve => setTimeout(resolve, pollInterval));
    
    try {
      const statusResponse = await axios.post(
        'https://www.runninghub.cn/task/openapi/status',
        { apiKey: authValue, taskId },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader,
            'Host': 'www.runninghub.cn'
          },
          timeout: 10000
        }
      );
      
      const statusData = statusResponse.data;
      console.log('[PROXY] Task status:', statusData);
      
      if (statusData.data === 'SUCCESS') {
        return { completed: true, success: true };
      } else if (statusData.data === 'FAILED') {
        return { completed: true, success: false, error: 'Task failed' };
      } else if (statusData.data === 'QUEUED' || statusData.data === 'RUNNING') {
        console.log('[PROXY] Task still', statusData.data, '- waiting...');
      }
    } catch (err) {
      console.error('[PROXY] Error checking task status:', err.message);
    }
  }
  
  return { completed: false, error: 'Timeout waiting for task' };
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
    console.log('[PROXY] Request path:', req.path, 'pathParts:', pathParts);
    if (pathParts.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Endpoint path is required',
        code: 'MISSING_ENDPOINT'
      });
    }

    const fullPath = pathParts.join('/');
    console.log('[PROXY] Looking for endpoint with pathPrefix:', fullPath);
    
    endpoint = await ApiEndpoint.findOne({
      where: {
        pathPrefix: fullPath,
        isActive: true
      }
    });

    if (!endpoint) {
      // 尝试查询所有端点用于调试
      const allEndpoints = await ApiEndpoint.findAll({ 
        attributes: ['id', 'name', 'pathPrefix', 'isActive'],
        limit: 10 
      });
      console.log('[PROXY] Available endpoints:', allEndpoints.map(e => ({ pathPrefix: e.pathPrefix, isActive: e.isActive })));
      
      return res.status(404).json({ 
        success: false,
        error: `API endpoint not found: ${fullPath}`,
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

    const transformedBody = transformRequestBody(endpoint.requestExample, req.body);
    console.log('[PROXY] Original body:', JSON.stringify(req.body, null, 2));
    console.log('[PROXY] Transformed body:', JSON.stringify(transformedBody, null, 2));
    console.log('[PROXY] Target URL:', targetUrl);
    console.log('[PROXY] Target Headers:', JSON.stringify(targetHeaders, null, 2));

    let response;
    try {
      const axiosConfig = {
        method: req.method,
        url: targetUrl,
        headers: targetHeaders,
        data: transformedBody,
        timeout: endpoint.timeout || 30000,
        validateStatus: () => true,
        maxBodyLength: 50 * 1024 * 1024,
        maxContentLength: 50 * 1024 * 1024
      };

      console.log('========== API REQUEST START ==========');
      console.log('[PROXY] Request URL:', axiosConfig.url);
      console.log('[PROXY] Request Method:', axiosConfig.method);
      console.log('[PROXY] Request Headers:', JSON.stringify(axiosConfig.headers, null, 2));
      console.log('[PROXY] Request Body:', JSON.stringify(axiosConfig.data, null, 2));
      console.log('========== API REQUEST END ==========');

      response = await axios(axiosConfig);

      console.log('========== API RESPONSE START ==========');
      console.log('[PROXY] Response Status:', response.status);
      console.log('[PROXY] Response StatusText:', response.statusText);
      console.log('[PROXY] Response Headers:', JSON.stringify(response.headers, null, 2));
      console.log('[PROXY] Response Body:', JSON.stringify(response.data, null, 2));
      console.log('========== API RESPONSE END ==========');
    } catch (proxyError) {
      console.log('========== API REQUEST FAILED ==========');
      console.error('[PROXY] Request Error:', proxyError.message);
      console.error('[PROXY] Request Error Code:', proxyError.code);
      console.error('[PROXY] Request Error Config:', proxyError.config ? {
        url: proxyError.config.url,
        method: proxyError.config.method,
        headers: proxyError.config.headers,
        data: proxyError.config.data
      } : 'No config available');
      console.error('[PROXY] Request Error Response:', proxyError.response ? {
        status: proxyError.response.status,
        data: proxyError.response.data
      } : 'No response available');
      console.log('========== END FAILED ==========');
      
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

    const isUpstreamError = response.status >= 400;
    
    invocationRecord = {
      invocationId,
      endpointId: endpoint.id,
      userId: user.id,
      cost: isUpstreamError ? 0 : cost,
      status: response.status < 400 ? 'success' : 'failed',
      latency,
      ipAddress: req.ip || req.connection.remoteAddress,
      requestPath: req.path,
      responseCode: response.status,
      requestBody: requestBodyStr,
      responseBody: responseBodyStr
    };

    if (isUpstreamError) {
      // 上游API错误，需要退款
      const refundBalance = await redis.incrby(balanceKey, cost);
      
      // 使用事务记录退款
      await sequelize.transaction(async (t) => {
        // 更新用户余额
        await User.update(
          { balance: refundBalance },
          { where: { id: user.id }, transaction: t }
        );
        
        // 创建调用记录
        await ApiInvocation.create({
          ...invocationRecord,
          cost: 0  // 上游错误不扣费
        }, { transaction: t });
        
        // 创建余额变动记录
        await BalanceLog.create({
          userId: user.id,
          change: cost,
          reason: `API调用失败退款 (${endpoint.name})`,
          balanceAfter: refundBalance,
          type: 'refund',
          relatedId: invocationId
        }, { transaction: t });
      });
      
      console.log(`[PROXY] Upstream API error, refunded ${cost} points, response: ${response.status}`);
    } else {
      // 正常扣费，使用事务保证一致性
      await sequelize.transaction(async (t) => {
        // 获取当前用户余额（锁定行）
        const currentUser = await User.findByPk(user.id, { 
          attributes: ['balance'],
          transaction: t,
          lock: t.LOCK.UPDATE
        });
        
        const newDbBalance = currentUser.balance - cost;
        
        // 更新用户余额
        await User.update(
          { balance: newDbBalance },
          { where: { id: user.id }, transaction: t }
        );
        
        // 创建调用记录
        await ApiInvocation.create(invocationRecord, { transaction: t });
        
        // 创建余额变动记录
        await BalanceLog.create({
          userId: user.id,
          change: -cost,
          reason: `API调用扣费 (${endpoint.name})`,
          balanceAfter: newDbBalance,
          type: 'consume',
          relatedId: invocationId
        }, { transaction: t });
        
        // 增加端点使用次数
        await endpoint.increment('usageCount', { transaction: t });
        
        // 更新 Redis 缓存
        await redis.set(balanceKey, newDbBalance, 'EX', TTL.INVOCATION_CHECK);
      });
      
      console.log(`[PROXY] Invocation saved: ${invocationId}, cost=${cost} points, user=${user.id}`);
    }

    const result = {
      success: response.status < 400,
      invocationId,
      latency,
      balance: newBalance,
      data: response.data
    };

    if (response.status < 400 && response.data.taskId) {
      console.log('[PROXY] Task submitted, waiting for completion:', response.data.taskId);
      
      const taskResult = await waitForTaskCompletion(endpoint, response.data.taskId);
      
      if (taskResult.completed) {
        if (taskResult.success) {
          console.log('[PROXY] Task completed successfully');
          result.data = { ...result.data, status: 'SUCCESS', completed: true };
        } else {
          console.log('[PROXY] Task failed:', taskResult.error);
          result.data = { ...result.data, status: 'FAILED', error: taskResult.error, completed: true };
        }
      } else {
        console.log('[PROXY] Task polling timeout, returning taskId for client to poll');
        result.data = { ...result.data, status: 'RUNNING', taskId: response.data.taskId };
      }
    }

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