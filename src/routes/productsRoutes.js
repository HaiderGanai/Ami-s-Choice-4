const express = require('express');
const { getAllProducts, getSingleProduct, bestSelling } = require('../controllers/productController');
const productRouter = express.Router();

productRouter.get('/products', getAllProducts);
productRouter.get('/best-selling', bestSelling);
productRouter.get('/products/:id', getSingleProduct);

module.exports = { productRouter };
