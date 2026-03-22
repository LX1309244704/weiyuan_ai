const { Queue, Worker } = require('bullmq');
const IORedis = require('ioredis');
const { sequelize, AiGenerateTask, User, BalanceLog } = require('../models');
const providerManager = require('../providers');

// Redis 连接配置
const connection = new IORedis(process.env.REDIS_URL || {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null
}, {
  maxRetriesPerRequest: null
});

// SSE 客户端管理
const sseClients = new Map();

/**
 * 发送 SSE 更新
 */
function sendTaskUpdate(userId, taskData) {
  const clients = sseClients.get(userId);
  if (!clients) return;
  clients.forEach(client => {
    try { client.write(`data: ${JSON.stringify(taskData)}\n\n`); } catch (err) {}
  });
}

/**
 * 退款处理
 */
async function refundTaskCost(userId, cost, taskId, taskDbId) {
  if (!taskDbId || cost <= 0) return;
  
  try {
    await sequelize.transaction(async (t) => {
      // 检查是否已退款
      const task = await AiGenerateTask.findByPk(taskDbId, { transaction: t });
      if (task && task.refundAmount > 0) {
        console.log(`[Refund] Task ${taskDbId} already refunded`);
        return null;
      }
      
      const user = await User.findByPk(userId, { attributes: ['balance'], transaction: t, lock: t.LOCK.UPDATE });
      const balance = user.balance + cost;
      await User.update({ balance }, { where: { id: userId }, transaction: t });
      await BalanceLog.create({
        userId, change: cost,
        reason: 'AI生成失败退款',
        balanceAfter: balance,
        relatedId: taskDbId,
        type: 'refund'
      }, { transaction: t });
      if (taskDbId) {
        await AiGenerateTask.update(
          { refundAmount: cost, balanceChangeType: 'refund', balanceChangeAt: new Date() },
          { where: { id: taskDbId }, transaction: t }
        );
      }
      return balance;
    });
  } catch (error) {
    console.error('[Refund] Error:', error.message);
  }
}

// AI 生成任务队列
const taskQueue = new Queue('ai-generate-tasks', { connection });

/**
 * 添加任务到队列（使用 taskDbId 作为 jobId 确保幂等）
 */
async function addTaskToQueue(taskDbId, taskData) {
  // 使用 taskDbId 作为 jobId，确保相同任务不会重复添加
  const jobId = `task-${taskDbId}`;
  
  // 检查任务是否已存在
  const existingJob = await taskQueue.getJob(jobId);
  if (existingJob) {
    const state = await existingJob.getState();
    if (state === 'completed' || state === 'active') {
      console.log(`[Queue] Task ${taskDbId} already exists with state: ${state}`);
      return;
    }
  }
  
  await taskQueue.add(
    'poll-task',
    { taskDbId, ...taskData },
    {
      jobId, // 固定的 jobId，确保幂等
      attempts: 1, // BullMQ 会自动重试，不需要重试
      removeOnComplete: false,
      removeOnFail: false,
      backoff: false // 禁用自动重试，我们在代码中手动控制
    }
  );
  console.log(`[Queue] Added task ${taskDbId} to queue`);
}

/**
 * 创建轮询 Worker
 */
