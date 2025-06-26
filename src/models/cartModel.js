const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/dbConnect');

const Cart = sequelize.define('cart', {
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    productId: {
        type: DataTypes.UUID,
    },
    productQuantity: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    },

});

module.exports = Cart;