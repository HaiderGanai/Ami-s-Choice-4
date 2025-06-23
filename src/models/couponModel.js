const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/dbConnect');

const Coupon = sequelize.define('coupon', {
    
    code: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
    },
    discountAmount: {
        type: DataTypes.DECIMAL,
        allowNull: false
    },
    expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
});

module.exports = Coupon;