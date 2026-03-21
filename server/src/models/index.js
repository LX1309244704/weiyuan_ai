const { Sequelize } = require('sequelize');
const path = require('path');

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
const Skill = require('./Skill')(sequelize, Sequelize.DataTypes);
const Order = require('./Order')(sequelize, Sequelize.DataTypes);
const Invocation = require('./Invocation')(sequelize, Sequelize.DataTypes);
const BalanceLog = require('./BalanceLog')(sequelize, Sequelize.DataTypes);
const ApiEndpoint = require('./ApiEndpoint')(sequelize, Sequelize.DataTypes);
const ApiInvocation = require('./ApiInvocation')(sequelize, Sequelize.DataTypes);
const AiGenerateTask = require('./AiGenerateTask')(sequelize, Sequelize.DataTypes);
const Coupon = require('./Coupon')(sequelize, Sequelize.DataTypes);

// Define associations
// User associations
User.hasMany(Order, { foreignKey: 'userId', as: 'orders' });
User.hasMany(Invocation, { foreignKey: 'userId', as: 'invocations' });
User.hasMany(BalanceLog, { foreignKey: 'userId', as: 'balanceLogs' });
User.hasMany(ApiInvocation, { foreignKey: 'userId', as: 'apiInvocations' });
User.hasMany(AiGenerateTask, { foreignKey: 'userId', as: 'generateTasks' });

Skill.hasMany(Order, { foreignKey: 'skillId', as: 'orders' });
Skill.hasMany(Invocation, { foreignKey: 'skillId', as: 'invocations' });

Order.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Order.belongsTo(Skill, { foreignKey: 'skillId', as: 'skill' });

Invocation.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Invocation.belongsTo(Skill, { foreignKey: 'skillId', as: 'skill' });

BalanceLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

ApiEndpoint.hasMany(ApiInvocation, { foreignKey: 'endpointId', as: 'invocations' });
ApiEndpoint.hasMany(AiGenerateTask, { foreignKey: 'endpointId', as: 'generateTasks' });
ApiInvocation.belongsTo(ApiEndpoint, { foreignKey: 'endpointId', as: 'endpoint' });
ApiInvocation.belongsTo(User, { foreignKey: 'userId', as: 'user' });

AiGenerateTask.belongsTo(User, { foreignKey: 'userId', as: 'user' });
AiGenerateTask.belongsTo(ApiEndpoint, { foreignKey: 'endpointId', as: 'endpoint' });

module.exports = {
  sequelize,
  Sequelize,
  User,
  Skill,
  Order,
  Invocation,
  BalanceLog,
  ApiEndpoint,
  ApiInvocation,
  AiGenerateTask,
  Coupon
};
