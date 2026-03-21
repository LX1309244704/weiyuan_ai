const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const Coupon = sequelize.define('Coupon', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    code: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      comment: '兑换码'
    },
    amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '兑换积分数量'
    },
    type: {
      type: DataTypes.ENUM('gift', 'purchase', 'activity'),
      defaultValue: 'gift',
      comment: '兑换码类型'
    },
    maxUses: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      comment: '最大使用次数'
    },
    usedCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '已使用次数'
    },
    expiresAt: {
      type: DataTypes.DATE,
      comment: '过期时间'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: '是否激活'
    },
    createdBy: {
      type: DataTypes.UUID,
      comment: '创建者ID'
    }
  }, {
    tableName: 'coupons',
    timestamps: true,
    underscored: true
  });

  return Coupon;
};