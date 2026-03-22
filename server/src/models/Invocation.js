const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const Invocation = sequelize.define('Invocation', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    invocationId: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
      field: 'invocation_id'
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    model: {
      type: DataTypes.STRING(100),
      comment: '模型名称'
    },
    prompt: {
      type: DataTypes.TEXT,
      comment: '输入提示词'
    },
    response: {
      type: DataTypes.TEXT,
      comment: '模型响应'
    },
    tokensUsed: {
      type: DataTypes.INTEGER,
      field: 'tokens_used',
      comment: '消耗的Token数量'
    },
    cost: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '消耗金额(分)'
    },
    duration: {
      type: DataTypes.INTEGER,
      comment: '响应耗时(毫秒)'
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'success',
      comment: '调用状态'
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'error_message'
    }
  }, {
    tableName: 'invocations',
    timestamps: true,
    underscored: true
  });

  return Invocation;
};
