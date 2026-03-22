/**
 * 运营商处理器管理器
 */
const fs = require('fs');
const path = require('path');

class ProviderManager {
  constructor() {
    this.providers = new Map(); // provider -> ProviderClass
  }

  /**
   * 加载所有运营商处理器
   */
  loadAll() {
    const providersDir = __dirname;
    const files = fs.readdirSync(providersDir);
    
    for (const file of files) {
      if (file.endsWith('.js') && file !== 'index.js' && file !== 'base.js') {
        try {
          const ProviderClass = require(path.join(providersDir, file));
          if (ProviderClass && ProviderClass.provider) {
            this.providers.set(ProviderClass.provider, ProviderClass);
            console.log(`[Provider] Loaded: ${ProviderClass.provider}`);
          }
        } catch (err) {
          console.error(`[Provider] Failed to load ${file}:`, err.message);
        }
      }
    }
    
    console.log(`[Provider] Total loaded: ${this.providers.size} providers`);
  }

  /**
   * 获取运营商处理器实例
   * @param {string} provider - 运营商名称
   * @param {Object} model - AI模型配置
   * @returns {BaseProvider|null}
   */
  get(provider, model) {
    const ProviderClass = this.providers.get(provider);
    if (!ProviderClass) {
      return null;
    }
    return new ProviderClass(model);
  }

  /**
   * 检查运营商是否支持
   */
  has(provider) {
    return this.providers.has(provider);
  }

  /**
   * 获取所有已加载的运营商
   */
  list() {
    return Array.from(this.providers.keys());
  }
}

// 单例
const manager = new ProviderManager();

module.exports = manager;
