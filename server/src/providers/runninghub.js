/**
 * RunningHub 运营商处理器
 */
const BaseProvider = require('./base');

class RunningHubProvider extends BaseProvider {
  static provider = 'runninghub';
  static name = 'RunningHub';

  // 模型配置
  static models = [
    // 图片模型 - 香蕉Pro
    { 
      id: 'runninghub/nanobanana', 
      name: '香蕉Pro', 
      description: '支持文生图和图生图',
      type: 'image',
      icon: '🎨',
      pricePerCall: 50,
      defaultParams: { resolution: '2k', aspectRatio: '1:1' },
      paramConfig: [
        {
          name: 'resolution',
          label: '分辨率',
          type: 'select',
          options: [
            { value: '1k', label: '1K (低清)' },
            { value: '2k', label: '2K (高清)' },
            { value: '4k', label: '4K (超清)' }
          ],
          default: '2k'
        },
        {
          name: 'aspectRatio',
          label: '宽高比',
          type: 'select',
          options: [
            { value: '1:1', label: '1:1 (正方形)' },
            { value: '3:4', label: '3:4 (竖版)' },
            { value: '4:3', label: '4:3 (横版)' },
            { value: '9:16', label: '9:16 (手机竖版)' },
            { value: '16:9', label: '16:9 (横屏)' }
          ],
          default: '1:1'
        }
      ]
    },
    // 视频模型 - VEO3.1视频生成
    {
      id: 'runninghub/veo31',
      name: 'VEO3.1视频生成',
      description: 'AI 智能生成视频，支持文字、图片等多种方式',
      type: 'video',
      icon: '🎬',
      pricePerCall: 100,
      defaultParams: { mode: 't2v', aspectRatio: '16:9', duration: '8', resolution: '720p' },
      paramConfig: [
        {
          name: 'mode',
          label: '生成模式',
          type: 'select',
          options: [
            { value: 't2v', label: '文生视频' },
            { value: 'se2v', label: '首尾帧' },
            { value: 'i2v', label: '参考生成' }
          ],
          default: 't2v'
        },
        {
          name: 'aspectRatio',
          label: '视频比例',
          type: 'select',
          options: [
            { value: '16:9', label: '16:9 (横屏)' },
            { value: '9:16', label: '9:16 (竖屏)' }
          ],
          default: '16:9'
        },
        {
          name: 'duration',
          label: '视频时长',
          type: 'select',
          options: [
            { value: '8', label: '8秒' }
          ],
          default: '8'
        },
        {
          name: 'resolution',
          label: '视频清晰度',
          type: 'select',
          options: [
            { value: '720p', label: '720P (高清)' },
            { value: '1080p', label: '1080P (全高清)' },
            { value: '4k', label: '4K (超高清)' }
          ],
          default: '720p'
        }
      ]
    }
  ];

  // 根据模型ID获取 API URL
  static getApiUrlByModel(modelId, mode) {
    const apiUrls = {
      'runninghub/nanobanana': (hasImage) => hasImage 
        ? 'https://www.runninghub.cn/openapi/v2/rhart-image-n-pro/edit'
        : 'https://www.runninghub.cn/openapi/v2/rhart-image-n-pro/text-to-image',
      'runninghub/veo31': {
        't2v': 'https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-pro/text-to-video',
        'se2v': 'https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-fast/start-end-to-video',
        'i2v': 'https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-fast/image-to-video'
      }
    };
    return apiUrls[modelId];
  }

  // 获取 API URL
  static getApiUrl(hasImage) {
    return 'https://www.runninghub.cn/openapi/v2/rhart-image-n-pro/text-to-image';
  }

