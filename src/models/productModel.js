const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/dbConnect');

const Product = sequelize.define('product', {
    id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4, // Sequelize will auto-generate UUIDs
    primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.STRING,
        allowNull: false
    },
    image: {
        type: DataTypes.STRING,
        allowNull: true
    },
    weight: {
        type: DataTypes.DECIMAL,
        allowNull: false
    },
    price: {
        type: DataTypes.DECIMAL
    },
    productDiscount: {
        type: DataTypes.DECIMAL,
        defaultValue: 0
    },
    discountPrice: {
        type: DataTypes.DECIMAL
    },
    isInStock: {
        type: DataTypes.BOOLEAN
    },
    stockQuantity: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    categoryId: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, {
    hooks: {
        beforeCreate: (product) => {
            if (product.price != null) {
                const discount = product.productDiscount || 0;
                product.discountPrice = product.price - (product.price * discount / 100);
            }
        },
        beforeUpdate: (product) => {
            if (product.price != null) {
                const discount = product.productDiscount || 0;
                product.discountPrice = product.price - (product.price * discount / 100);
            }
        },
        beforeBulkCreate: (products) => {
            products.forEach(product => {
                if (product.price != null) {
                    const discount = product.productDiscount || 0;
                    product.discountPrice = product.price - (product.price * discount / 100);
                }
            });
        },
        beforeBulkUpdate: (options) => {
            if (options.attributes) {
                const price = options.attributes.price;
                const discount = options.attributes.productDiscount ?? 0;
                if (price != null) {
                    options.attributes.discountPrice = price - (price * discount / 100);
                }
            }
        }
    }
});


module.exports = Product;
