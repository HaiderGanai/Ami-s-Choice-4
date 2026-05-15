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
    if (!user) {
      return res.status(404).json({ status: 'fail', message: 'User does not exist!' });
    }
    if (user.role !== 'admin') {
      return res.status(401).json({ status: 'fail', message: 'You are not authorized on this route!' });
    }
    const passMatch = await bcrypt.compare(password, user.password);
    if (!passMatch) {
      return res.status(400).json({ status: 'fail', message: 'Invalid credentials!' });
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
    return res.status(500).json({ status: 'fail', message: error.message });
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

module.exports = { login, getAllUsers, getStats };
