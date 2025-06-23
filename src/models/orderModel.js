const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/dbConnect');

const Order = sequelize.define('order', {
    userId: {
        type: DataTypes.INTEGER
    },
    firstName: {
        type: DataTypes.STRING,
        allowNull: false,
    },lastName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    productId: {
        type: DataTypes.INTEGER,
    },
    productQuantity: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    },
    itemTotalPrice: {
        type: DataTypes.DECIMAL,
        allowNull: false
    },
    orderNumber: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    totalAmount: {
        type: DataTypes.DECIMAL,
        allowNull: false
    },
    status: {
    type: DataTypes.ENUM('delivered', 'pending', 'cancelled'),
    defaultValue: 'pending'
    },
    deliveryAddress: {
        type: DataTypes.TEXT
    },
    deliveryFee: {
        type: DataTypes.TEXT
    },
    phone: {
        type: DataTypes.STRING
    },
    discount: {
        type: DataTypes.DECIMAL,
        allowNull: true
    }
});

module.exports = Order;