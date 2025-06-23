const express = require('express');
const { addProduct, getAllProducts, getSingleProduct, updateProduct, deleteProduct, bestSelling, addProducts } = require('../controllers/productController');
const { isAdmin } = require('../middlewares/isAdminMiddleware');
const upload = require('../middlewares/upload');
const productRouter = express.Router();

productRouter.post('/products',isAdmin,upload.single('image'),addProduct);
productRouter.post('/bulk-products',isAdmin,addProducts);
productRouter.get('/products',getAllProducts);
productRouter.get('/best-selling',bestSelling);
productRouter.get('/products/:id',getSingleProduct);
productRouter.put('/products/:id',isAdmin,upload.single('image'),updateProduct);
productRouter.delete('/products/:id',isAdmin,deleteProduct);

module.exports = { productRouter };