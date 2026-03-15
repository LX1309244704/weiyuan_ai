const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const Skill = sequelize.define('Skill', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    icon: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    category: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    pricePerCall: {
      type: DataTypes.INTEGER,
      defaultValue: 100,
      validate: {
        min: 0
      }
    },
    packageSizes: {
      type: DataTypes.JSON,
      defaultValue: [
        { size: 100, price: 5000 },
        { size: 500, price: 20000 },
        { size: 1000, price: 35000 }
      ]
    },
    fileUrl: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    packageUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'OSS or local storage URL for skill package (.zip)'
    },
    version: {
      type: DataTypes.STRING(20),
      defaultValue: '1.0.0'
    },
    author: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    readme: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Markdown format installation guide'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    downloadCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    usageCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    tableName: 'skills',
    timestamps: true,
    underscored: true
  });

  return Skill;
};
