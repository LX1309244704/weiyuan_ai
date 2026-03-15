const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const ApiInvocation = sequelize.define('ApiInvocation', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    invocationId: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      comment: '幂等ID'
    },
    endpointId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    cost: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '扣费金额(分)'
    },
    status: {
      type: DataTypes.ENUM('success', 'failed', 'timeout'),
      defaultValue: 'success'
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    latency: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '响应时间'
    },
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true
    },
    requestPath: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '请求路径'
    },
    responseCode: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '目标API响应状态码'
    },
    requestBody: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '请求体'
    },
    responseBody: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '响应体'
    }
  }, {
    tableName: 'api_invocations',
    timestamps: true,
    underscored: true
  });

  return ApiInvocation;
};