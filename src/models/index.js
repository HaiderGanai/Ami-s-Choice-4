// models/index.js
const User = require('./userModel');
const Category = require('./categoriesModel');
const Cart = require('./cartModel');
const Product = require('./productModel');
// const CartProduct = require('../models/cartProductModel');
const Order = require('./orderModel');
// const OrderProduct = require('../models/orderProdutModel');
const Review = require('./reviewModel');
const Coupon = require('./couponModel');
const CouponUsage = require('./couponUsageModel');


module.exports = {
  User,
  Category,
  Cart,
  Product,

  Order,
  CouponUsage,
  Review,
  Coupon,
};
