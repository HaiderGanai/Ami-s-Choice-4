# Admin Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete admin REST API under `/api/v1/admin/` covering users, products, categories, orders, coupons, reviews, support forms, and dashboard stats — consolidated in a single admin controller and router.

**Architecture:** All admin operations added to `adminController.js` grouped by domain. `adminRoute.js` expands to cover all endpoints. Existing public routes retain read-only operations with `isBlocked` filtering added. Two new `isBlocked: BOOLEAN` fields added to `Product` and `Categories` models via migration.

**Tech Stack:** Express.js, Sequelize (MySQL), JWT (`isAdmin` middleware), Cloudinary (`upload.single('image')` for product images)

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/models/productModel.js` | Modify | Add `isBlocked` field |
| `src/models/categoriesModel.js` | Modify | Add `isBlocked` field |
| `src/migrations/runMigration.js` | Modify | Add `isBlocked` columns to both tables |
| `src/controllers/productController.js` | Modify | Add `isBlocked: false` to public query filters |
| `src/controllers/categoryController.js` | Modify | Add `isBlocked: false` filter; disable delete with 405 |
| `src/controllers/adminController.js` | Modify | All admin functions (users, products, categories, orders, coupons, reviews, support forms, stats) |
| `src/routes/adminRoute.js` | Modify | All admin routes wired up |
| `src/routes/productsRoutes.js` | Modify | Remove admin write routes (POST, PUT, DELETE) |
| `src/routes/categoriesRoutes.js` | Modify | Remove admin write routes; replace DELETE with 405 |
| `src/routes/couponRoutes.js` | Modify | Remove all routes (all moved to admin) |
| `src/routes/orderRoutes.js` | Modify | Remove `PATCH /orders/status/:orderNumber` |
| `CLAUDE.md` | Modify | Document admin panel module |

---

## Task 1: Add `isBlocked` field to Product and Categories models

**Files:**
- Modify: `src/models/productModel.js`
- Modify: `src/models/categoriesModel.js`
- Modify: `src/migrations/runMigration.js`

- [ ] **Step 1: Add `isBlocked` to Product model**

In `src/models/productModel.js`, add the following field inside the model definition object, after `categoryId`:

```js
isBlocked: {
  type: DataTypes.BOOLEAN,
  defaultValue: false,
  allowNull: false,
},
```

The model definition block should end like this:

```js
categoryId: {
  type: DataTypes.INTEGER,
  allowNull: true
},
isBlocked: {
  type: DataTypes.BOOLEAN,
  defaultValue: false,
  allowNull: false,
},
```

- [ ] **Step 2: Add `isBlocked` to Categories model**

In `src/models/categoriesModel.js`, update the model definition to:

```js
const Categories = sequelize.define('categorie', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  icon: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isBlocked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  }
});
```

- [ ] **Step 3: Update migration script to add both columns**

Replace the contents of `src/migrations/runMigration.js` with:

```js
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { sequelize } = require('../config/dbConnect');