  buildRequest(params) {
    const { prompt, imageUrls, firstFrameUrl, lastFrameUrl, resolution, aspectRatio, duration, mode, ...extra } = params;
    
    let body = { prompt: prompt || '' };

    // 根据模型类型构建不同的请求体
    if (this.modelId === 'runninghub/veo31') {
      // VEO3.1视频生成
      const videoMode = mode || 't2v';
      
      if (videoMode === 'se2v') {
        // 首尾帧生视频
        if (firstFrameUrl) body.firstFrameUrl = firstFrameUrl;
        if (lastFrameUrl) body.lastFrameUrl = lastFrameUrl;
        if (imageUrls && imageUrls.length > 0) {
          body.firstFrameUrl = imageUrls[0];
          if (imageUrls.length > 1) body.lastFrameUrl = imageUrls[1];
        }
      } else if (videoMode === 'i2v') {
        // 图生视频
        if (imageUrls && imageUrls.length > 0) body.imageUrls = imageUrls;
      }
      // 文生视频(t2v)不需要额外图片参数
      
      body.aspectRatio = aspectRatio || '16:9';
      body.duration = duration || '8';
      body.resolution = resolution || '720p';
    } else {
      // 图片生成
      const resolutionMap = {
        '1:1': '2k', '3:4': '2k', '4:3': '2k',
        '16:9': '2k', '9:16': '2k'
      };
      body.resolution = resolutionMap[resolution] || resolution || '2k';
      if (aspectRatio) body.aspectRatio = aspectRatio;
      if (imageUrls && imageUrls.length > 0) body.imageUrls = imageUrls;
    }

    return { ...body, ...extra };
  }

  // 获取 API URL（根据模型和参数）
  getRequestUrl(requestBody) {
    const modelId = this.modelId || this.config?.modelId;
    const mode = requestBody.mode || 't2v';
    
    if (modelId === 'runninghub/veo31') {
      const veo31Urls = {
        't2v': 'https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-pro/text-to-video',
        'se2v': 'https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-fast/start-end-to-video',
        'i2v': 'https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-fast/image-to-video'
      };
      return veo31Urls[mode] || veo31Urls['t2v'];
    } else if (modelId === 'runninghub/nanobanana') {
      return requestBody.imageUrls && requestBody.imageUrls.length > 0
        ? 'https://www.runninghub.cn/openapi/v2/rhart-image-n-pro/edit'
        : 'https://www.runninghub.cn/openapi/v2/rhart-image-n-pro/text-to-image';
    }
    
    return 'https://www.runninghub.cn/openapi/v2/rhart-image-n-pro/text-to-image';
  }

  parseResponse(response) {
    const data = response.data;
    
    // 检查错误码 (RunningHub 使用 code 字段)
    if (data.code && data.code !== 0 && data.code !== '0') {
      return { success: false, error: data.msg || data.errorMessage || `Error code: ${data.code}`, status: 'failed' };
    }
    
    // 也检查 errorCode 字段（兼容其他格式）
    if (data.errorCode && data.errorCode !== 0 && data.errorCode !== '0') {
      return { success: false, error: data.errorMessage || 'Unknown error', status: 'failed' };
    }

    if (data.taskId) {
      return { success: true, taskId: data.taskId, status: 'queued', resultUrls: [] };
    }

    const results = data.results || data.data || [];
    const resultUrls = Array.isArray(results) 
      ? results.map(r => typeof r === 'string' ? r : r.url || r.imageUrl).filter(Boolean)
      : [];

    return { success: true, status: resultUrls.length > 0 ? 'completed' : 'failed', resultUrls };
  }

  buildPollRequest(taskId) {
    return {
      url: 'https://www.runninghub.cn/openapi/v2/query',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...this.getAuthHeaders() },
      data: { taskId }
    };
  }

  parsePollResponse(response) {
    const data = response.data;
    
    // 检查 token 错误 - 不退款，继续重试（可能是临时问题）
    if (data.code === 412 || data.msg?.includes('TOKEN_INVALID')) {
      console.warn('[RunningHub] Token invalid, continuing to poll');
      return { completed: false, status: 'processing', progress: 0 };
    }
    
    const status = data.data || data.status;

    if (status === 'SUCCESS') {
      const resultUrls = (data.results || []).map(r => r.url).filter(Boolean);
      return { completed: true, success: true, resultUrls };
    }
    if (status === 'FAILED') {
      // 任务执行失败，需要退款
      return { completed: true, success: false, error: data.errorMessage || data.msg || 'Task failed', shouldRefund: true };
    }
    if (status === 'RUNNING') {
      return { completed: false, status: 'processing', progress: 50 };
    }
    if (status === 'QUEUED') {
      return { completed: false, status: 'queued', progress: 0 };
    }

    console.log('[RunningHub] Unknown status:', status, 'Full response:', data);
    return { completed: false, status: status || 'unknown', progress: 0 };
  }
}

module.exports = RunningHubProvider;
