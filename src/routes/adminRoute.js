const express = require('express');
const adminRouter = express.Router();
const { isAdmin } = require('../middlewares/isAdminMiddleware');
const upload = require('../middlewares/upload');

const {
  login,
  getAllUsers,
  getStats,
  adminGetAllProducts,
  adminCreateProduct,
  adminBulkCreateProducts,
  adminUpdateProduct,
  adminUpdateProductStatus,
  adminDeleteProduct,
  adminGetAllCategories,
  adminCreateCategory,
  adminUpdateCategory,
  adminUpdateCategoryStatus,
  adminGetAllOrders,
  adminGetOrderDetail,
  adminUpdateOrderStatus,
  adminListCoupons,
  adminCreateCoupon,
  adminUpdateCoupon,
  adminDeleteCoupon,
  adminGetAllReviews,
  adminDeleteReview,
  adminGetSupportForms,
} = require('../controllers/adminController');

// Auth
adminRouter.post('/login', login);

// Dashboard
adminRouter.get('/stats', isAdmin, getStats);

// Users
adminRouter.get('/users', isAdmin, getAllUsers);

// Products
adminRouter.get('/products', isAdmin, adminGetAllProducts);
adminRouter.post('/products', isAdmin, upload.single('image'), adminCreateProduct);
adminRouter.post('/bulk-products', isAdmin, adminBulkCreateProducts);
adminRouter.put('/products/:id', isAdmin, upload.single('image'), adminUpdateProduct);
adminRouter.patch('/products/:id/status', isAdmin, adminUpdateProductStatus);
adminRouter.delete('/products/:id', isAdmin, adminDeleteProduct);

// Categories
adminRouter.get('/categories', isAdmin, adminGetAllCategories);
adminRouter.post('/categories', isAdmin, adminCreateCategory);
adminRouter.put('/categories/:id', isAdmin, adminUpdateCategory);
adminRouter.patch('/categories/:id/status', isAdmin, adminUpdateCategoryStatus);

// Orders
adminRouter.get('/orders', isAdmin, adminGetAllOrders);
adminRouter.get('/orders/:orderNumber', isAdmin, adminGetOrderDetail);
adminRouter.patch('/orders/:orderNumber/status', isAdmin, adminUpdateOrderStatus);

// Coupons
adminRouter.get('/coupons', isAdmin, adminListCoupons);
adminRouter.post('/coupons', isAdmin, adminCreateCoupon);
adminRouter.patch('/coupons/:code', isAdmin, adminUpdateCoupon);
adminRouter.delete('/coupons/:code', isAdmin, adminDeleteCoupon);

// Reviews
adminRouter.get('/reviews', isAdmin, adminGetAllReviews);
adminRouter.delete('/reviews/:id', isAdmin, adminDeleteReview);

// Support Forms
adminRouter.get('/support-forms', isAdmin, adminGetSupportForms);

module.exports = { adminRouter };
