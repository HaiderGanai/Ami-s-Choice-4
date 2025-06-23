const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/dbConnect');

const Cart = sequelize.define('cart', {
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    productId: {
        type: DataTypes.INTEGER,
    },productQuantity: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    },
    itemTotalPrice: {
        type: DataTypes.DECIMAL,
        allowNull: false
    },
    subTotal: {
        type: DataTypes.DECIMAL,
        allowNull: false
    },
    discount: {
        type: DataTypes.DECIMAL,
        allowNull: true,
        defaultValue: 0
    }
});

module.exports = Cart;