const migrate = async () => {
  try {
    await sequelize.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS isEmailVerified BOOLEAN NOT NULL DEFAULT false;
    `);
    console.log('✅ Migration: users.isEmailVerified');

    await sequelize.query(`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS isBlocked BOOLEAN NOT NULL DEFAULT false;
    `);
    console.log('✅ Migration: products.isBlocked');

    await sequelize.query(`
      ALTER TABLE categories ADD COLUMN IF NOT EXISTS isBlocked BOOLEAN NOT NULL DEFAULT false;
    `);
    console.log('✅ Migration: categories.isBlocked');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
};

migrate();
```

- [ ] **Step 4: Run migration**

```bash
cd "/home/haider/Work/Ami's Choice" && node src/migrations/runMigration.js
```

Expected output:
```
✅ Migration: users.isEmailVerified
✅ Migration: products.isBlocked
✅ Migration: categories.isBlocked
```

- [ ] **Step 5: Commit**

```bash
git add src/models/productModel.js src/models/categoriesModel.js src/migrations/runMigration.js
git commit -m "feat: add isBlocked field to Product and Categories models"
```

---

## Task 2: Filter blocked products from public routes

**Files:**
- Modify: `src/controllers/productController.js`

- [ ] **Step 1: Add `isBlocked: false` to `getAllProducts`**

In `getAllProducts` (around line 516), the `whereClause` is initialized as `{}`. Change that line to:

```js
const whereClause = { isBlocked: false };
```

- [ ] **Step 2: Add blocked check to `getSingleProduct`**

In `getSingleProduct` (around line 842), after the `findByPk` and the `if (!product)` check, add:

```js
if (product.isBlocked) {
  return res.status(404).json({
    status: 'fail',
    message: 'Product not found!'
  });
}
```

The function should look like:

```js
const getSingleProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByPk(id, {
      include: [
        {
          model: Review,
          as: 'reviews',
          attributes: ['rating', 'comment', 'createdAt'],
          include: [{ model: User, attributes: ['firstName', 'lastName'] }]
        }
      ]
    });
    if (!product) {
      return res.status(404).json({ status: 'fail', message: 'Product not found!' });
    }
    if (product.isBlocked) {
      return res.status(404).json({ status: 'fail', message: 'Product not found!' });
    }
    res.status(200).json({ status: 'success', data: { product } });
  } catch (error) {
    return res.status(500).json({ status: 'fail', message: 'Something went wrong!' });
  }
};
```

- [ ] **Step 3: Add `isBlocked: false` to `bestSelling`**

In `bestSelling` (around line 696), find the `include` block for `Product`:

```js
include: [
  {
    model: Product,
    where: whereClause,
    attributes: ['id', 'name', 'price', 'discountPrice', 'image'],
  }
],
```

Add `isBlocked: false` to the `where` inside the Product include. The `whereClause` for bestSelling already filters by product fields, so we add `isBlocked: false` directly to the Product where:

```js
include: [
  {
    model: Product,
    where: { ...whereClause, isBlocked: false },
    attributes: ['id', 'name', 'price', 'discountPrice', 'image'],
  }
],
```

Apply this change to both the main `findAll` call and the count `findAll` call inside `if (includeTotalCount)`.

- [ ] **Step 4: Commit**

```bash
git add src/controllers/productController.js
git commit -m "feat: filter blocked products from public product routes"
```

---

## Task 3: Filter blocked categories from public route + disable delete

**Files:**
- Modify: `src/controllers/categoryController.js`

- [ ] **Step 1: Add `isBlocked: false` to `getAllCategories`**

In `getAllCategories`, update the `findAll` call:

```js
const categories = await Categories.findAll({ where: { isBlocked: false } });
```

- [ ] **Step 2: Replace `deleteCategories` with 405 handler**

Replace the entire `deleteCategories` function with:

```js
const deleteCategories = async (req, res) => {
  return res.status(405).json({
    status: 'fail',
    message: 'Categories cannot be deleted.'
  });
};
```

- [ ] **Step 3: Commit**

```bash
git add src/controllers/categoryController.js
git commit -m "feat: filter blocked categories from public route; disable category delete"
```

---

## Task 4: Admin controller — foundation, users list, dashboard stats

**Files:**
- Modify: `src/controllers/adminController.js`

- [ ] **Step 1: Replace adminController.js with expanded version (foundation + users + stats)**

Replace the entire `src/controllers/adminController.js` with:

```js
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
```

- [ ] **Step 2: Commit**

```bash
git add src/controllers/adminController.js
git commit -m "feat: admin controller foundation — login, users list, dashboard stats"
```

---

## Task 5: Admin controller — products

**Files:**
- Modify: `src/controllers/adminController.js`

- [ ] **Step 1: Add product functions to adminController.js**

Add the following functions **before** the `module.exports` line. Also update `module.exports` at the end.

```js
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
    return res.status(500).json({ status: 'fail', message: 'Something went wrong!', error: error.message });
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
      if (!name?.trim() || !description?.trim() || isNaN(parseFloat(weight)) || isNaN(parseFloat(price)) || isNaN(parseInt(stockQuantity)) || isNaN(parseInt(categoryId))) {
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
    return res.status(500).json({ status: 'fail', message: 'Something went wrong!', error: error.message });
  }
};

const adminUpdateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({ status: 'fail', message: 'Product not found!' });
    }
    const updateData = { ...req.body };
    if (req.file?.path) {
      updateData.image = req.file.path;
    }
    await product.update(updateData);
    return res.status(200).json({
      status: 'success',
      message: 'Product updated successfully!',
      data: { product }
    });
  } catch (error) {
    return res.status(500).json({ status: 'fail', message: 'Something went wrong!', error: error.message });
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
```

- [ ] **Step 2: Update module.exports**

Replace the existing `module.exports` line with:

```js
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
};
```

- [ ] **Step 3: Commit**

```bash
git add src/controllers/adminController.js
git commit -m "feat: admin product endpoints — list, create, bulk create, update, status toggle, delete"
```

---

## Task 6: Admin controller — categories

**Files:**
- Modify: `src/controllers/adminController.js`

- [ ] **Step 1: Add category functions before module.exports**

```js
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
```

- [ ] **Step 2: Update module.exports**

```js
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
```

- [ ] **Step 3: Commit**

```bash
git add src/controllers/adminController.js
git commit -m "feat: admin category endpoints — list, create, update, status toggle with product cascade"
```

---

## Task 7: Admin controller — orders

**Files:**
- Modify: `src/controllers/adminController.js`

- [ ] **Step 1: Add order functions before module.exports**

```js
// ─────────────────────────────────────────
// ORDERS (ADMIN)
// ─────────────────────────────────────────

const adminGetAllOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const offset = (page - 1) * limit;
    const { search } = req.query;

    const whereClause = {};
    if (search) {
      whereClause[Op.or] = [
        { orderNumber: search },
        { email: { [Op.like]: `%${search}%` } }
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
```

- [ ] **Step 2: Update module.exports**

```js
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
  adminGetAllOrders,
  adminGetOrderDetail,
  adminUpdateOrderStatus,
};
```

- [ ] **Step 3: Commit**

```bash
git add src/controllers/adminController.js
git commit -m "feat: admin order endpoints — list, search, detail, status update with strict transitions"
```

---

## Task 8: Admin controller — coupons

**Files:**
- Modify: `src/controllers/adminController.js`

- [ ] **Step 1: Add coupon functions before module.exports**

```js
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
```

- [ ] **Step 2: Update module.exports**

```js
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
  adminGetAllOrders,
  adminGetOrderDetail,
  adminUpdateOrderStatus,
  adminListCoupons,
  adminCreateCoupon,
  adminUpdateCoupon,
  adminDeleteCoupon,
};
```

- [ ] **Step 3: Commit**

```bash
git add src/controllers/adminController.js
git commit -m "feat: admin coupon endpoints — list, create, update, delete"
```

---

## Task 9: Admin controller — reviews and support forms

**Files:**
- Modify: `src/controllers/adminController.js`

- [ ] **Step 1: Add review and support form functions before module.exports**

```js
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
// SUPPORT FORMS (ADMIN)
// ─────────────────────────────────────────

const adminGetSupportForms = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const offset = (page - 1) * limit;

    const { count, rows: submissions } = await SupportForm.findAndCountAll({
      include: [{ model: User, attributes: ['firstName', 'lastName', 'email'] }],
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json({
      status: 'success',
      data: { submissions },
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
```

- [ ] **Step 2: Update module.exports (final version)**

```js
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
  adminGetAllOrders,
  adminGetOrderDetail,
  adminUpdateOrderStatus,
  adminListCoupons,
  adminCreateCoupon,
  adminUpdateCoupon,
  adminDeleteCoupon,
  adminGetAllReviews,
  adminDeleteReview,
  adminGetSupportForms,
};
```

- [ ] **Step 3: Commit**

```bash
git add src/controllers/adminController.js
git commit -m "feat: admin reviews and support forms endpoints"
```

---

## Task 10: Wire up all admin routes in adminRoute.js

**Files:**
- Modify: `src/routes/adminRoute.js`

- [ ] **Step 1: Replace adminRoute.js with full admin router**

Replace the entire contents of `src/routes/adminRoute.js` with:

```js
const express = require('express');
const adminRouter = express.Router();
const { isAdmin } = require('../middlewares/isAdminMiddleware');
const upload = require('../middlewares/upload');

const {
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
  adminGetAllOrders,
  adminGetOrderDetail,
  adminUpdateOrderStatus,
  adminListCoupons,
  adminCreateCoupon,
  adminUpdateCoupon,
  adminDeleteCoupon,
  adminGetAllReviews,
  adminDeleteReview,
  adminGetSupportForms,
} = require('../controllers/adminController');

// Auth
adminRouter.post('/login', login);

// Dashboard
adminRouter.get('/stats', isAdmin, getStats);

// Users
adminRouter.get('/users', isAdmin, getAllUsers);

// Products
adminRouter.get('/products', isAdmin, adminGetAllProducts);
adminRouter.post('/products', isAdmin, upload.single('image'), adminCreateProduct);
adminRouter.post('/bulk-products', isAdmin, adminBulkCreateProducts);
adminRouter.put('/products/:id', isAdmin, upload.single('image'), adminUpdateProduct);
adminRouter.patch('/products/:id/status', isAdmin, adminUpdateProductStatus);
adminRouter.delete('/products/:id', isAdmin, adminDeleteProduct);

// Categories
adminRouter.get('/categories', isAdmin, adminGetAllCategories);
adminRouter.post('/categories', isAdmin, adminCreateCategory);
adminRouter.put('/categories/:id', isAdmin, adminUpdateCategory);
adminRouter.patch('/categories/:id/status', isAdmin, adminUpdateCategoryStatus);

// Orders
adminRouter.get('/orders', isAdmin, adminGetAllOrders);
adminRouter.get('/orders/:orderNumber', isAdmin, adminGetOrderDetail);
adminRouter.patch('/orders/:orderNumber/status', isAdmin, adminUpdateOrderStatus);

// Coupons
adminRouter.get('/coupons', isAdmin, adminListCoupons);
adminRouter.post('/coupons', isAdmin, adminCreateCoupon);
adminRouter.patch('/coupons/:code', isAdmin, adminUpdateCoupon);
adminRouter.delete('/coupons/:code', isAdmin, adminDeleteCoupon);

// Reviews
adminRouter.get('/reviews', isAdmin, adminGetAllReviews);
adminRouter.delete('/reviews/:id', isAdmin, adminDeleteReview);

// Support Forms
adminRouter.get('/support-forms', isAdmin, adminGetSupportForms);

module.exports = { adminRouter };
```

- [ ] **Step 2: Commit**

```bash
git add src/routes/adminRoute.js
git commit -m "feat: wire up all admin routes under /api/v1/admin/"
```

---

## Task 11: Clean up public route files

**Files:**
- Modify: `src/routes/productsRoutes.js`
- Modify: `src/routes/categoriesRoutes.js`
- Modify: `src/routes/couponRoutes.js`
- Modify: `src/routes/orderRoutes.js`

- [ ] **Step 1: Strip admin write routes from productsRoutes.js**

Replace the entire contents of `src/routes/productsRoutes.js` with:

```js
const express = require('express');
const { getAllProducts, getSingleProduct, bestSelling } = require('../controllers/productController');
const productRouter = express.Router();

productRouter.get('/products', getAllProducts);
productRouter.get('/best-selling', bestSelling);
productRouter.get('/products/:id', getSingleProduct);

module.exports = { productRouter };
```

- [ ] **Step 2: Strip admin write routes from categoriesRoutes.js**

Replace the entire contents of `src/routes/categoriesRoutes.js` with:

```js
const express = require('express');
const { getAllCategories, deleteCategories } = require('../controllers/categoryController');
const categoryRouter = express.Router();

categoryRouter.get('/categories', getAllCategories);
categoryRouter.delete('/categories/:id', deleteCategories);

module.exports = { categoryRouter };
```

Note: `deleteCategories` now returns 405 (updated in Task 3), so this route stays but safely rejects delete attempts.

- [ ] **Step 3: Clear couponRoutes.js — all coupon ops moved to admin**

Replace the entire contents of `src/routes/couponRoutes.js` with:

```js
const express = require('express');
const couponRouter = express.Router();

module.exports = { couponRouter };
```

- [ ] **Step 4: Remove changeOrderStatus route from orderRoutes.js**

In `src/routes/orderRoutes.js`, remove this line:

```js
orderRouter.patch('/orders/status/:orderNumber', isAdmin, changeOrderStatus);
```

Also remove `changeOrderStatus` from the destructured import and remove the `isAdmin` import if it's no longer used. The file should become:

```js
const express = require('express');
const { checkOut, orderHistory, specificOrder, cancelOrder } = require('../controllers/orderControllers');
const { verifyToken } = require('../middlewares/jwtMiddleware');
const orderRouter = express.Router();

orderRouter.post('/orders', verifyToken, checkOut);
orderRouter.get('/orders', verifyToken, orderHistory);
orderRouter.get('/orders/:orderNumber', verifyToken, specificOrder);
orderRouter.patch('/orders/cancel/:orderNumber', verifyToken, cancelOrder);

module.exports = { orderRouter };
```

- [ ] **Step 5: Commit**

```bash
git add src/routes/productsRoutes.js src/routes/categoriesRoutes.js src/routes/couponRoutes.js src/routes/orderRoutes.js
git commit -m "refactor: consolidate admin routes — remove admin ops from public route files"
```

---

## Task 12: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Add Admin Panel section to CLAUDE.md**

Add the following section to `CLAUDE.md` after the "Email Verification Flow" section and before "File Locations":

```markdown
## Admin Panel (added 2026-05-15)

All admin routes under `/api/v1/admin/`, protected by `isAdmin` middleware.

### Auth
- `POST /admin/login` — admin login (returns JWT)

### Dashboard
- `GET /admin/stats` — totalUsers, totalProducts, totalCategories, totalOrders, pendingOrders, totalRevenue

### Users
- `GET /admin/users` — paginated user list (excludes password/token fields)

### Products (admin)
- `GET /admin/products` — all products including blocked, paginated
- `POST /admin/products` — create product (Cloudinary image upload)
- `POST /admin/bulk-products` — bulk create products
- `PUT /admin/products/:id` — update product
- `PATCH /admin/products/:id/status` — block/unblock product (`{ isBlocked: true/false }`)
- `DELETE /admin/products/:id` — hard delete

**Model change**: `Product` has new `isBlocked` (BOOLEAN, default false) field. Public `GET /products` routes filter `isBlocked: false`.

### Categories (admin)
- `GET /admin/categories` — all categories including blocked
- `POST /admin/categories` — create category
- `PUT /admin/categories/:id` — update name/icon
- `PATCH /admin/categories/:id/status` — block/unblock; blocking cascades `isBlocked: true` to all products in the category (in one transaction); unblocking does NOT auto-unblock products
- `DELETE /admin/categories/:id` — returns 405 (categories cannot be deleted)

**Model change**: `Categories` has new `isBlocked` (BOOLEAN, default false) field.

### Orders (admin)
- `GET /admin/orders` — all orders, paginated; optional `?search=` matches orderNumber (exact) or email (LIKE)
- `GET /admin/orders/:orderNumber` — full order detail including items and delivery slot
- `PATCH /admin/orders/:orderNumber/status` — strict forward-only transitions:
  - `pending` → `dispatched` or `cancelled`
  - `dispatched` → `delivered`
  - `delivered` and `cancelled` are terminal — no further changes allowed

### Coupons (admin)
- `GET /admin/coupons` — list all coupons
- `POST /admin/coupons` — create coupon
- `PATCH /admin/coupons/:code` — update coupon
- `DELETE /admin/coupons/:code` — hard delete

### Reviews (admin)
- `GET /admin/reviews` — paginated list with product name and reviewer info
- `DELETE /admin/reviews/:id` — hard delete review

### Support Forms (admin)
- `GET /admin/support-forms` — paginated list with submitter info

### Route cleanup
- `productsRoutes.js` — public read-only: GET /products, GET /products/:id, GET /best-selling
- `categoriesRoutes.js` — public read-only: GET /categories (returns only non-blocked)
- `couponRoutes.js` — empty (all coupon ops under /admin/coupons)
- `orderRoutes.js` — removed PATCH /orders/status/:orderNumber (now at /admin/orders/:orderNumber/status)
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: document admin panel module in CLAUDE.md"
```

---

## Self-Review Notes

**Spec coverage check:**
- ✅ GET /admin/users — Task 4
- ✅ GET/POST/PUT/PATCH/DELETE /admin/products — Tasks 5, 10
- ✅ GET/POST/PUT/PATCH /admin/categories (no delete) — Tasks 6, 10
- ✅ Category block cascades to products — Task 6
- ✅ GET /admin/orders + search — Task 7
- ✅ GET /admin/orders/:orderNumber — Task 7
- ✅ PATCH /admin/orders/:orderNumber/status with strict transitions — Task 7
- ✅ GET/POST/PATCH/DELETE /admin/coupons — Task 8
- ✅ GET /admin/stats — Task 4
- ✅ GET/DELETE /admin/reviews — Task 9
- ✅ GET /admin/support-forms — Task 9
- ✅ Public routes filter isBlocked — Tasks 2, 3
- ✅ Category delete returns 405 — Task 3
- ✅ Migration for isBlocked columns — Task 1
- ✅ Route cleanup — Task 11
- ✅ CLAUDE.md — Task 12

**Type consistency check:**
- `Category` (from models/index.js) used consistently throughout adminController — matches associations.js
- `DeliverySlot` association alias `'deliverySlot'` matches `associations.js` line 78
- `Order.findOne({ where: { orderNumber } })` — no userId gate for admin, correct
- `VALID_TRANSITIONS` object defined before `adminUpdateOrderStatus` — no reference error
- All `module.exports` entries accumulate correctly across tasks 4→9

**No placeholders found.**
