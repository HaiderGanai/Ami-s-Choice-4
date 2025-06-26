const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/dbConnect');

const OrderItem = sequelize.define('orderItem', {
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  productId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  productQuantity: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
  },
  itemTotalPrice: {
    type: DataTypes.DECIMAL,
    allowNull: false,
  },
  discount: {
    type: DataTypes.DECIMAL,
    allowNull: true,
  },
});

module.exports = OrderItem;
