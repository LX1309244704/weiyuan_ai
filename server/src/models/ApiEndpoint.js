const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const ApiEndpoint = sequelize.define('ApiEndpoint', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    category: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    targetUrl: {
      type: DataTypes.STRING(500),
      allowNull: false,
      comment: '目标API地址'
    },
    method: {
      type: DataTypes.ENUM('GET', 'POST', 'PUT', 'DELETE', 'PATCH'),
      defaultValue: 'POST'
    },
    pathPrefix: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '暴露路径前缀，如 v1/chat'
    },
    authType: {
      type: DataTypes.ENUM('none', 'api_key', 'bearer', 'basic'),
      defaultValue: 'bearer',
      comment: '认证类型'
    },
    authValue: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '加密存储的认证值'
    },
    headersMapping: {
      type: DataTypes.JSON,
      defaultValue: {},
      comment: '请求头映射配置'
    },
    requestExample: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '请求参数示例'
    },
    responseExample: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '响应格式示例'
    },
    pricePerCall: {
      type: DataTypes.INTEGER,
      defaultValue: 100,
      comment: '每次调用价格(分)'
    },
    rateLimit: {
      type: DataTypes.INTEGER,
      defaultValue: 60,
      comment: '每分钟请求数限制'
    },
    timeout: {
      type: DataTypes.INTEGER,
      defaultValue: 30000,
      comment: '请求超时时间'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    usageCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    type: {
      type: DataTypes.ENUM('api', 'image', 'video'),
      defaultValue: 'api',
      comment: '端点类型: api=普通API, image=图片生成, video=视频生成'
    },
    icon: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '图标(如: 🖼️, 🎬)'
    },
    defaultParams: {
      type: DataTypes.JSON,
      defaultValue: {},
      comment: '生成工具默认参数'
    },
    outputFields: {
      type: DataTypes.JSON,
      defaultValue: {},
      comment: '输出字段映射: 用于提取生成结果'
    },
    isGenerateTool: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否为AI生成工具'
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true
    }
  }, {
    tableName: 'api_endpoints',
    timestamps: true,
    underscored: true
  });

  return ApiEndpoint;
};