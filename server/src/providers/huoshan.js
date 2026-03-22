/**
 * 火山引擎运营商处理器
 */
const BaseProvider = require('./base');

class HuoshanProvider extends BaseProvider {
  static provider = 'huoshan';
  static name = '火山引擎';

  // API 地址
  static getApiUrl(modelType) {
    return 'https://ark.cn-beijing.volces.com/api/v3/images/generations';
  }

  // 可用模型列表
  static models = [
    { 
      id: 'huoshan/t2i', 
      name: 'Seedream 文生图', 
      description: '高质量中文文字生成图片',
      type: 'image',
      icon: '🔥',
      modelType: 't2i',
      pricePerCall: 50,
      defaultParams: { model: 'doubao-seedream-5.0-lite' },
      // 参数配置
      paramConfig: [
        {
          name: 'model',
          label: '模型版本',
          type: 'select',
          options: [
            { value: 'doubao-seedream-5.0-lite', label: 'Seedream 5.0 Lite (快速)' },
            { value: 'doubao-seedream-5.0', label: 'Seedream 5.0 (标准)' }
          ],
          default: 'doubao-seedream-5.0-lite'
        },
        {
          name: 'size',
          label: '图片尺寸',
          type: 'select',
          options: [
            { value: '1024x1024', label: '1024×1024 (正方形)' },
            { value: '1024x768', label: '1024×768 (横版)' },
            { value: '768x1024', label: '768×1024 (竖版)' },
            { value: '1280x720', label: '1280×720 (16:9)' },
            { value: '720x1280', label: '720×1280 (9:16)' }
          ],
          default: '1024x1024'
        }
      ]
    },
    { 
      id: 'huoshan/i2i', 
      name: 'SeedEdit 图生图', 
      description: '参考图生成图片（需要上传参考图）',
      type: 'image',
      icon: '✨',
      modelType: 'i2i',
      pricePerCall: 50,
      defaultParams: { model: 'doubao-seededit-3.0-i2i' },
      paramConfig: [
        {
          name: 'model',
          label: '模型版本',
          type: 'select',
          options: [
            { value: 'doubao-seededit-3.0-i2i', label: 'SeedEdit 3.0' }
          ],
          default: 'doubao-seededit-3.0-i2i'
        },
        {
          name: 'strength',
          label: '参考强度',
          type: 'slider',
          min: 0,
          max: 1,
          step: 0.1,
          default: 0.7,
          description: '控制参考图对生成结果的影响程度'
        }
      ]
    }
  ];

  // 认证头
  getAuthHeaders() {
    const { decrypt } = require('../utils/encryption');
    if (this.config.apiKey) {
      const key = decrypt(this.config.apiKey) || this.config.apiKey;
      return { 'Authorization': key };
    }
    return {};
  }

  buildRequest(params) {
    const { prompt, imageUrls, model, modelType, size, strength, ...extra } = params;
    
    // 根据 modelType 选择模型
    const defaultModel = modelType === 'i2i' ? 'doubao-seededit-3.0-i2i' : 'doubao-seedream-5.0-lite';
    
    const body = {
      model: model || defaultModel,
      prompt: prompt || '',
      response_format: 'url',
      watermark: true
    };

    if (size) body.size = size;
    if (imageUrls && imageUrls.length > 0) {
      body.image = imageUrls.length === 1 ? imageUrls[0] : imageUrls;
    }
    if (strength !== undefined) {
      body.strength = parseFloat(strength);
    }

    return { ...body, ...extra };
  }

  parseResponse(response) {
    const data = response.data;
    
    if (data.error) {
      return { success: false, error: data.error.message || 'Unknown error', status: 'failed' };
    }

    const imageData = data.data;
    if (imageData && Array.isArray(imageData)) {
      const resultUrls = [];
      for (const img of imageData) {
        if (img.url) resultUrls.push(img.url);
        else if (img.b64_json) resultUrls.push(`data:image/jpeg;base64,${img.b64_json}`);
      }
      return { success: true, status: 'completed', resultUrls };
    }

    return { success: false, error: 'No image data in response', status: 'failed' };
  }

  // 同步接口，不需要轮询
  buildPollRequest(taskId) {
    return null;
  }
}

module.exports = HuoshanProvider;
