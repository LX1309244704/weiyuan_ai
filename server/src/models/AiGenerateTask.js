const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const AiGenerateTask = sequelize.define('AiGenerateTask', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: '用户ID'
    },
    endpointId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'API端点ID'
    },
    taskId: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: '第三方任务ID'
    },
    apiKey: {
      type: DataTypes.STRING(64),
      comment: '用户的apiKey，用于查询任务'
    },
    model: {
      type: DataTypes.STRING(100),
      comment: '模型名称'
    },
    prompt: {
      type: DataTypes.TEXT,
      comment: '用户提示词'
    },
    status: {
      type: DataTypes.ENUM('queued', 'processing', 'completed', 'failed'),
      defaultValue: 'queued',
      comment: '任务状态'
    },
    progress: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '进度 0-100'
    },
    resultUrl: {
      type: DataTypes.TEXT,
      comment: '生成结果URL'
    },
    resultData: {
      type: DataTypes.JSON,
      comment: '完整返回数据'
    },
    errorMessage: {
      type: DataTypes.TEXT,
      comment: '错误信息'
    },
    cost: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '消耗积分'
    },
    refundAmount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '返还积分'
    },
    balanceChangeType: {
      type: DataTypes.ENUM('consume', 'refund'),
      defaultValue: 'consume',
      comment: '积分变更类型'
    },
    balanceChangeAt: {
      type: DataTypes.DATE,
      comment: '积分变更时间'
    }
  }, {
    tableName: 'ai_generate_tasks',
    timestamps: true,
    underscored: true
  });

  return AiGenerateTask;
};