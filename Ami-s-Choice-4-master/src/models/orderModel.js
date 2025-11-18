const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/dbConnect');

const Order = sequelize.define('order', {
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  orderNumber: {
  type: DataTypes.UUID,
  allowNull: false,
},
  subTotal: {
    type: DataTypes.DECIMAL,
    allowNull: false,
  },
  discount: {
    type: DataTypes.DECIMAL,
    allowNull: true,
  },
  deliveryFee: {
    type: DataTypes.DECIMAL,
    allowNull: true,
  },
  totalAmount: {
    type: DataTypes.DECIMAL,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('delivered', 'pending', 'cancelled'),
    defaultValue: 'pending',
  },
  deliveryAddress: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
  }
});

module.exports = Order;
