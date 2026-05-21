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
      return res.status(401).json({ status: 'fail', message: 'Not allowed!' });
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

    const { search } = req.query;
    const whereClause = {};
    if (search) {
      whereClause[Op.or] = [
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
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

const adminGetProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByPk(id, {
      include: [{ model: Category, attributes: ['id', 'name'] }]
    });
    if (!product) {
      return res.status(404).json({ status: 'fail', message: 'Product not found!' });
    }
    return res.status(200).json({ status: 'success', data: { product } });
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

const adminGetCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(404).json({ status: 'fail', message: 'Category not found!' });
    }
    return res.status(200).json({ status: 'success', data: { category } });
  } catch (error) {
    return res.status(500).json({ status: 'fail', message: 'Something went wrong!' });
  }
};

const adminCreateCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const icon = req.file?.path || null;
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
    console.error('adminCreateCategory error:', error);
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
      await category.reload();
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

// ─────────────────────────────────────────
// ORDERS (ADMIN)
// ─────────────────────────────────────────

const adminGetAllOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const offset = (page - 1) * limit;
    const { search, status } = req.query;

    const VALID_STATUSES = ['pending', 'dispatched', 'delivered', 'cancelled'];
    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ status: 'fail', message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}.` });
    }

    const whereClause = {};
    if (status) whereClause.status = status;
    if (search) {
      whereClause[Op.or] = [
        { orderNumber: search },
        { email: { [Op.like]: `%${search}%` } },
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows: orders } = await Order.findAndCountAll({
      where: whereClause,
      attributes: ['id', 'orderNumber', 'firstName', 'lastName', 'email', 'totalAmount', 'status', 'createdAt', 'estimatedDelivery'],
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json({
      status: 'success',
      data: { orders },
      pagination: { totalItems: count, totalPages: Math.ceil(count / limit), currentPage: page, perPage: limit }
    });
  } catch (error) {
    return res.status(500).json({ status: 'fail', message: 'Something went wrong!' });
  }
};

const adminGetOrderDetail = async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const order = await Order.findOne({
      where: { orderNumber },
      include: [
        {
          model: OrderItem,
          include: [{ model: Product, attributes: ['name', 'image', 'price', 'weight'] }]
        },
        {
          model: DeliverySlot,
          as: 'deliverySlot',
          attributes: ['label', 'windowLabel', 'offsetDays']
        }
      ]
    });
    if (!order) {
      return res.status(404).json({ status: 'fail', message: 'Order not found!' });
    }
    const items = order.orderItems.map(item => ({
      name: item.product.name,
      image: item.product.image,
      price: item.product.price,
      weight: item.product.weight,
      quantity: item.productQuantity,
      itemTotalPrice: item.itemTotalPrice
    }));
    return res.status(200).json({
      status: 'success',
      data: {
        orderNumber: order.orderNumber,
        userId: order.userId,
        firstName: order.firstName,
        lastName: order.lastName,
        email: order.email,
        phone: order.phone,
        deliveryAddress: order.deliveryAddress,
        notes: order.notes,
        products: items,
        subTotal: order.subTotal,
        discount: order.discount || 0,
        couponDiscount: order.couponDiscount || 0,
        deliveryFee: order.deliveryFee,
        totalAmount: order.totalAmount,
        status: order.status,
        cancelReason: order.cancelReason,
        estimatedDelivery: order.estimatedDelivery,
        deliverySlot: order.deliverySlot
          ? { label: order.deliverySlot.label, windowLabel: order.deliverySlot.windowLabel }
          : null,
        createdAt: order.createdAt
      }
    });
  } catch (error) {
    return res.status(500).json({ status: 'fail', message: 'Something went wrong!' });
  }
};

const adminGetOrderRevenue = async (req, res) => {
  try {
    const revenue = await Order.sum('totalAmount', { where: { status: 'delivered' } });
    return res.status(200).json({
      status: 'success',
      data: { totalRevenue: parseFloat(revenue || 0).toFixed(2) }
    });
  } catch (error) {
    return res.status(500).json({ status: 'fail', message: 'Something went wrong!' });
  }
};

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const pad = n => String(n).padStart(2, '0');
const fmtTime = d => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const fmtDateTime = d => `${d.getDate()} ${MONTHS[d.getMonth()]} ${pad(d.getHours())}:${pad(d.getMinutes())}`;

const buildInsightBuckets = async (period) => {
  const now = new Date();
  let rangeStart;
  let bucketMs;

  if (period === 'daily') {
    rangeStart = new Date(now);
    rangeStart.setHours(rangeStart.getHours() - 24, 0, 0, 0);
    bucketMs = 60 * 60 * 1000;
  } else if (period === 'weekly') {
    rangeStart = new Date(now);
    rangeStart.setDate(rangeStart.getDate() - 7);
    rangeStart.setHours(0, 0, 0, 0);
    bucketMs = 24 * 60 * 60 * 1000;
  } else {
    rangeStart = new Date(now);
    rangeStart.setMonth(rangeStart.getMonth() - 1);
    rangeStart.setHours(0, 0, 0, 0);
    bucketMs = 24 * 60 * 60 * 1000;
  }

  const buckets = [];
  let cursor = rangeStart.getTime();
  const nowMs = now.getTime();
  while (cursor < nowMs) {
    const to = Math.min(cursor + bucketMs, nowMs);
    buckets.push({ fromMs: cursor, toMs: to, total: 0, byStatus: { pending: 0, dispatched: 0, delivered: 0, cancelled: 0 } });
    cursor += bucketMs;
  }

  const orders = await Order.findAll({
    where: { createdAt: { [Op.between]: [rangeStart, now] } },
    attributes: ['createdAt', 'status'],
    raw: true
  });

  for (const order of orders) {
    const ts = new Date(order.createdAt).getTime();
    const idx = Math.min(Math.floor((ts - rangeStart.getTime()) / bucketMs), buckets.length - 1);
    if (idx >= 0) {
      buckets[idx].byStatus[order.status]++;
      buckets[idx].total++;
    }
  }

  const fmt = period === 'daily' ? fmtTime : fmtDateTime;
  return buckets.map(b => ({
    from: fmt(new Date(b.fromMs)),
    to: fmt(new Date(b.toMs)),
    total: b.total,
    byStatus: b.byStatus
  }));
};

const adminGetOrderInsights = async (req, res) => {
  try {
    const { period } = req.params;
    if (!['daily', 'weekly', 'monthly'].includes(period)) {
      return res.status(400).json({ status: 'fail', message: "period must be 'daily', 'weekly', or 'monthly'." });
    }
    const buckets = await buildInsightBuckets(period);
    return res.status(200).json({ status: 'success', data: { period, buckets } });
  } catch (error) {
    return res.status(500).json({ status: 'fail', message: 'Something went wrong!' });
  }
};

const adminGetDashboard = async (req, res) => {
  try {
    const period = ['daily', 'weekly', 'monthly'].includes(req.query.period) ? req.query.period : 'daily';

    const [
      [totalUsers, totalProducts, totalCategories, totalOrders, pendingOrders],
      revenueRaw,
      insightBuckets,
      recentOrders,
      lowStockProducts
    ] = await Promise.all([
      Promise.all([
        User.count(),
        Product.count(),
        Category.count(),
        Order.count(),
        Order.count({ where: { status: 'pending' } })
      ]),
      Order.sum('totalAmount', { where: { status: 'delivered' } }),
      buildInsightBuckets(period),
      Order.findAll({
        attributes: ['orderNumber', 'firstName', 'lastName', 'email', 'totalAmount', 'status', 'createdAt'],
        order: [['createdAt', 'DESC']],
        limit: 5,
        raw: true
      }),
      Product.findAll({
        where: { stockQuantity: { [Op.lte]: 5 }, isBlocked: false },
        attributes: ['id', 'name', 'stockQuantity', 'isInStock'],
        order: [['stockQuantity', 'ASC']],
        limit: 10,
        raw: true
      })
    ]);

    return res.status(200).json({
      status: 'success',
      data: {
        stats: { totalUsers, totalProducts, totalCategories, totalOrders, pendingOrders },
        revenue: { totalRevenue: parseFloat(revenueRaw || 0).toFixed(2) },
        insights: { period, buckets: insightBuckets },
        recentOrders,
        lowStockProducts
      }
    });
  } catch (error) {
    return res.status(500).json({ status: 'fail', message: 'Something went wrong!' });
  }
};

const VALID_TRANSITIONS = {
  pending: ['dispatched', 'cancelled'],
  dispatched: ['delivered'],
  delivered: [],
  cancelled: []
};

const adminUpdateOrderStatus = async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ status: 'fail', message: 'Status is required.' });
    }

    const order = await Order.findOne({ where: { orderNumber } });
    if (!order) {
      return res.status(404).json({ status: 'fail', message: 'Order not found!' });
    }

    const allowedNext = VALID_TRANSITIONS[order.status] || [];
    if (!allowedNext.includes(status)) {
      const allowed = allowedNext.length ? allowedNext.join(', ') : 'none';
      return res.status(400).json({
        status: 'fail',
        message: `Cannot transition order from "${order.status}" to "${status}". Allowed: ${allowed}.`
      });
    }

    order.status = status;
    await order.save();

    await Notification.create({
      userId: order.userId,
      title: 'Order Status Updated',
      body: `Your order ${orderNumber} status has been updated to "${status}".`
    });

    return res.status(200).json({ status: 'success', message: 'Order status updated!' });
  } catch (error) {
    return res.status(500).json({ status: 'fail', message: 'Something went wrong!' });
  }
};

// ─────────────────────────────────────────
// COUPONS (ADMIN)
// ─────────────────────────────────────────

const adminListCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.findAll({ order: [['createdAt', 'DESC']] });
    return res.status(200).json({ status: 'success', data: { coupons } });
  } catch (error) {
    return res.status(500).json({ status: 'fail', message: 'Something went wrong!' });
  }
};

const adminCreateCoupon = async (req, res) => {
  try {
    const { couponCode, discountAmount, expiresAt, isActive } = req.body;
    if (!couponCode || !discountAmount || !expiresAt || isActive === undefined) {
      return res.status(400).json({ status: 'fail', message: 'Please enter all fields!' });
    }
    const codeExists = await Coupon.findOne({ where: { code: couponCode } });
    if (codeExists) {
      return res.status(409).json({ status: 'fail', message: 'A coupon with this code already exists!' });
    }
    if (new Date(expiresAt).getTime() <= Date.now()) {
      return res.status(422).json({ status: 'fail', message: 'Coupons cannot have a past expiry date!' });
    }
    const coupon = await Coupon.create({ code: couponCode, discountAmount, expiresAt, isActive });
    return res.status(201).json({ status: 'success', message: 'Coupon created successfully!', data: { coupon } });
  } catch (error) {
    return res.status(500).json({ status: 'fail', message: 'Something went wrong!' });
  }
};

const adminUpdateCoupon = async (req, res) => {
  try {
    const { code } = req.params;
    const coupon = await Coupon.findOne({ where: { code } });
    if (!coupon) {
      return res.status(404).json({ status: 'fail', message: `Coupon "${code}" not found.` });
    }
    const { couponCode, discountAmount, expiresAt, isActive } = req.body;
    const updatedFields = {};
    if (couponCode !== undefined) updatedFields.code = couponCode;
    if (discountAmount !== undefined) {
      const num = parseFloat(discountAmount);
      if (isNaN(num) || num < 0 || num > 100) {
        return res.status(400).json({ status: 'fail', message: 'discountAmount must be between 0 and 100.' });
      }
      updatedFields.discountAmount = num;
    }
    if (expiresAt !== undefined) updatedFields.expiresAt = expiresAt;
    if (isActive !== undefined) updatedFields.isActive = isActive;
    await coupon.update(updatedFields);
    return res.status(200).json({ status: 'success', message: 'Coupon updated successfully!', data: { coupon } });
  } catch (error) {
    return res.status(500).json({ status: 'fail', message: 'Something went wrong!' });
  }
};

const adminDeleteCoupon = async (req, res) => {
  try {
    const { code } = req.params;
    const coupon = await Coupon.findOne({ where: { code } });
    if (!coupon) {
      return res.status(404).json({ status: 'fail', message: `Coupon "${code}" not found.` });
    }
    await coupon.destroy();
    return res.status(200).json({ status: 'success', message: 'Coupon deleted successfully!' });
  } catch (error) {
    return res.status(500).json({ status: 'fail', message: 'Something went wrong!' });
  }
};

// ─────────────────────────────────────────
// REVIEWS (ADMIN)
// ─────────────────────────────────────────

const adminGetAllReviews = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const offset = (page - 1) * limit;

    const { count, rows: reviews } = await Review.findAndCountAll({
      include: [
        { model: Product, attributes: ['name', 'image'] },
        { model: User, attributes: ['firstName', 'lastName', 'email'] }
      ],
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json({
      status: 'success',
      data: { reviews },
      pagination: { totalItems: count, totalPages: Math.ceil(count / limit), currentPage: page, perPage: limit }
    });
  } catch (error) {
    return res.status(500).json({ status: 'fail', message: 'Something went wrong!' });
  }
};

const adminDeleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const review = await Review.findByPk(id);
    if (!review) {
      return res.status(404).json({ status: 'fail', message: 'Review not found!' });
    }
    await review.destroy();
    return res.status(200).json({ status: 'success', message: 'Review deleted successfully!' });
  } catch (error) {
    return res.status(500).json({ status: 'fail', message: 'Something went wrong!' });
  }
};

// ─────────────────────────────────────────
// DELIVERY SLOTS (ADMIN)
// ─────────────────────────────────────────

const adminGetAllDeliverySlots = async (req, res) => {
  try {
    const slots = await DeliverySlot.findAll({ order: [['sortOrder', 'ASC']] });
    return res.status(200).json({ status: 'success', data: { slots } });
  } catch (error) {
    return res.status(500).json({ status: 'fail', message: 'Something went wrong!' });
  }
};

const adminCreateDeliverySlot = async (req, res) => {
  try {
    const { label, cutoffTime, windowLabel, offsetDays, isActive, sortOrder } = req.body;
    if (!label || !cutoffTime || !windowLabel || sortOrder === undefined) {
      return res.status(400).json({ status: 'fail', message: 'label, cutoffTime, windowLabel, and sortOrder are required.' });
    }
    const slot = await DeliverySlot.create({
      label,
      cutoffTime,
      windowLabel,
      offsetDays: offsetDays ?? 0,
      isActive: isActive ?? true,
      sortOrder
    });
    return res.status(201).json({ status: 'success', message: 'Delivery slot created successfully!', data: { slot } });
  } catch (error) {
    return res.status(500).json({ status: 'fail', message: 'Something went wrong!' });
  }
};

const adminUpdateDeliverySlot = async (req, res) => {
  try {
    const { id } = req.params;
    const slot = await DeliverySlot.findByPk(id);
    if (!slot) {
      return res.status(404).json({ status: 'fail', message: 'Delivery slot not found!' });
    }
    const { label, cutoffTime, windowLabel, offsetDays, isActive, sortOrder } = req.body;
    const updateData = {};
    if (label !== undefined) updateData.label = label;
    if (cutoffTime !== undefined) updateData.cutoffTime = cutoffTime;
    if (windowLabel !== undefined) updateData.windowLabel = windowLabel;
    if (offsetDays !== undefined) updateData.offsetDays = offsetDays;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;

    await slot.update(updateData);
    return res.status(200).json({ status: 'success', message: 'Delivery slot updated successfully!', data: { slot } });
  } catch (error) {
    return res.status(500).json({ status: 'fail', message: 'Something went wrong!' });
  }
};

const adminDeleteDeliverySlot = async (req, res) => {
  try {
    const { id } = req.params;
    const slot = await DeliverySlot.findByPk(id);
    if (!slot) {
      return res.status(404).json({ status: 'fail', message: 'Delivery slot not found!' });
    }
    await slot.destroy();
    return res.status(200).json({ status: 'success', message: 'Delivery slot deleted successfully!' });
  } catch (error) {
    return res.status(500).json({ status: 'fail', message: 'Something went wrong!' });
  }
};

// ─────────────────────────────────────────
// SUPPORT FORMS (ADMIN)
// ─────────────────────────────────────────

const adminGetSupportForms = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const offset = (page - 1) * limit;

    const { search } = req.query;
    const whereClause = {};
    if (search) {
      whereClause[Op.or] = [
        { id: search },
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows: submissions } = await SupportForm.findAndCountAll({
      where: whereClause,
      include: [{ model: User, as: 'user', attributes: ['firstName', 'lastName', 'email'] }],
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json({
      status: 'success',
      data: { submissions },
      pagination: { totalItems: count, totalPages: Math.ceil(count / limit), currentPage: page, perPage: limit }
    });
  } catch (error) {
    return res.status(500).json({ status: 'fail', message: 'Something went wrong!' });
  }
};

module.exports = {
  login,
  getAllUsers,
  getStats,
  adminGetAllProducts,
  adminGetProductById,
  adminCreateProduct,
  adminBulkCreateProducts,
  adminUpdateProduct,
  adminUpdateProductStatus,
  adminDeleteProduct,
  adminGetAllCategories,
  adminGetCategoryById,
  adminCreateCategory,
  adminUpdateCategory,
  adminUpdateCategoryStatus,
  adminGetDashboard,
  adminGetAllOrders,
  adminGetOrderRevenue,
  adminGetOrderInsights,
  adminGetOrderDetail,
  adminUpdateOrderStatus,
  adminListCoupons,
  adminCreateCoupon,
  adminUpdateCoupon,
  adminDeleteCoupon,
  adminGetAllReviews,
  adminDeleteReview,
  adminGetSupportForms,
  adminGetAllDeliverySlots,
  adminCreateDeliverySlot,
  adminUpdateDeliverySlot,
  adminDeleteDeliverySlot,
};
