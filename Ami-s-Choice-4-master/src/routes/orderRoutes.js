const express = require('express');
const { checkOut, orderHistory, specificOrder, changeOrderStatus, cancelOrder } = require('../controllers/orderControllers');
const { verifyToken } = require('../middlewares/jwtMiddleware');
const { isAdmin } = require('../middlewares/isAdminMiddleware');
const orderRouter = express.Router();

orderRouter.post('/orders',verifyToken,checkOut);
orderRouter.get('/orders',verifyToken,orderHistory);
orderRouter.get('/orders/:orderNumber',verifyToken,specificOrder);
orderRouter.patch('/orders/status/:orderNumber',isAdmin,changeOrderStatus);
orderRouter.patch('/orders/cancel/:orderNumber',verifyToken,cancelOrder);

module.exports = { orderRouter };