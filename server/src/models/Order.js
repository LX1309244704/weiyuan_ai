const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define('Order', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    orderNo: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    skillId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'skills',
        key: 'id'
      }
    },
    endpointId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: '关联的API端点ID'
    },
    amount: {
      type: DataTypes.INTEGER, // in cents
      allowNull: false
    },
    packageSize: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    paymentMethod: {
      type: DataTypes.ENUM('wechat', 'alipay'),
      allowNull: false
    },
    transactionId: {
      type: DataTypes.STRING(128),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('pending', 'paid', 'refunded', 'cancelled'),
      defaultValue: 'pending'
    },
    paidAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'orders',
    timestamps: true,
    underscored: true
  });

  return Order;
};
