/**
 * 运营商基类
 */
class BaseProvider {
  constructor(config) {
    this.config = config; // { name, provider, apiKey }
  }

  /**
   * 构建请求体
   */
  buildRequest(params) {
    throw new Error('buildRequest must be implemented');
  }

  /**
   * 解析响应
   */
  parseResponse(response) {
    throw new Error('parseResponse must be implemented');
  }

  /**
   * 构建轮询请求
   */
  buildPollRequest(taskId) {
    return null;
  }

  /**
   * 解析轮询响应
   */
  parsePollResponse(response) {
    return null;
  }

  /**
   * 获取认证头
   */
  getAuthHeaders() {
    const { decrypt } = require('../utils/encryption');
    const headers = {};
    
    if (this.config.apiKey) {
      const key = decrypt(this.config.apiKey) || this.config.apiKey;
      headers['Authorization'] = `Bearer ${key}`;
    }
    
    return headers;
  }
}

module.exports = BaseProvider;
