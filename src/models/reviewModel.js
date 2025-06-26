const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/dbConnect');

const Review = sequelize.define('review', {
    productId: {
        type: DataTypes.UUID
    },
    userId: {
        type: DataTypes.UUID
    },
    rating: {
        type: DataTypes.DECIMAL(2,1),
        validate: {
            min: 1,
            max: 5
        }
    },
    comment: {
        type: DataTypes.TEXT
    }
});

module.exports = Review;