function createPollingWorker() {
  const worker = new Worker('ai-generate-tasks', async (job) => {
    const { taskDbId, provider: providerName, taskId } = job.data;
    
    console.log(`[Worker] Processing task ${taskId}`);
    
    // 幂等检查：再次查询任务状态，如果已完成或已退款则跳过
    const task = await AiGenerateTask.findByPk(taskDbId);
    if (!task) {
      console.log(`[Worker] Task ${taskDbId} not found`);
      return;
    }
    
    // 如果任务已完成，直接返回
    if (task.status === 'completed' && task.resultUrl) {
      console.log(`[Worker] Task ${taskDbId} already completed`);
      sendTaskUpdate(task.userId, { taskId: task.taskId, status: 'completed', resultUrl: task.resultUrl });
      return;
    }
    
    // 如果任务已失败且已退款，跳过
    if (task.status === 'failed' && task.refundAmount > 0) {
      console.log(`[Worker] Task ${taskDbId} already failed and refunded`);
      return;
    }
    
    // 获取模型配置（包含 API key）
    const modelConfig = await require('../models').AiModel.findOne({
      where: { provider: providerName }
    });
    
    const mergedConfig = {
      ...task.toJSON(),
      ...(modelConfig ? modelConfig.toJSON() : {})
    };
    
    const providerHandler = providerManager.get(providerName, mergedConfig);
    if (!providerHandler) {
      console.error(`[Worker] No provider for ${providerName}`);
      return;
    }
    
    const pollConfig = providerHandler.buildPollRequest(task.taskId);
    if (!pollConfig) {
      console.error(`[Worker] No poll config for task ${taskId}`);
      return;
    }
    
    // 轮询任务状态
    const maxAttempts = 120;
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      attempts++;
      
      try {
        const axios = require('axios');
        const response = await axios(pollConfig);
        const result = providerHandler.parsePollResponse(response);
        
        if (result.completed) {
          if (result.success) {
            const resultUrl = result.resultUrl || (result.resultUrls && result.resultUrls[0]) || null;
            
            await sequelize.transaction(async (tx) => {
              await AiGenerateTask.update(
                { status: 'completed', progress: 100, resultUrl, resultData: response.data },
                { where: { id: taskDbId }, transaction: tx }
              );
            });
            
            sendTaskUpdate(task.userId, { taskId: task.taskId, status: 'completed', resultUrl });
          } else {
            await task.update({ status: 'failed', errorMessage: result.error });
            await refundTaskCost(task.userId, task.cost, task.taskId, taskDbId);
            sendTaskUpdate(task.userId, { taskId: task.taskId, status: 'failed', message: '已退款' });
          }
          return; // 任务完成
        }
        
        // 更新进度
        await task.update({ status: result.status, progress: result.progress || 0 });
        sendTaskUpdate(task.userId, { taskId: task.taskId, status: result.status, progress: result.progress });
        
      } catch (error) {
        console.error(`[Worker] Poll error for ${taskId}:`, error.message);
        
        // 如果是客户端错误（4xx），标记失败
        const httpStatus = error.response?.status;
        if (httpStatus >= 400 && httpStatus < 500 && httpStatus !== 401 && httpStatus !== 403) {
          await task.update({ status: 'failed', errorMessage: `请求错误: ${error.message}` });
          await refundTaskCost(task.userId, task.cost, task.taskId, taskDbId);
          sendTaskUpdate(task.userId, { taskId: task.taskId, status: 'failed', message: '请求错误，已退款' });
          return;
        }
      }
      
      // 等待 5 秒
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    // 超时
    await task.update({ status: 'failed', errorMessage: 'Timeout' });
    await refundTaskCost(task.userId, task.cost, task.taskId, taskDbId);
    sendTaskUpdate(task.userId, { taskId: task.taskId, status: 'failed', message: '超时，已退款' });
    
  }, {
    connection,
    concurrency: 10, // 同时处理 10 个任务
    limiter: {
      max: 100,
      duration: 60000
    }
  });
  
  worker.on('completed', (job) => {
    console.log(`[Worker] Job ${job.id} completed`);
  });
  
  worker.on('failed', (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed:`, err.message);
  });
  
  return worker;
}

/**
 * 恢复未完成的任务到队列
 */
async function recoverPendingTasks() {
  try {
    console.log('[Recovery] Starting task recovery...');
    
    const pendingTasks = await AiGenerateTask.findAll({
      where: { status: ['queued', 'processing'] }
    });
    
    console.log(`[Recovery] Found ${pendingTasks.length} pending tasks`);
    
    for (const task of pendingTasks) {
      await addTaskToQueue(task.id, {
        taskDbId: task.id,
        provider: task.provider,
        taskId: task.taskId,
        userId: task.userId
      });
    }
    
    console.log('[Recovery] Done');
  } catch (error) {
    console.error('[Recovery] Failed:', error.message);
  }
}

module.exports = {
  taskQueue,
  addTaskToQueue,
  createPollingWorker,
  recoverPendingTasks,
  sseClients,
  sendTaskUpdate
};
