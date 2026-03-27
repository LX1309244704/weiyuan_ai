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
            { value: '1:1', label: '1:1' },
            { value: '16:9', label: '16:9' },
            { value: '9:16', label: '9:16' },
            { value: '4:3', label: '4:3' },
            { value: '3:4', label: '3:4' },
            { value: '3:2', label: '3:2' },
            { value: '2:3', label: '2:3' },
            { value: '5:4', label: '5:4' },
            { value: '4:5', label: '4:5' },
            { value: '21:9', label: '21:9' }
          ],
          default: '1:1'
        }
      ]
    },
    // 图片模型 - 香蕉Flash (全能图片V2)
    {
      id: 'runninghub/bananaflash',
      name: '香蕉Flash',
      description: '全能图片V2，高并发极速响应，支持文生图和图生图',
      type: 'image',
      icon: '⚡',
      pricePerCall: 30,
      defaultParams: { resolution: '1k', aspectRatio: '9:16' },
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
          default: '1k'
        },
        {
          name: 'aspectRatio',
          label: '宽高比',
          type: 'select',
          options: [
            { value: '1:1', label: '1:1' },
            { value: '16:9', label: '16:9' },
            { value: '9:16', label: '9:16' },
            { value: '4:3', label: '4:3' },
            { value: '3:4', label: '3:4' },
            { value: '3:2', label: '3:2' },
            { value: '2:3', label: '2:3' },
            { value: '5:4', label: '5:4' },
            { value: '4:5', label: '4:5' },
            { value: '21:9', label: '21:9' }
          ],
          default: '9:16'
        }
      ]
    },
    // 视频模型 - Sora2 (文生视频/图生视频合一)
    {
      id: 'runninghub/sora2',
      name: 'Sora2 视频生成',
      description: '全能视频S-文生视频/图生视频，有图用图生，无图用文生',
      type: 'video',
      icon: '🎬',
      pricePerCall: 80,
      defaultParams: { aspectRatio: '9:16', duration: '10' },
      paramConfig: [
        {
          name: 'aspectRatio',
          label: '视频比例',
          type: 'select',
          options: [
            { value: '9:16', label: '9:16 (竖屏)' },
            { value: '16:9', label: '16:9 (横屏)' }
          ],
          default: '9:16'
        },
        {
          name: 'duration',
          label: '视频时长',
          type: 'select',
          options: [
            { value: '10', label: '10秒' },
            { value: '15', label: '15秒' }
          ],
          default: '10'
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
    },
    // 视频模型 - 全能视频X (低价渠道版，有图用图生，无图用文生)
    {
      id: 'runninghub/videoX',
      name: '全能视频X',
      description: '低价渠道版，精准解析复杂长文本逻辑，电影级镜头调度，有图用图生，无图用文生',
      type: 'video',
      icon: '🎬',
      pricePerCall: 50,
      defaultParams: { aspectRatio: '2:3', resolution: '720p', duration: 6 },
      paramConfig: [
        {
          name: 'aspectRatio',
          label: '视频比例',
          type: 'select',
          options: [
            { value: '2:3', label: '2:3' },
            { value: '3:2', label: '3:2' },
            { value: '1:1', label: '1:1' },
            { value: '16:9', label: '16:9' },
            { value: '9:16', label: '9:16' }
          ],
          default: '2:3'
        },
        {
          name: 'resolution',
          label: '视频清晰度',
          type: 'select',
          options: [
            { value: '720p', label: '720P (高清)' },
            { value: '480p', label: '480P (标清)' }
          ],
          default: '720p'
        },
        {
          name: 'duration',
          label: '视频时长(秒)',
          type: 'slider',
          min: 6,
          max: 30,
          step: 1,
          default: '6'
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
      'runninghub/bananaflash': (hasImage) => hasImage
        ? 'https://www.runninghub.cn/openapi/v2/rhart-image-n-g31-flash/image-to-image'
        : 'https://www.runninghub.cn/openapi/v2/rhart-image-n-g31-flash/text-to-image',
      'runninghub/sora2': (hasImage) => hasImage
        ? 'https://www.runninghub.cn/openapi/v2/rhart-video-s/image-to-video'
        : 'https://www.runninghub.cn/openapi/v2/rhart-video-s/text-to-video',
      'runninghub/veo31': {
        't2v': 'https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-pro/text-to-video',
        'se2v': 'https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-fast/start-end-to-video',
        'i2v': 'https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-fast/image-to-video'
      },
      'runninghub/videoX': (hasImage) => hasImage
        ? 'https://www.runninghub.cn/openapi/v2/rhart-video-g/image-to-video'
        : 'https://www.runninghub.cn/openapi/v2/rhart-video-g/text-to-video'
    };
    return apiUrls[modelId];
  }

  // 获取 API URL
  static getApiUrl(hasImage) {
    return 'https://www.runninghub.cn/openapi/v2/rhart-image-n-pro/text-to-image';
  }

  buildRequest(params) {
    const { prompt, imageUrls, firstFrameUrl, lastFrameUrl, resolution, aspectRatio, duration, mode, modelType, ...extra } = params;
    
    let body = { prompt: prompt || '' };

    // 根据模型类型构建不同的请求体
    if (this.modelId === 'runninghub/veo31') {
      // VEO3.1视频生成 - 根据用户选择的mode参数处理
      // mode参数由前端传递：t2v(文生视频)、se2v(首尾帧)、i2v(参考生成/图生视频)
      const videoMode = mode || 't2v';
      
      if (videoMode === 'se2v') {
        // 首尾帧生视频 - 需要2张图片
        if (imageUrls && imageUrls.length >= 2) {
          body.firstFrameUrl = imageUrls[0];
          body.lastFrameUrl = imageUrls[1];
        } else if (imageUrls && imageUrls.length === 1) {
          // 只有1张图时，首帧和尾帧用同一张
          body.firstFrameUrl = imageUrls[0];
          body.lastFrameUrl = imageUrls[0];
        }
      } else if (videoMode === 'i2v') {
        // 图生视频/参考生成 - 支持1-3张图片
        if (imageUrls && imageUrls.length > 0) {
          body.imageUrls = imageUrls.slice(0, 3); // 最多3张
        }
      }
      // 文生视频(t2v)不需要额外图片参数
      
      // 保存mode到body，供getRequestUrl使用
      body.mode = videoMode;
      body.aspectRatio = aspectRatio || '16:9';
      body.duration = duration || '8';
      body.resolution = resolution || '720p';
    } else if (this.modelId === 'runninghub/sora2') {
      // Sora2 (文生视频/图生视频合一) - 使用 S 系列 API
      if (imageUrls && imageUrls.length > 0) {
        // 有参考图，使用图生视频
        body.imageUrl = imageUrls[0];
        body.storyboard = false;
      }
      // 文生视频和图生视频使用相同参数
      body.aspectRatio = aspectRatio || '9:16';
      body.duration = duration || '10';
      body.storyboard = false;
    } else if (this.modelId === 'runninghub/bananaflash') {
      // 香蕉Flash (文生图/图生图合一)
      body.resolution = resolution || '1k';
      if (aspectRatio) body.aspectRatio = aspectRatio;
      if (imageUrls && imageUrls.length > 0) body.imageUrls = imageUrls;
    } else if (this.modelId === 'runninghub/sora2x') {
      // 全能视频X (文生视频)
      body.aspectRatio = aspectRatio || '2:3';
      body.resolution = resolution || '720P';
      body.duration = duration || '6s';
    } else if (this.modelId === 'runninghub/sora2s') {
      // 全能视频S (图生视频)
      if (imageUrls && imageUrls.length > 0) body.imageUrl = imageUrls[0];
      body.duration = duration || '10';
      body.aspectRatio = aspectRatio || '9:16';
      body.storyboard = false;
    } else if (this.modelId === 'runninghub/videoX') {
      // 全能视频X (低价渠道版，有图用图生，无图用文生)
      // 图生视频只支持1张图片
      if (imageUrls && imageUrls.length > 0) {
        body.imageUrls = [imageUrls[0]]; // 只取第一张
      }
      body.aspectRatio = aspectRatio || '2:3';
      body.resolution = resolution || '720p';
      body.duration = parseInt(duration) || 6; // 确保是数字类型
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
    } else if (modelId === 'runninghub/bananaflash') {
      return requestBody.imageUrls && requestBody.imageUrls.length > 0
        ? 'https://www.runninghub.cn/openapi/v2/rhart-image-n-g31-flash/image-to-image'
        : 'https://www.runninghub.cn/openapi/v2/rhart-image-n-g31-flash/text-to-image';
    } else if (modelId === 'runninghub/sora2' || modelId === 'runninghub/sora2x') {
      return requestBody.imageUrl
        ? 'https://www.runninghub.cn/openapi/v2/rhart-video-s/image-to-video'
        : 'https://www.runninghub.cn/openapi/v2/rhart-video-s/text-to-video';
    } else if (modelId === 'runninghub/videoX') {
      return requestBody.imageUrls && requestBody.imageUrls.length > 0
        ? 'https://www.runninghub.cn/openapi/v2/rhart-video-g/image-to-video'
        : 'https://www.runninghub.cn/openapi/v2/rhart-video-g/text-to-video';
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
