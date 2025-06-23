const express = require('express');
const { addToCart, updateCart, removeCartProduct, deleteCart, getCart, cartPreview } = require('../controllers/cartControllers');
const { verifyToken } = require('../middlewares/jwtMiddleware');
const cartRouter = express.Router();


cartRouter.get('/cart',verifyToken,getCart);
cartRouter.post('/cart',verifyToken,addToCart);
cartRouter.post('/cart/preview',verifyToken,cartPreview);
cartRouter.patch('/cart/:productId',verifyToken,updateCart);
cartRouter.delete('/cart/:productId',verifyToken,removeCartProduct);
cartRouter.delete('/cart',verifyToken,deleteCart);

module.exports = { cartRouter };