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
const { OrderItem, DeliverySlot, Notification, SupportForm } = require('./models');

// ===================
// User Associations
// ===================
const fk = (key, extra = {}) => ({ foreignKey: key, constraints: false, ...extra });

User.hasOne(Cart, fk('userId'));
Cart.belongsTo(User, fk('userId'));

User.hasMany(Order, fk('userId'));
Order.belongsTo(User, fk('userId'));

User.hasMany(Review, fk('userId'));
Review.belongsTo(User, fk('userId'));

User.hasMany(Coupon, fk('userId'));
Coupon.belongsTo(User, fk('userId'));

// ===================
// Product Associations
// ===================
Product.belongsTo(Category, fk('categoryId'));
Category.hasMany(Product, fk('categoryId'));

Product.hasMany(Review, fk('productId'));
Review.belongsTo(Product, fk('productId'));

Product.hasMany(Cart, fk('productId', { as: 'cart' }));
Cart.belongsTo(Product, fk('productId', { as: 'product' }));

Product.hasMany(Order, fk('productId'));
Order.belongsTo(Product, fk('productId'));

// ===================
// Order-Coupon Associations
// ===================
Order.hasMany(Coupon, fk('orderId'));
Coupon.belongsTo(Order, fk('orderId'));

// ===================
// CouponUsage Associations
// ===================
Coupon.hasMany(CouponUsage, fk('couponId'));
CouponUsage.belongsTo(Coupon, fk('couponId'));

User.hasMany(CouponUsage, fk('userId'));
CouponUsage.belongsTo(User, fk('userId'));

// Order - OrderItem
Order.hasMany(OrderItem, fk('orderId'));
OrderItem.belongsTo(Order, fk('orderId'));

// Product - OrderItem
Product.hasMany(OrderItem, fk('productId'));
OrderItem.belongsTo(Product, fk('productId'));

// Order - DeliverySlot
Order.belongsTo(DeliverySlot, fk('deliverySlotId', { as: 'deliverySlot' }));
DeliverySlot.hasMany(Order, fk('deliverySlotId', { as: 'orders' }));

// ===================
// Notification Associations
// ===================
User.hasMany(Notification, fk('userId', { as: 'notifications' }));
Notification.belongsTo(User, fk('userId', { as: 'user' }));

// ===================
// SupportForm Associations
// ===================
User.hasMany(SupportForm, fk('userId', { as: 'supportTickets' }));
SupportForm.belongsTo(User, fk('userId', { as: 'user' }));