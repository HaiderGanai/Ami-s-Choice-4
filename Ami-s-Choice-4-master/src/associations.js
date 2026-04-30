const { Sequelize, DataTypes } = require('sequelize');
// const { User, Category, Cart, Product, Order, Review, Coupon, CouponUsage } = require('../Source_Code/models');
// models/index.js
const User = require('./models/userModel');
const Category = require('./models/categoriesModel');
const Cart = require('./models/cartModel');
const Product = require('./models/productModel');
// const CartProduct = require('./models/cartProductModel');
const Order = require('./models/orderModel');
// const OrderProduct = require('./models/orderProdutModel');
const Review = require('./models/reviewModel');
const Coupon = require('./models/couponModel');
const CouponUsage = require('./models/couponUsageModel');
const { OrderItem } = require('./models');

console.log('Hello from the associations')
// ===================
// User Associations
// ===================
User.hasOne(Cart, { foreignKey: 'userId' });
Cart.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Order, { foreignKey: 'userId' });
Order.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Review, { foreignKey: 'userId' });
Review.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Coupon, { foreignKey: 'userId' });
Coupon.belongsTo(User, { foreignKey: 'userId' });

// ===================
// Product Associations
// ===================
Product.belongsTo(Category, { foreignKey: 'categoryId' });
Category.hasMany(Product, { foreignKey: 'categoryId' });

Product.hasMany(Review, { foreignKey: 'productId' });
Review.belongsTo(Product, { foreignKey: 'productId' });

Product.hasMany(Cart, { foreignKey: 'productId', as: 'cart'});
Cart.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

Product.hasMany(Order, { foreignKey: 'productId' });
Order.belongsTo(Product, { foreignKey: 'productId' });

// ===================
// Order-Coupon Associations
// ===================
Order.hasMany(Coupon, { foreignKey: 'orderId' });
Coupon.belongsTo(Order, { foreignKey: 'orderId' });

// ===================
// Order-Coupon Associations
// ===================
Coupon.hasMany(CouponUsage, { foreignKey: 'couponId' });
CouponUsage.belongsTo(Coupon, { foreignKey: 'couponId' });

// ===================
// User-CouponUsage Associations
// ===================
User.hasMany(CouponUsage, { foreignKey: 'userId' });
CouponUsage.belongsTo(User, { foreignKey: 'userId' });
    

// console.log(Cart.associations)
// console.log("cart association::",Cart.associations);
// console.log("product association::",Product.associations);

// Order - OrderItem
Order.hasMany(OrderItem, { foreignKey: 'orderId' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId' });

// Product - OrderItem
Product.hasMany(OrderItem, { foreignKey: 'productId' });
OrderItem.belongsTo(Product, { foreignKey: 'productId' });
