const express = require('express');
const router = express.Router();
const axios = require('axios');
const jwt = require('jsonwebtoken');
const { User, ApiEndpoint, AiGenerateTask, BalanceLog } = require('../models');
const { redis, KEYS, TTL } = require('../config/redis');
const { decrypt } = require('../utils/encryption');

const ASPECT_RATIO_MAP = {
  '1:1': '1:1',
  '3:4': '3:4',
  '4:3': '4:3',
  '16:9': '16:9',
  '9:16': '9:16'
};

async function checkRateLimit(userId, endpointId, limit) {
  const key = `rate:ai:${userId}:${endpointId}`;
  const current = await redis.incr(key);
  
  if (current === 1) {
    await redis.expire(key, 60);
  }
  
  return {
    allowed: current <= limit,
    current,
    limit,
    resetIn: await redis.ttl(key)
  };
}

router.get('/models', async (req, res) => {
  try {
    const endpoints = await ApiEndpoint.findAll({
      where: {
        isActive: true,
        showInGenerate: true
      },
      attributes: ['id', 'pathPrefix', 'name', 'description', 'type', 'icon', 'defaultParams', 'pricePerCall']
    });

    const models = endpoints.map(ep => ({
      id: ep.id,
      pathPrefix: ep.pathPrefix,
      name: ep.name,
      description: ep.description,
      type: ep.type,
      icon: ep.icon || (ep.type === 'image' ? '🖼️' : '🎬'),
      defaultParams: typeof ep.defaultParams === 'string' ? JSON.parse(ep.defaultParams) : ep.defaultParams,
      pricePerCall: ep.pricePerCall
    }));

    res.json({
      success: true,
      models
    });
  } catch (error) {
    console.error('[AIGenerate] Failed to fetch models:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/:pathPrefix', async (req, res) => {
  const startTime = Date.now();
  const { pathPrefix } = req.params;
  const { prompt, imageUrls, resolution, aspectRatio, numImages, duration, fps, model, ...extraParams } = req.body;

  console.log('[AIGenerate] Request pathPrefix:', pathPrefix);
  console.log('[AIGenerate] Request body:', JSON.stringify(req.body, null, 2));

  const endpoint = await ApiEndpoint.findOne({
    where: {
      pathPrefix: pathPrefix,
      isActive: true,
      showInGenerate: true
    }
  });

  if (!endpoint) {
    return res.status(404).json({
      success: false,
      error: 'Model not found or not available for AI Generate',
      pathPrefix: pathPrefix
    });
  }

  console.log('[AIGenerate] Endpoint found:', endpoint.name, 'type:', endpoint.type);

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

  const rateLimitResult = await checkRateLimit(user.id, endpoint.id, endpoint.rateLimit);
  if (!rateLimitResult.allowed) {
    return res.status(429).json({
      success: false,
      error: 'Rate limit exceeded',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: rateLimitResult.resetIn
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

  const cost = endpoint.pricePerCall;
  if (currentBalance < cost) {
    return res.status(402).json({
      success: false,
      error: 'Insufficient balance',
      code: 'INSUFFICIENT_BALANCE',
      required: cost,
      current: currentBalance
    });
  }

  await redis.decrby(balanceKey, cost);

  try {
    const defaultParams = typeof endpoint.defaultParams === 'string' ? JSON.parse(endpoint.defaultParams) : endpoint.defaultParams || {};
    
    let requestBody = {};
    let targetUrl = endpoint.targetUrl;

    if (endpoint.type === 'image') {
      const parts = [];
      
      if (imageUrls && imageUrls.length > 0) {
        for (const imgUrl of imageUrls) {
          try {
            const imgResponse = await axios.get(imgUrl, { responseType: 'arraybuffer' });
            const base64Data = Buffer.from(imgResponse.data).toString('base64');
            const mimeType = imgResponse.headers['content-type'] || 'image/jpeg';
            parts.push({
              inline_data: {
                mime_type: mimeType,
                data: base64Data
              }
            });
          } catch (imgErr) {
            console.error('[AIGenerate] Failed to fetch image:', imgUrl, imgErr.message);
          }
        }
      }
      
      parts.unshift({ text: prompt });

      requestBody = {
        contents: [{
          role: 'user',
          parts: parts
        }],
        generationConfig: {
          responseModalities: ['TEXT', 'IMAGE'],
          imageConfig: {
            aspectRatio: ASPECT_RATIO_MAP[aspectRatio] || defaultParams.aspectRatio || '3:4'
          }
        }
      };

      const finalResolution = resolution || defaultParams.resolution;
      if (finalResolution) {
        requestBody.generationConfig.imageConfig.imageSize = finalResolution;
      }

    } else if (endpoint.type === 'video') {
      const isGrok = pathPrefix === 'grok3.1';
      const videoModel = model || defaultParams?.model?.default || (isGrok ? 'grok-video-3' : 'veo_3_1-fast-4K');
      
      let imagesBase64 = [];
      
      if (imageUrls && imageUrls.length > 0) {
        for (const imgUrl of imageUrls) {
          try {
            if (imgUrl.startsWith('data:')) {
              imagesBase64.push(imgUrl);
            } else {
              const imgResponse = await axios.get(imgUrl, { responseType: 'arraybuffer' });
              const base64Data = Buffer.from(imgResponse.data).toString('base64');
              const mimeType = imgResponse.headers['content-type'] || 'image/jpeg';
              imagesBase64.push(`data:${mimeType};base64,${base64Data}`);
            }
          } catch (imgErr) {
            console.error('[AIGenerate] Failed to process image:', imgUrl, imgErr.message);
          }
        }
      }
      
      if (isGrok) {
        requestBody = {
          model: videoModel,
          prompt: prompt + ' --mode=custom',
          aspect_ratio: aspectRatio || defaultParams.aspectRatio?.default || '3:2',
          size: resolution || defaultParams.size?.default || defaultParams.resolution?.default || '1080P',
          images: imagesBase64.length > 0 ? imagesBase64 : []
        };
      } else {
        requestBody = {
          enable_upsample: true,
          enhance_prompt: true,
          images: imagesBase64.length > 0 ? imagesBase64 : [],
          model: videoModel || defaultParams?.model?.default || 'veo_3_1-fast-4K',
          prompt: prompt,
          aspect_ratio: aspectRatio || defaultParams.aspectRatio?.default || '16:9'
        };
      }
    }

    console.log('[AIGenerate] Target URL:', targetUrl);
    console.log('[AIGenerate] Request body:', JSON.stringify(requestBody, null, 2));

    let authToken = apiKey;
    if (endpoint.authType === 'bearer' && endpoint.authValue) {
      authToken = decrypt(endpoint.authValue) || apiKey;
    } else if (endpoint.authType === 'api_key' && endpoint.authValue) {
      authToken = decrypt(endpoint.authValue) || apiKey;
    }

    const response = await axios({
      method: endpoint.method || 'POST',
      url: targetUrl,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      data: requestBody,
      timeout: endpoint.timeout || 600000,
      maxBodyLength: 50 * 1024 * 1024,
      maxContentLength: 50 * 1024 * 1024
    });

    console.log('[AIGenerate] Response status:', response.status);
    console.log('[AIGenerate] Response data:', JSON.stringify(response.data, null, 2));

    let resultUrls = [];
    let resultText = '';
    let taskId = null;
    let taskStatus = 'completed';

    if (endpoint.type === 'image') {
      const candidates = response.data?.candidates;
      if (candidates && candidates.length > 0) {
        const parts = candidates[0]?.content?.parts || [];
        for (const part of parts) {
          if (part.inlineData) {
            const imgData = part.inlineData.data;
            const base64Url = `data:${part.inlineData.mimeType};base64,${imgData}`;
            
            const aiTask = await AiGenerateTask.create({
              userId: user.id,
              endpointId: endpoint.id,
              taskId: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              apiKey: apiKey,
              model: endpoint.name,
              prompt: prompt,
              status: 'processing',
              progress: 50,
              resultData: response.data,
              cost: cost,
              balanceChangeType: 'consume',
              balanceChangeAt: new Date()
            });
            
            sendTaskUpdate(user.id, {
              taskId: aiTask.taskId,
              status: 'processing',
              progress: 50,
              message: '图片生成中...'
            });
            
            res.json({
              success: true,
              taskId: aiTask.taskId,
              status: 'processing',
              model: endpoint.name,
              result: [],
              balance: await redis.get(balanceKey),
              message: '图片生成中，正在上传...'
            });
            
            console.log('[AIGenerate] Uploading image to RunningHub...');
            try {
              const uploadedUrl = await uploadBase64ToRunningHub(base64Url);
              
              if (uploadedUrl) {
                const shortUrl = uploadedUrl.split('?')[0];
                await aiTask.update({
                  status: 'completed',
                  progress: 100,
                  resultUrl: shortUrl,
                  resultData: { ...response.data, fullUrl: uploadedUrl }
                });
                
                sendTaskUpdate(user.id, {
                  taskId: aiTask.taskId,
                  status: 'completed',
                  progress: 100,
                  resultUrl: shortUrl,
                  fullUrl: uploadedUrl,
                  message: '生成完成'
                });
                
                console.log('[AIGenerate] Image task completed, URL:', shortUrl);
              } else {
                await aiTask.update({
                  status: 'completed',
                  progress: 100,
                  resultUrl: base64Url,
                  resultData: { ...response.data, originalBase64: true }
                });
                
                sendTaskUpdate(user.id, {
                  taskId: aiTask.taskId,
                  status: 'completed',
                  progress: 100,
                  resultUrl: base64Url,
                  message: '生成完成（未上传）'
                });
                
                console.log('[AIGenerate] Image task completed with base64 fallback');
              }
            } catch (uploadError) {
              console.error('[AIGenerate] Upload error:', uploadError.message);
              
              await aiTask.update({
                status: 'completed',
                progress: 100,
                resultUrl: base64Url,
                resultData: { ...response.data, originalBase64: true, uploadError: uploadError.message }
              });
              
              sendTaskUpdate(user.id, {
                taskId: aiTask.taskId,
                status: 'completed',
                progress: 100,
                resultUrl: base64Url,
                message: '生成完成（上传失败）'
              });
            }
            return;
          } else if (part.text) {
            resultText += part.text;
          }
        }
      }
    } else {
      taskId = response.data?.id || response.data?.data?.id;
      taskStatus = response.data?.status || 'queued';
      
      if (taskId) {
        const aiTask = await AiGenerateTask.create({
          userId: user.id,
          endpointId: endpoint.id,
          taskId: taskId,
          apiKey: apiKey,
          model: endpoint.name,
          prompt: prompt,
          status: taskStatus,
          progress: response.data?.progress || 0,
          resultData: response.data,
          cost: cost,
          balanceChangeType: 'consume',
          balanceChangeAt: new Date()
        });
        
        console.log('[AIGenerate] Task saved, taskId:', taskId, 'status:', taskStatus);
        
        startTaskPolling(aiTask.id);
        
        res.json({
          success: true,
          taskId: taskId,
          status: taskStatus,
          model: endpoint.name,
          result: [],
          balance: await redis.get(balanceKey),
          message: '任务已提交，请轮询查询结果'
        });
        return;
      }
      
      if (response.data?.data) {
        const data = response.data.data;
        if (Array.isArray(data)) {
          resultUrls = data.map(url => ({ url }));
        } else if (typeof data === 'string') {
          resultUrls = [{ url: data }];
        } else if (data.url) {
          resultUrls = [{ url: data.url }];
        }
      } else if (response.data?.result) {
        const result = response.data.result;
        if (Array.isArray(result)) {
          resultUrls = result.map(url => ({ url }));
        } else {
          resultUrls = [{ url: result }];
        }
      }
    }

    const durationMs = Date.now() - startTime;
    console.log('[AIGenerate] Total duration:', durationMs, 'ms');

    res.json({
      success: true,
      model: endpoint.name,
      result: resultUrls,
      text: resultText,
      balance: await redis.get(balanceKey),
      duration: durationMs
    });

  } catch (error) {
    console.error('[AIGenerate] Error:', error.message);
    console.error('[AIGenerate] Error response:', error.response?.data);
    
    if (error.response) {
      res.status(error.response.status).json({
        success: false,
        error: error.response.data?.error?.message || error.message,
        details: error.response.data
      });
    } else if (error.code === 'ECONNABORTED') {
      res.status(504).json({
        success: false,
        error: 'Request timeout',
        code: 'TIMEOUT'
      });
    } else {
      console.error('[AIGenerate] Server error:', error.stack);
      res.status(500).json({
        success: false,
        error: error.message,
        stack: error.stack
      });
    }
  }
});

async function refundTaskCost(userId, cost, taskId, taskDbId) {
  try {
    const user = await User.findByPk(userId);
    if (!user) {
      console.error(`[AIGenerate] Refund failed: User ${userId} not found`);
      return;
    }
    
    const balanceKey = KEYS.balance(userId);
    const newBalance = await redis.incrby(balanceKey, cost);
    
    user.balance = newBalance;
    await user.save();
    
    await BalanceLog.create({
      userId: userId,
      change: cost,
      reason: `AI生成任务失败，积分返还 (taskId: ${taskId})`,
      balanceAfter: newBalance,
      relatedId: taskDbId,
      type: 'refund'
    });
    
    if (taskDbId) {
      await AiGenerateTask.update({
        refundAmount: cost,
        balanceChangeType: 'refund',
        balanceChangeAt: new Date()
      }, {
        where: { id: taskDbId }
      });
    }
    
    console.log(`[AIGenerate] Refunded ${cost} points to user ${userId}, new balance: ${newBalance}`);
  } catch (error) {
    console.error(`[AIGenerate] Refund error:`, error);
  }
}

async function uploadBase64ToRunningHub(base64Data) {
  try {
    const uploadEndpoint = await ApiEndpoint.findOne({
      where: {
        pathPrefix: 'runninghub/upload',
        isActive: true
      }
    });
    
    if (!uploadEndpoint) {
      console.error('[AIGenerate] RunningHub upload endpoint not found');
      return null;
    }
    
    let authToken = uploadEndpoint.authValue ? decrypt(uploadEndpoint.authValue) : null;
    if (!authToken) {
      console.error('[AIGenerate] RunningHub API Key not configured');
      return null;
    }
    
    const base64Content = base64Data.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Content, 'base64');
    
    const formData = new FormData();
    const blob = new Blob([buffer], { type: 'image/png' });
    formData.append('file', blob, `image_${Date.now()}.png`);
    
    console.log('[AIGenerate] Uploading to RunningHub with endpoint auth...');
    
    const response = await axios.post(uploadEndpoint.targetUrl, formData, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'multipart/form-data'
      },
      timeout: 60000
    });
    
    console.log('[AIGenerate] Upload response:', response.data);
    
    if (response.data?.code === 0 || response.data?.success) {
      return response.data?.data?.url || response.data?.url;
    }
    
    console.error('[AIGenerate] Upload failed:', response.data?.msg);
    return null;
  } catch (error) {
    console.error('[AIGenerate] Upload error:', error.message);
    return null;
  }
}

async function startTaskPolling(taskDbId) {
  const maxAttempts = 120;
  let attempts = 0;
  
  try {
    const aiTask = await AiGenerateTask.findByPk(taskDbId);
    if (!aiTask) {
      console.error(`[AIGenerate] Task not found: ${taskDbId}`);
      return;
    }
    
    console.log(`[AIGenerate] Starting polling for taskId: ${aiTask.taskId}, endpointId: ${aiTask.endpointId}`);
    
    const taskId = aiTask.taskId;
    const userId = aiTask.userId;
    const cost = aiTask.cost;
    
    const endpoint = await ApiEndpoint.findByPk(aiTask.endpointId);
    if (!endpoint) {
      console.error(`[AIGenerate] Endpoint not found: ${aiTask.endpointId}`);
      return;
    }
    
    const baseUrl = endpoint.targetUrl;
    console.log(`[AIGenerate] Base URL: ${baseUrl}`);
    
    let authToken = aiTask.apiKey;
    if (endpoint.authType === 'bearer' && endpoint.authValue) {
      authToken = decrypt(endpoint.authValue) || aiTask.apiKey;
    }
    
    console.log(`[AIGenerate] Starting poll interval for task ${taskId}`);
    
    let queryUrl = '';
    if (baseUrl.includes('/v1beta/')) {
      const base = baseUrl.split('/v1beta/')[0];
      queryUrl = `${base}/v1/video/query?id=${taskId}`;
    } else if (baseUrl.includes('/v1/')) {
      const base = baseUrl.split('/v1/')[0];
      queryUrl = `${base}/v1/video/query?id=${taskId}`;
    } else {
      queryUrl = `${baseUrl.replace(/\/$/, '')}/v1/video/query?id=${taskId}`;
    }
    
    console.log(`[AIGenerate] Query URL: ${queryUrl}`);
    
    const pollInterval = setInterval(async () => {
    attempts++;
    
    try {
      console.log(`[AIGenerate] Polling URL: ${queryUrl}`);
      
      const response = await axios.get(queryUrl, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });
      
      const taskData = response.data;
      const status = taskData?.status;
      const progress = taskData?.progress || (status === 'completed' ? 100 : 0);
      const videoUrl = taskData?.video_url;
      
      console.log(`[AIGenerate] Poll task ${taskId}, status: ${status}, video_url: ${videoUrl}`);
      
      const aiTask = await AiGenerateTask.findByPk(taskDbId);
      if (!aiTask) {
        clearInterval(pollInterval);
        return;
      }
      
      if (status === 'completed' || status === 'success') {
        clearInterval(pollInterval);
        
        await aiTask.update({
          status: 'completed',
          progress: 100,
          resultUrl: videoUrl,
          resultData: taskData
        });
        
        sendTaskUpdate(userId, {
          taskId: taskId,
          status: 'completed',
          progress: 100,
          resultUrl: videoUrl,
          message: '生成完成'
        });
        
        console.log(`[AIGenerate] Task ${taskId} completed, video_url:`, videoUrl);
        
      } else if (status === 'failed' || status === 'error') {
        clearInterval(pollInterval);
        
        await aiTask.update({
          status: 'failed',
          progress: progress,
          errorMessage: taskData?.error?.message || taskData?.message || 'Generation failed',
          resultData: taskData
        });
        
        await refundTaskCost(userId, cost, taskId, taskDbId);
        
        sendTaskUpdate(userId, {
          taskId: taskId,
          status: 'failed',
          progress: progress,
          errorMessage: taskData?.error?.message || '生成失败',
          message: '生成失败，积分已返还'
        });
        
        console.error(`[AIGenerate] Task ${taskId} failed:`, taskData);
        
      } else if (status === 'processing' || status === 'pending' || status === 'queued') {
        await aiTask.update({
          status: status === 'processing' ? 'processing' : 'queued',
          progress: progress,
          resultData: taskData
        });
        
        sendTaskUpdate(userId, {
          taskId: taskId,
          status: status === 'processing' ? 'processing' : 'queued',
          progress: progress,
          message: status === 'processing' ? '生成中...' : '排队中'
        });
      }
      
      if (attempts >= maxAttempts) {
        clearInterval(pollInterval);
        await aiTask.update({
          status: 'failed',
          errorMessage: 'Task timeout'
        });
        
        await refundTaskCost(userId, cost, taskId, taskDbId);
        
        sendTaskUpdate(userId, {
          taskId: taskId,
          status: 'failed',
          errorMessage: '任务超时',
          message: '生成超时，积分已返还'
        });
        
        console.error(`[AIGenerate] Task ${taskId} timeout after ${maxAttempts} attempts`);
      }
      
    } catch (error) {
      console.error(`[AIGenerate] Poll error for task ${taskId}:`, error.message);
      
      if (attempts >= maxAttempts) {
        clearInterval(pollInterval);
        const aiTask = await AiGenerateTask.findByPk(taskDbId);
        if (aiTask) {
          await aiTask.update({
            status: 'failed',
            errorMessage: 'Task polling timeout'
          });
          
          await refundTaskCost(userId, cost, taskId, taskDbId);
        }
      }
    }
  }, 5000);
  } catch (error) {
    console.error(`[AIGenerate] Start polling error:`, error);
  }
}

router.get('/task/:taskId', async (req, res) => {
  const { taskId } = req.params;
  
  try {
    const task = await AiGenerateTask.findOne({
      where: { taskId: taskId }
    });
    
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }
    
    res.json({
      success: true,
      taskId: task.taskId,
      status: task.status,
      progress: task.progress,
      resultUrl: task.resultUrl,
      resultData: task.resultData,
      errorMessage: task.errorMessage
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/tasks', async (req, res) => {
  let apiKey = req.headers['x-api-key'] || req.headers['authorization'];
  if (apiKey && apiKey.startsWith('Bearer ')) {
    apiKey = apiKey.substring(7);
  }
  
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'API Key is required'
    });
  }
  
  const user = await User.findOne({ where: { apiKey } });
  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'Invalid API Key'
    });
  }
  
  try {
    const { status, type, page = 1, pageSize = 10 } = req.query;
    const limit = parseInt(pageSize, 10) || 10;
    const offset = (parseInt(page, 10) - 1) * limit;
    
    const where = { userId: user.id };
    
    if (status && status !== 'all') {
      where.status = status;
    }
    
    const { count, rows: tasks } = await AiGenerateTask.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit,
      offset
    });
    
    let filteredTasks = tasks;
    if (type && type !== 'all') {
      filteredTasks = tasks.filter(t => {
        const modelLower = (t.model || '').toLowerCase();
        if (type === 'video') {
          return modelLower.includes('video') || modelLower.includes('veo') || modelLower.includes('grok');
        } else if (type === 'image') {
          return !modelLower.includes('video') && !modelLower.includes('veo') && !modelLower.includes('grok');
        }
        return true;
      });
    }
    
    res.json({
      success: true,
      total: count,
      page: parseInt(page, 10),
      pageSize: limit,
      tasks: filteredTasks.map(t => ({
        id: t.id,
        taskId: t.taskId,
        model: t.model,
        prompt: t.prompt,
        status: t.status,
        progress: t.progress,
        resultUrl: t.resultUrl,
        cost: t.cost,
        refundAmount: t.refundAmount,
        balanceChangeType: t.balanceChangeType,
        balanceChangeAt: t.balanceChangeAt,
        createdAt: t.createdAt
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

const sseClients = new Map();

router.get('/stream', (req, res) => {
  const token = req.query.token;
  
  if (!token) {
    return res.status(401).json({ success: false, error: 'Token is required' });
  }
  
  let userId;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    userId = decoded.userId;
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
  
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();
  
  if (!sseClients.has(userId)) {
    sseClients.set(userId, []);
  }
  sseClients.get(userId).push(res);
  
  console.log(`[SSE] Client connected for user ${userId}, total: ${sseClients.get(userId).length}`);
  
  const keepAlive = setInterval(() => {
    res.write(': keepalive\n\n');
  }, 30000);
  
  req.on('close', () => {
    clearInterval(keepAlive);
    const clientList = sseClients.get(userId);
    if (clientList) {
      const index = clientList.indexOf(res);
      if (index > -1) {
        clientList.splice(index, 1);
      }
      if (clientList.length === 0) {
        sseClients.delete(userId);
      }
    }
    console.log(`[SSE] Client disconnected for user ${userId}`);
  });
});

function sendTaskUpdate(userId, taskData) {
  const clients = sseClients.get(userId);
  if (!clients || clients.length === 0) {
    console.log(`[SSE] No clients for user ${userId}`);
    return;
  }
  
  const data = JSON.stringify(taskData);
  clients.forEach(client => {
    try {
      client.write(`data: ${data}\n\n`);
    } catch (err) {
      console.error(`[SSE] Send error:`, err);
    }
  });
  console.log(`[SSE] Sent update to user ${userId}:`, taskData);
}

module.exports = router;