const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/dbConnect');

const CouponUsage = sequelize.define('couponusage', {
    usedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    }
});

module.exports = CouponUsage ;

