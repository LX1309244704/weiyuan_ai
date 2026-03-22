const { Sequelize } = require('sequelize');

// Load config
const env = process.env.NODE_ENV || 'development';
const config = require('../config/database')[env];

// Create sequelize instance
const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    port: config.port,
    dialect: config.dialect,
    logging: config.logging,
    pool: config.pool,
    define: {
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  }
);

// Import models
const User = require('./User')(sequelize, Sequelize.DataTypes);
const Order = require('./Order')(sequelize, Sequelize.DataTypes);
const Invocation = require('./Invocation')(sequelize, Sequelize.DataTypes);
const BalanceLog = require('./BalanceLog')(sequelize, Sequelize.DataTypes);
const ApiEndpoint = require('./ApiEndpoint')(sequelize, Sequelize.DataTypes);
const ApiInvocation = require('./ApiInvocation')(sequelize, Sequelize.DataTypes);
const AiModel = require('./AiModel')(sequelize, Sequelize.DataTypes);
const AiGenerateTask = require('./AiGenerateTask')(sequelize, Sequelize.DataTypes);
const Coupon = require('./Coupon')(sequelize, Sequelize.DataTypes);

// Define associations
User.hasMany(Order, { foreignKey: 'userId', as: 'orders' });
User.hasMany(Invocation, { foreignKey: 'userId', as: 'invocations' });
User.hasMany(BalanceLog, { foreignKey: 'userId', as: 'balanceLogs' });
User.hasMany(ApiInvocation, { foreignKey: 'userId', as: 'apiInvocations' });
User.hasMany(AiGenerateTask, { foreignKey: 'userId', as: 'generateTasks' });

Order.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Order.belongsTo(ApiEndpoint, { foreignKey: 'endpointId', as: 'endpoint' });

Invocation.belongsTo(User, { foreignKey: 'userId', as: 'user' });
BalanceLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

ApiEndpoint.hasMany(ApiInvocation, { foreignKey: 'endpointId', as: 'invocations' });
ApiInvocation.belongsTo(ApiEndpoint, { foreignKey: 'endpointId', as: 'endpoint' });
ApiInvocation.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// AI 模块关联（使用 provider 而不是 modelId）
AiGenerateTask.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = {
  sequelize,
  Sequelize,
  User,
  Order,
  Invocation,
  BalanceLog,
  ApiEndpoint,
  ApiInvocation,
  AiModel,
  AiGenerateTask,
  Coupon
};
