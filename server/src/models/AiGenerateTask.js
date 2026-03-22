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
      field: 'user_id',
      comment: '用户ID'
    },
    provider: {
      type: DataTypes.STRING(50),
      comment: '厂商标识: runninghub, huoshan'
    },
    taskId: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'task_id',
      comment: '第三方任务ID'
    },
    modelName: {
      type: DataTypes.STRING(100),
      field: 'model_name',
      comment: '模型名称'
    },
    prompt: {
      type: DataTypes.TEXT,
      comment: '用户提示词'
    },
    imageUrls: {
      type: DataTypes.JSON,
      field: 'image_urls',
      comment: '输入图片URL列表'
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
      field: 'result_url',
      comment: '生成结果URL'
    },
    resultData: {
      type: DataTypes.JSON,
      field: 'result_data',
      comment: '完整返回数据'
    },
    errorMessage: {
      type: DataTypes.TEXT,
      field: 'error_message',
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
      field: 'refund_amount',
      comment: '返还积分'
    },
    balanceChangeType: {
      type: DataTypes.ENUM('consume', 'refund'),
      defaultValue: 'consume',
      field: 'balance_change_type',
      comment: '积分变更类型'
    },
    balanceChangeAt: {
      type: DataTypes.DATE,
      field: 'balance_change_at',
      comment: '积分变更时间'
    },
    pollAttempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'poll_attempts',
      comment: '轮询尝试次数'
    },
    deletedAt: {
      type: DataTypes.DATE,
      field: 'deleted_at',
      comment: '软删除时间'
    }
  }, {
    tableName: 'ai_generate_tasks',
    timestamps: true,
    underscored: true
  });

  return AiGenerateTask;
};
