const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const BalanceLog = sequelize.define('BalanceLog', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    change: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    reason: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    balanceAfter: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    relatedId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'Related order ID or invocation ID'
    },
    type: {
      type: DataTypes.ENUM('purchase', 'consume', 'refund', 'adjustment'),
      allowNull: false
    }
  }, {
    tableName: 'balance_logs',
    timestamps: true,
    underscored: true
  });

  return BalanceLog;
};
