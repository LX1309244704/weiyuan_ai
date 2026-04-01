const express = require('express');
const router = express.Router();
const axios = require('axios');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { User, AiModel, AiGenerateTask, BalanceLog, sequelize } = require('../models');
const { redis, KEYS, TTL } = require('../config/redis');
const providerManager = require('../providers');
const { addTaskToQueue } = require('../config/queue');

// 初始化加载所有运营商处理器
providerManager.loadAll();

// 模型 ID 到显示名称的映射
const MODEL_DISPLAY_NAMES = {
  'runninghub/bananaflash': '香蕉Flash',
  'runninghub/nanobanana': '香蕉Pro',
  'runninghub/veo31': 'VEO3.1视频',
  'runninghub/sora2': 'Sora2视频',
  'runninghub/videoX': '全能视频X',
  'huoshan/image': '火山图片'
};

// 获取模型显示名称
function getModelDisplayName(modelId) {
  return MODEL_DISPLAY_NAMES[modelId] || modelId?.split('/')?.pop() || modelId || 'AI生成';
}

// SSE 客户端管理 - 从 queue.js 导入共享的 sseClients
const { sseClients, sendTaskUpdate } = require('../config/queue');

/**
 * GET /models - 获取可用模型列表
 * 返回格式兼容前端：{ id, name, description, type, icon, pathPrefix, ... }
 */
