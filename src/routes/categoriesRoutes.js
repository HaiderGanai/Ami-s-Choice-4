const express = require('express');
const { getAllCategories, deleteCategories } = require('../controllers/categoryController');
const categoryRouter = express.Router();

categoryRouter.get('/categories', getAllCategories);
categoryRouter.delete('/categories/:id', deleteCategories);

module.exports = { categoryRouter };
