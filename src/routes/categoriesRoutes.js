const express = require('express');
const { createCategory, getAllCategories, updateCategories, deleteCategories } = require('../controllers/categoryController');
const { verifyToken } = require('../middlewares/jwtMiddleware');
const { isAdmin } = require('../middlewares/isAdminMiddleware');
const categoryRouter = express.Router();

categoryRouter.post('/categories',isAdmin, createCategory);
categoryRouter.get('/categories',getAllCategories);
categoryRouter.put('/categories/:id',isAdmin,updateCategories);
categoryRouter.delete('/categories/:id',isAdmin,deleteCategories);

module.exports = { categoryRouter };