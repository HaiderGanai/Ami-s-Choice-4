const { Op } = require('sequelize');
const { sequelize } = require('../config/dbConnect');
const { User, Category, Product, Order, OrderItem, Review, Coupon, Notification, SupportForm, DeliverySlot } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ─────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ status: 'fail', message: 'Please enter all fields!' });
    }
    const user = await User.findOne({ where: { email } });
    if (!user || user.role !== 'admin') {
      return res.status(401).json({ status: 'fail', message: 'Invalid credentials!' });
    }
    const passMatch = await bcrypt.compare(password, user.password);
    if (!passMatch) {
      return res.status(401).json({ status: 'fail', message: 'Invalid credentials!' });
    }
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY }
    );
    return res.status(200).json({
      status: 'success',
      data: { firstName: user.firstName, lastName: user.lastName, token }
    });
  } catch (error) {
    return res.status(500).json({ status: 'fail', message: 'Something went wrong!' });
  }
};

// ─────────────────────────────────────────
// USERS
// ─────────────────────────────────────────

const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const offset = (page - 1) * limit;

    const { count, rows: users } = await User.findAndCountAll({
      attributes: { exclude: ['password', 'passwordResetToken', 'passwordResetExpiry'] },
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json({
      status: 'success',
      data: { users },
      pagination: {
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        perPage: limit
      }
    });
  } catch (error) {
    return res.status(500).json({ status: 'fail', message: 'Something went wrong!' });
  }
};

// ─────────────────────────────────────────
// DASHBOARD STATS
// ─────────────────────────────────────────

const getStats = async (req, res) => {
  try {
    const [totalUsers, totalProducts, totalCategories, totalOrders, pendingOrders, totalRevenue] = await Promise.all([
      User.count(),
      Product.count(),
      Category.count(),
      Order.count(),
      Order.count({ where: { status: 'pending' } }),
      Order.sum('totalAmount', { where: { status: { [Op.ne]: 'cancelled' } } })
    ]);

    return res.status(200).json({
      status: 'success',
      data: {
        totalUsers,
        totalProducts,
        totalCategories,
        totalOrders,
        pendingOrders,
        totalRevenue: parseFloat(totalRevenue || 0).toFixed(2)
      }
    });
  } catch (error) {
    return res.status(500).json({ status: 'fail', message: 'Something went wrong!' });
  }
};

// ─────────────────────────────────────────
// PRODUCTS (ADMIN)
// ─────────────────────────────────────────

const adminGetAllProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const offset = (page - 1) * limit;

    const { count, rows: products } = await Product.findAndCountAll({
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json({
      status: 'success',
      data: { products },
      pagination: {
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        perPage: limit
      }
    });
  } catch (error) {
    return res.status(500).json({ status: 'fail', message: 'Something went wrong!' });
  }
};

const adminCreateProduct = async (req, res) => {
  try {
    const { name, description, weight, price, stockQuantity, categoryId, productDiscount } = req.body;
    if (!name || !description || !weight || !price || !stockQuantity || !categoryId) {
      return res.status(400).json({ status: 'fail', message: 'Please enter all required fields!' });
    }
    const category = await Category.findByPk(categoryId);
    if (!category) {
      return res.status(404).json({ status: 'fail', message: 'This category does not exist!' });
    }
    const imagePath = req.file?.path || null;
    const newProduct = await Product.create({
      name, description, image: imagePath, weight, price,
      productDiscount: productDiscount || 0,
      stockQuantity,
      isInStock: stockQuantity > 0,
      categoryId
    });
    return res.status(201).json({
      status: 'success',
      message: 'Product added successfully!',
      data: { product: newProduct }
    });
  } catch (error) {
    return res.status(500).json({ status: 'fail', message: 'Something went wrong!' });
  }
};

const adminBulkCreateProducts = async (req, res) => {
  try {
    const products = req.body;
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ status: 'fail', message: 'Request body must be a non-empty array of products.' });
    }
    for (const product of products) {
      const { name, description, weight, price, stockQuantity, categoryId } = product;
      if (!name?.trim() || !description?.trim() || isNaN(parseFloat(weight)) || isNaN(parseFloat(price)) || isNaN(parseInt(stockQuantity)) || !categoryId) {
        return res.status(400).json({ status: 'fail', message: 'Each product must have: name, description, weight, price, stockQuantity, categoryId.' });
      }
      const category = await Category.findByPk(categoryId);
      if (!category) {
        return res.status(404).json({ status: 'fail', message: `Category with ID ${categoryId} does not exist.` });
      }
    }
    const sanitized = products.map(p => ({
      name: p.name, description: p.description, image: p.image || null,
      weight: p.weight, price: p.price, productDiscount: p.productDiscount || 0,
      stockQuantity: p.stockQuantity, isInStock: p.stockQuantity > 0, categoryId: p.categoryId
    }));
    const createdProducts = await Product.bulkCreate(sanitized);
    return res.status(201).json({ status: 'success', data: { createdProducts } });
  } catch (error) {
    return res.status(500).json({ status: 'fail', message: 'Something went wrong!' });
  }
};

const adminUpdateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({ status: 'fail', message: 'Product not found!' });
    }

    const { name, description, weight, price, stockQuantity, categoryId, productDiscount } = req.body;
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (weight !== undefined) updateData.weight = weight;
    if (price !== undefined) updateData.price = price;
    if (stockQuantity !== undefined) {
      updateData.stockQuantity = stockQuantity;
      updateData.isInStock = stockQuantity > 0;
    }
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (productDiscount !== undefined) updateData.productDiscount = productDiscount;
    if (req.file?.path) updateData.image = req.file.path;

    await product.update(updateData);
    return res.status(200).json({
      status: 'success',
      message: 'Product updated successfully!',
      data: { product }
    });
  } catch (error) {
    return res.status(500).json({ status: 'fail', message: 'Something went wrong!' });
  }
};

const adminUpdateProductStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isBlocked } = req.body;
    if (typeof isBlocked !== 'boolean') {
      return res.status(400).json({ status: 'fail', message: 'isBlocked must be a boolean.' });
    }
    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({ status: 'fail', message: 'Product not found!' });
    }
    await product.update({ isBlocked });
    return res.status(200).json({
      status: 'success',
      message: `Product ${isBlocked ? 'blocked' : 'unblocked'} successfully.`,
      data: { product }
    });
  } catch (error) {
    return res.status(500).json({ status: 'fail', message: 'Something went wrong!' });
  }
};

const adminDeleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({ status: 'fail', message: 'Product not found!' });
    }
    await product.destroy();
    return res.status(200).json({ status: 'success', message: 'Product deleted successfully!' });
  } catch (error) {
    return res.status(500).json({ status: 'fail', message: 'Something went wrong!' });
  }
};

// ─────────────────────────────────────────
// CATEGORIES (ADMIN)
// ─────────────────────────────────────────

const adminGetAllCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({ order: [['createdAt', 'DESC']] });
    return res.status(200).json({ status: 'success', data: { categories } });
  } catch (error) {
    return res.status(500).json({ status: 'fail', message: 'Something went wrong!' });
  }
};

const adminCreateCategory = async (req, res) => {
  try {
    const { name, icon } = req.body;
    if (!name) {
      return res.status(400).json({ status: 'fail', message: 'Please enter a name!' });
    }
    const existing = await Category.findOne({ where: { name } });
    if (existing) {
      return res.status(409).json({ status: 'fail', message: 'This category already exists!' });
    }
    const category = await Category.create({ name, icon });
    return res.status(201).json({ status: 'success', data: { category } });
  } catch (error) {
    return res.status(500).json({ status: 'fail', message: 'Something went wrong!' });
  }
};

const adminUpdateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ status: 'fail', message: 'No data provided to update the category!' });
    }
    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(404).json({ status: 'fail', message: 'Category not found!' });
    }
    const { name } = req.body;
    if (name && name !== category.name) {
      const conflict = await Category.findOne({ where: { name } });
      if (conflict) {
        return res.status(409).json({ status: 'fail', message: 'Another category with this name exists!' });
      }
    }
    await category.update(req.body);
    return res.status(200).json({
      status: 'success',
      data: { message: 'Category updated successfully!', category }
    });
  } catch (error) {
    return res.status(500).json({ status: 'fail', message: 'Something went wrong!' });
  }
};

const adminUpdateCategoryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isBlocked } = req.body;
    if (typeof isBlocked !== 'boolean') {
      return res.status(400).json({ status: 'fail', message: 'isBlocked must be a boolean.' });
    }
    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(404).json({ status: 'fail', message: 'Category not found!' });
    }
    const t = await sequelize.transaction();
    try {
      await category.update({ isBlocked }, { transaction: t });
      if (isBlocked) {
        await Product.update({ isBlocked: true }, { where: { categoryId: id }, transaction: t });
      }
      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }
    const message = isBlocked
      ? 'Category blocked. All products in this category have been blocked.'
      : 'Category unblocked. Products must be unblocked individually.';
    return res.status(200).json({ status: 'success', message, data: { category } });
  } catch (error) {
    return res.status(500).json({ status: 'fail', message: 'Something went wrong!' });
  }
};

module.exports = {
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
};
