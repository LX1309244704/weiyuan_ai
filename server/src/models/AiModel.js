const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const AiModel = sequelize.define('AiModel', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '显示名称'
    },
    provider: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: '厂商标识: runninghub, huoshan'
    },
    apiKey: {
      type: DataTypes.TEXT,
      field: 'api_key',
      comment: 'API密钥(加密存储)'
    },
    modelPrices: {
      type: DataTypes.JSON,
      field: 'model_prices',
      comment: '模型积分配置 {"模型ID": 积分价格}'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active',
      comment: '是否启用'
    }
  }, {
    tableName: 'ai_models',
    timestamps: true,
    underscored: true
  });

  return AiModel;
};