router.get('/models', async (req, res) => {
  try {
    const providers = await AiModel.findAll({
      where: { isActive: true },
      attributes: ['provider', 'name', 'apiKey', 'modelPrices']
    });
    
    const models = [];
    for (const p of providers) {
      // 检查是否配置了 API Key
      if (!p.apiKey || p.apiKey.trim() === '') {
        continue;
      }
      const ProviderClass = providerManager.providers.get(p.provider);
      if (ProviderClass && ProviderClass.models) {
        // 解析数据库中的自定义价格
        let customPrices = {};
        if (p.modelPrices) {
          try {
            customPrices = typeof p.modelPrices === 'string' 
              ? JSON.parse(p.modelPrices) 
              : p.modelPrices;
          } catch (e) {}
        }
        
        for (const m of ProviderClass.models) {
          // 优先使用数据库中的自定义价格
          const pricePerCall = customPrices[m.id] !== undefined 
            ? customPrices[m.id] 
            : (m.pricePerCall || 50);
            
          models.push({
            id: m.id,
            name: m.name || m.dbName || p.name,
            description: m.description,
            provider: p.provider,
            providerName: p.name,
            type: m.type || 'image',
            icon: m.icon || (m.type === 'video' ? '🎬' : '🖼️'),
            pathPrefix: m.id,
            defaultParams: m.defaultParams || {},
            paramConfig: m.paramConfig || [],
            pricePerCall,
            apiKey: p.apiKey || ''  // 返回 API Key 用于图片上传
          });
        }
      }
    }
    
    res.json({ success: true, models });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /* - AI生成请求
 * 支持两种调用方式：
 * 1. /ai-generate/runninghub/t2i (前端方式)
 * 2. /ai-generate/generate (统一接口)
 */
router.post('/*', async (req, res) => {
  const startTime = Date.now();
  const pathPrefix = req.path.replace(/^\//, ''); // runninghub/t2i
  
  // 跳过 /models 等特殊路径
  if (pathPrefix === 'models' || pathPrefix === 'tasks' || pathPrefix === 'stream') {
    return res.status(404).json({ success: false, error: 'Not found' });
  }
  
  // 解析 provider 和 modelType
  const [provider, modelType] = pathPrefix.split('/');
  if (!provider || !modelType) {
    return res.status(400).json({ success: false, error: 'Invalid path format, should be provider/modelType' });
  }
  
  // 获取厂商配置（API Key）
  const providerConfig = await AiModel.findOne({ where: { provider, isActive: true } });
  if (!providerConfig) {
    return res.status(404).json({ success: false, error: `Provider ${provider} not configured` });
  }
  
  // 获取运营商处理器
  const providerHandler = providerManager.get(provider, providerConfig);
  if (!providerHandler) {
    return res.status(501).json({ success: false, error: `Provider ${provider} not implemented` });
  }
  
  // 传递模型ID给处理器
  providerHandler.modelId = pathPrefix;
  
  // 获取模型配置（用于定价）
  // 优先从数据库读取 model_prices，如果没有则使用代码中的默认值
  const ProviderClass = providerManager.providers.get(provider);
  const modelConfig = ProviderClass?.models?.find(m => m.id === pathPrefix);
  let cost = modelConfig?.pricePerCall || 50;
  
  // 检查数据库中的自定义价格配置
  if (providerConfig.modelPrices) {
    try {
      const prices = typeof providerConfig.modelPrices === 'string' 
        ? JSON.parse(providerConfig.modelPrices) 
        : providerConfig.modelPrices;
      if (prices && prices[pathPrefix] !== undefined) {
        cost = prices[pathPrefix];
      }
    } catch (e) {
      console.error('[AIGenerate] Failed to parse modelPrices:', e.message);
    }
  }
  
  // 获取请求参数中的duration（用于视频按秒计费）
  const { duration: requestDuration } = req.body;
  
  // 全能视频X按秒计费：基础价格 × 秒数
  if (pathPrefix === 'runninghub/videoX' && requestDuration) {
    const durationSeconds = parseInt(requestDuration) || 6;
    cost = cost * durationSeconds;
    console.log(`[AIGenerate] videoX pricing: ${cost} = base ${modelConfig?.pricePerCall || 50} × ${durationSeconds}s`);
  }
  
  // 验证用户
  let apiKey = req.headers['x-api-key'] || req.headers['authorization'];
  if (apiKey && apiKey.startsWith('Bearer ')) apiKey = apiKey.substring(7);
  if (!apiKey) return res.status(401).json({ success: false, error: 'API Key required' });
  
  const user = await User.findOne({ where: { apiKey } });
  if (!user) return res.status(401).json({ success: false, error: 'Invalid API Key' });
  
  const balanceKey = KEYS.balance(user.id);
  
  try {
    const { prompt, imageUrls, firstFrameUrl, lastFrameUrl, ...params } = req.body;
    
    // 合并图片URLs（用于视频首尾帧）
    const allImageUrls = [...(imageUrls || [])];
    if (firstFrameUrl) allImageUrls.unshift(firstFrameUrl);
    if (lastFrameUrl) allImageUrls.push(lastFrameUrl);
    
    // 构建请求（只传递需要的参数，移除 modelType）
    const requestBody = providerHandler.buildRequest({ 
      prompt, 
      imageUrls, 
      firstFrameUrl, 
      lastFrameUrl,
      ...params 
    });
    
    // 获取 API URL
    const ProviderClass = providerManager.providers.get(provider);
    let apiUrl;
    if (ProviderClass.getApiUrl) {
      if (providerHandler.getRequestUrl) {
        apiUrl = providerHandler.getRequestUrl(requestBody);
      } else {
        apiUrl = ProviderClass.getApiUrl(requestBody.imageUrls && requestBody.imageUrls.length > 0);
      }
    }
    if (!apiUrl) throw new Error('API URL not defined');
    
    console.log('[AIGenerate] Request to:', apiUrl);
    console.log('[AIGenerate] Request body:', JSON.stringify(requestBody));
    
    // 发送请求
    const response = await axios({
      method: 'POST',
      url: apiUrl,
      headers: { 'Content-Type': 'application/json', ...providerHandler.getAuthHeaders() },
      data: requestBody,
      timeout: 300000
    });
    
    console.log('[AIGenerate] Response:', JSON.stringify(response.data));
    
    // 解析响应
    const result = providerHandler.parseResponse(response);
    console.log('[AIGenerate] Parse result:', JSON.stringify(result));
    const taskId = result.taskId || `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 防重复：检查是否已存在相同 taskId 的任务
    if (result.taskId) {
      const existingTask = await AiGenerateTask.findOne({ where: { taskId: result.taskId } });
      if (existingTask) {
        console.log('[AIGenerate] Task already exists:', result.taskId);
        return res.json({
          success: true,
          taskId: existingTask.taskId,
          status: existingTask.status,
          data: existingTask.resultUrl,
          balance: user.balance
        });
      }
    }
    
    // API 调用失败：不扣余额，直接返回
    if (!result.success) {
      console.log('[AIGenerate] API failed, NOT deducting balance. Current balance:', user.balance);
      
      // 创建失败任务记录（不扣费）
      await AiGenerateTask.create({
        userId: user.id,
        provider,
        taskId,
        modelName: pathPrefix,
        prompt,
        imageUrls: allImageUrls.length > 0 ? allImageUrls : imageUrls,
        status: 'failed',
        progress: 0,
        errorMessage: result.error || 'API call failed',
        cost: 0
      });
      
      return res.status(400).json({
        success: false,
        taskId,
        status: 'failed',
        error: result.error || 'Generate failed',
        balance: user.balance
      });
    }
    
    console.log('[AIGenerate] API success, deducting balance. Cost:', cost, 'Current balance:', user.balance);
    
    // API 调用成功：在事务内扣余额
    const aiTask = await sequelize.transaction(async (t) => {
      const currentUser = await User.findByPk(user.id, { attributes: ['balance'], transaction: t, lock: t.LOCK.UPDATE });
      
      if (currentUser.balance < cost) {
        throw new Error('Insufficient balance');
      }
      
      const newBalance = currentUser.balance - cost;
      
      await User.update({ balance: newBalance }, { where: { id: user.id }, transaction: t });
      
      const task = await AiGenerateTask.create({
        userId: user.id,
        provider,
        taskId,
        modelName: pathPrefix,
        prompt,
        imageUrls: allImageUrls.length > 0 ? allImageUrls : imageUrls,
        status: result.status,
        progress: result.status === 'completed' ? 100 : 0,
        resultUrl: result.resultUrls?.[0] || null,
        resultData: response.data,
        cost,
        balanceChangeType: 'consume',
        balanceChangeAt: new Date()
      }, { transaction: t });
      
      await BalanceLog.create({ 
        userId: user.id, 
        change: -cost, 
        reason: `${getModelDisplayName(pathPrefix)}生成`, 
        balanceAfter: newBalance, 
        type: 'consume', 
        relatedId: task.id 
      }, { transaction: t });
      
      return { task, newBalance };
    });
    
    // 更新 Redis 缓存
    await redis.set(balanceKey, aiTask.newBalance, 'EX', TTL.INVOCATION_CHECK);
    
    // 如果是异步任务，加入 BullMQ 队列
    if (result.taskId && result.status !== 'completed') {
      addTaskToQueue(aiTask.task.id, {
        provider,
        taskId,
        userId: user.id
      });
    }
    
    res.json({
      success: true,
      taskId: aiTask.task.taskId,
      status: result.status,
      data: result.resultUrls?.[0] || null,
      result: result.resultUrls || [],
      balance: aiTask.newBalance,
      duration: Date.now() - startTime
    });
    
  } catch (error) {
    console.error('[AIGenerate] Error:', error.message);
    
    // 尝试获取最新余额
    let currentBalance = user.balance;
    try {
      const freshUser = await User.findByPk(user.id, { attributes: ['balance'] });
      if (freshUser) currentBalance = freshUser.balance;
    } catch (e) {}
    
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.message || error.response?.data?.errorMessage || 'Generate failed',
      balance: currentBalance
    });
  }
});

/**
 * GET /task/:taskId - 查询任务状态
 */
router.get('/task/:taskId', async (req, res) => {
  const task = await AiGenerateTask.findOne({ where: { taskId: req.params.taskId, deletedAt: null } });
  if (!task) return res.status(404).json({ success: false, error: 'Task not found' });
  
  let resultUrl = task.resultUrl;
  
  // 如果状态是 completed 但 resultUrl 为空，重新查询获取结果
  if (task.status === 'completed' && !resultUrl) {
    try {
      const providerHandler = providerManager.get(task.provider, task);
      if (providerHandler && providerHandler.buildPollRequest) {
        const pollConfig = providerHandler.buildPollRequest(task.taskId);
        if (pollConfig) {
          const response = await axios(pollConfig);
          const result = providerHandler.parsePollResponse(response);
          
          if (result.completed && result.success) {
            resultUrl = result.resultUrl || (result.resultUrls && result.resultUrls[0]) || null;
            
            // 在事务中更新 resultUrl
            await sequelize.transaction(async (tx) => {
              await AiGenerateTask.update(
                { resultUrl },
                { where: { id: task.id }, transaction: tx }
              );
            });
          }
        }
      }
    } catch (err) {
      console.error('[Task Query] Failed to fetch result URL:', err.message);
    }
  }
  
  res.json({ success: true, taskId: task.taskId, status: task.status, progress: task.progress, resultUrl, errorMessage: task.errorMessage });
});

/**
 * DELETE /task/:taskId - 删除任务（软删除）
 */
router.delete('/task/:taskId', async (req, res) => {
  let apiKey = req.headers['x-api-key'] || req.headers['authorization'];
  if (apiKey && apiKey.startsWith('Bearer ')) apiKey = apiKey.substring(7);
  if (!apiKey) return res.status(401).json({ success: false, error: 'API Key required' });
  
  const user = await User.findOne({ where: { apiKey } });
  if (!user) return res.status(401).json({ success: false, error: 'Invalid API Key' });
  
  const task = await AiGenerateTask.findOne({ where: { taskId: req.params.taskId, userId: user.id } });
  if (!task) return res.status(404).json({ success: false, error: 'Task not found' });
  
  // 软删除
  await task.update({ deletedAt: new Date() });
  
  res.json({ success: true, message: 'Task deleted' });
});

/**
 * GET /tasks - 获取用户任务列表
 */
router.get('/tasks', async (req, res) => {
  let apiKey = req.headers['x-api-key'] || req.headers['authorization'];
  if (apiKey && apiKey.startsWith('Bearer ')) apiKey = apiKey.substring(7);
  if (!apiKey) return res.status(401).json({ success: false, error: 'API Key required' });
  
  const user = await User.findOne({ where: { apiKey } });
  if (!user) return res.status(401).json({ success: false, error: 'Invalid API Key' });
  
  const { status, type, page = 1, pageSize = 10 } = req.query;
  const limit = parseInt(pageSize) || 10;
  const offset = (parseInt(page) - 1) * limit;
  const where = { userId: user.id, deletedAt: null };
  
  if (status && status !== 'all') where.status = status;
  
  // 按类型筛选（video/image）
  if (type && type !== 'all') {
    const videoModels = ['veo', 'video', 'sora', 'grok'];
    if (type === 'video') {
      where.modelName = { [Op.or]: videoModels.map(v => ({ [Op.like]: `%${v}%` })) };
    } else if (type === 'image') {
      where.modelName = { [Op.not]: { [Op.or]: videoModels.map(v => ({ [Op.like]: `%${v}%` })) } };
    }
  }
  
  const { count, rows } = await AiGenerateTask.findAndCountAll({ where, order: [['created_at', 'DESC']], limit, offset });
  
  // 计算实际扣减积分
  const tasks = rows.map(task => {
    const t = task.toJSON();
    t.actualCost = (t.cost || 0) - (t.refundAmount || 0);
    return t;
  });
  
  res.json({ success: true, total: count, tasks });
});

/**
 * GET /stream - SSE 实时更新
 */
router.get('/stream', async (req, res) => {
  const token = req.headers['authorization'] || req.query.token;
  if (!token) {
    res.status(401).json({ error: 'Token required' });
    return;
  }
  
  let userId;
  try {
    const tokenData = jwt.verify(token.startsWith('Bearer ') ? token.substring(7) : token, process.env.JWT_SECRET);
    userId = tokenData.userId;
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
    return;
  }
  
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  
  // 发送初始连接确认
  res.write(': connected\n\n');
  
  if (!sseClients.has(userId)) sseClients.set(userId, []);
  sseClients.get(userId).push(res);
  
  const keepAlive = setInterval(() => {
    try {
      res.write(': keepalive\n\n');
    } catch (err) {
      clearInterval(keepAlive);
    }
  }, 30000);
  
  req.on('close', () => {
    clearInterval(keepAlive);
    const clients = sseClients.get(userId);
    if (clients) {
      const idx = clients.indexOf(res);
      if (idx > -1) clients.splice(idx, 1);
      if (clients.length === 0) sseClients.delete(userId);
    }
  });
  
  req.on('error', () => {
    clearInterval(keepAlive);
  });
});

/**
 * DELETE /tasks/:taskId - 删除任务
 */
router.delete('/tasks/:taskId', async (req, res) => {
  const { taskId } = req.params;
  
  let token = req.headers['authorization'];
  if (!token) {
    res.status(401).json({ error: 'Token required' });
    return;
  }
  
  if (token.startsWith('Bearer ')) {
    token = token.substring(7);
  }
  
  let userId;
  try {
    const tokenData = jwt.verify(token, process.env.JWT_SECRET);
    userId = tokenData.userId;
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
    return;
  }
  
  try {
    const task = await AiGenerateTask.findOne({
      where: { taskId, userId }
    });
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    await task.destroy();
    
    res.json({ success: true, message: 'Task deleted' });
  } catch (error) {
    console.error('[DeleteTask] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
