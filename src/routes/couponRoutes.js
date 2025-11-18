const express = require('express');
const { isAdmin } = require('../middlewares/isAdminMiddleware');
const { createCoupon, listCoupon, updateCoupon } = require('../controllers/couponController');
const couponRouter = express.Router();

couponRouter.post('/coupons'/*,isAdmin*/, createCoupon);
couponRouter.get('/coupons',isAdmin, listCoupon);
couponRouter.patch('/coupons/:code',isAdmin, updateCoupon);

module.exports = { couponRouter };