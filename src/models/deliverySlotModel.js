const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/dbConnect");


const DeliverySlot = sequelize.define('DeliverySlot', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  label: {
    type: DataTypes.STRING,
    allowNull: false,
    allowNull: false
  },
  cutoffTime: {
    type: DataTypes.TIME,
    allowNull: false
  },
  windowLabel: {
    type: DataTypes.STRING,
    allowNull: false
  },
  offsetDays: {
    type: DataTypes.INTEGER, // 0 = today, 1 = tomorrow
    defaultValue: 0
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  sortOrder: {
    type: DataTypes.INTEGER,
    allowNull: false
  }  
});

module.exports = DeliverySlot;