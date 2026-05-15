# Admin Panel — Design Spec
**Date**: 2026-05-15  
**Project**: Ami's Choice Backend  
**Status**: Approved

---

## Overview

Consolidate all admin operations under a single `/api/v1/admin/` route namespace, protected by the existing `isAdmin` middleware. The current `adminController.js` (login only) expands into a full admin controller. Existing admin-only operations scattered across `productsRoutes`, `categoriesRoutes`, and `couponRoutes` are migrated to `adminRoute.js`.

---

## Architecture

### Route consolidation

All routes under `/api/v1/admin/` behind `isAdmin` middleware. The existing public route files keep only public read operations. Removed admin routes from:

- `productsRoutes.js` — remove `POST`, `POST /bulk`, `PUT /:id`, `DELETE /:id`
- `categoriesRoutes.js` — remove `POST`, `PUT /:id`, `DELETE /:id`
- `couponRoutes.js` — remove `POST`, `GET`, `PATCH /:code` (move all to admin)

Public routes that remain:
- `GET /products`, `GET /products/:id`, `GET /best-selling` — add `isBlocked: false` filter
- `GET /categories` — add `isBlocked: false` filter

### Code organization

All new admin functions go into `src/controllers/adminController.js`, organized by domain section. The file is large but follows the same single-controller-per-feature pattern used throughout this project.

---

## Data Model Changes

### Product model (`src/models/productModel.js`)

Add field:
```js
isBlocked: {
  type: DataTypes.BOOLEAN,
  defaultValue: false,
  allowNull: false,
}
```

### Categories model (`src/models/categoriesModel.js`)

Add field:
```js
isBlocked: {
  type: DataTypes.BOOLEAN,
  defaultValue: false,
  allowNull: false,
}
```

### Migration script

A single migration script adds both columns:
- `ALTER TABLE products ADD COLUMN isBlocked BOOLEAN NOT NULL DEFAULT false`
- `ALTER TABLE categories ADD COLUMN isBlocked BOOLEAN NOT NULL DEFAULT false` (note: Sequelize pluralizes to `categories`)

Wait — the Categories model is `sequelize.define('categorie', ...)` so the table name is `categories` in MySQL.
Actually checking the model: `sequelize.define('categorie',...)` — Sequelize pluralizes to `categories`. Correct.
Product model: `sequelize.define('product', ...)` — Sequelize pluralizes to `products`. Correct.

---

## Full API Surface

All routes: `POST /admin/login` is existing. Everything else below is new.

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/admin/login` | Admin login (existing) |

### Users
| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/users` | Paginated user list. `?page&limit`. Excludes `password`, `passwordResetToken`, `passwordResetExpiry`. |

### Products
| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/products` | All products including blocked. Paginated `?page&limit`. |
| POST | `/admin/products` | Create product (Cloudinary upload via `upload.single('image')`). |
| POST | `/admin/bulk-products` | Bulk create products (no image upload). |
| PUT | `/admin/products/:id` | Update product fields + optional image re-upload. |
| PATCH | `/admin/products/:id/status` | Body: `{ isBlocked: true/false }`. Toggle product block state. |
| DELETE | `/admin/products/:id` | Hard delete product. |

### Categories
| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/categories` | All categories including blocked. |
| POST | `/admin/categories` | Create category. |
| PUT | `/admin/categories/:id` | Update name/icon. |
| PATCH | `/admin/categories/:id/status` | Body: `{ isBlocked: true/false }`. On block: all products with this `categoryId` are also set `isBlocked: true` in same transaction. On unblock: category is unblocked but products are NOT auto-unblocked. |
| DELETE | `/admin/categories/:id` | Returns `405 Method Not Allowed` with `"Categories cannot be deleted."` |

**Important**: The existing `DELETE /categories/:id` route in `categoriesRoutes.js` is replaced with a handler that returns 405.

### Orders
| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/orders` | All orders across all users. Paginated `?page&limit`. Optional `?search=` matches against `orderNumber` (exact) or customer `email` (LIKE). Returns: orderNumber, email, firstName, lastName, totalAmount, status, createdAt. |
| GET | `/admin/orders/:orderNumber` | Full order detail: items, product names/images, subtotal, discounts, delivery slot, address. |
| PATCH | `/admin/orders/:orderNumber/status` | Body: `{ status }`. Strict forward-only transitions (see below). Sends a Notification to the order's userId on success. |

**Order status transition rules (strict forward-only):**

| Current status | Allowed next statuses |
|---|---|
| `pending` | `dispatched`, `cancelled` |
| `dispatched` | `delivered` |
| `delivered` | _(none — terminal)_ |
| `cancelled` | _(none — terminal)_ |

Any other transition returns `400` with a descriptive error message.

### Coupons
| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/coupons` | List all coupons (active and inactive). |
| POST | `/admin/coupons` | Create coupon. Body: `{ couponCode, discountAmount, expiresAt, isActive }`. |
| PATCH | `/admin/coupons/:code` | Update coupon fields. |
| DELETE | `/admin/coupons/:code` | Hard delete coupon. |

**Note**: `POST /coupons` in `couponRoutes.js` currently has `isAdmin` commented out — this is a bug. It is fixed by removing the route entirely (admin creates coupons via `/admin/coupons`).

### Dashboard
| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/stats` | Returns: `{ totalUsers, totalProducts, totalCategories, totalOrders, pendingOrders, totalRevenue }`. `totalRevenue` = `SUM(totalAmount)` on non-cancelled orders. |

### Reviews
| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/reviews` | Paginated list. Includes product name and reviewer firstName/lastName. `?page&limit`. |
| DELETE | `/admin/reviews/:id` | Hard delete review. |

### Support Forms
| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/support-forms` | Paginated list of all contact support submissions. `?page&limit`. |

---

## Public Route Filtering

The following existing public controllers gain `isBlocked: false` in their Sequelize `where` clause:

| Controller function | Change |
|---|---|
| `getAllProducts` | Add `isBlocked: false` to `whereClause` |
| `getSingleProduct` | After `findByPk`, if `product.isBlocked` return `404 Product not found` |
| `bestSelling` | Add `isBlocked: false` to Product `include.where` |
| `getAllCategories` (public) | Add `{ where: { isBlocked: false } }` |

---

## Implementation Notes

- All pagination defaults: `page=1`, `limit=10`, max enforced at `50`.
- Admin order list and user list response should never include `password` or token fields.
- Category status cascade uses a Sequelize transaction: update category `isBlocked`, then `Product.update({ isBlocked: true }, { where: { categoryId: id }, transaction })`.
- The `changeOrderStatus` function in `orderControllers.js` (currently used by `PATCH /orders/status/:orderNumber`) is **replaced** by the new admin version at `PATCH /admin/orders/:orderNumber/status`. The old route is removed from `orderRoutes.js`.
- Coupon `DELETE` does a hard delete — no soft delete or archiving.
- `GET /admin/stats` uses `Promise.all` for parallel count queries.

---

## Files to Create/Modify

| File | Action |
|---|---|
| `src/controllers/adminController.js` | Expand with all admin functions |
| `src/routes/adminRoute.js` | Expand with all admin routes |
| `src/models/productModel.js` | Add `isBlocked` field |
| `src/models/categoriesModel.js` | Add `isBlocked` field |
| `src/migrations/runMigration.js` | Add migration for new columns |
| `src/controllers/productController.js` | Add `isBlocked: false` filters to public functions |
| `src/controllers/categoryController.js` | Add `isBlocked: false` filter; replace delete with 405 |
| `src/routes/productsRoutes.js` | Remove admin-only routes |
| `src/routes/categoriesRoutes.js` | Remove admin-only routes; replace delete with 405 |
| `src/routes/couponRoutes.js` | Remove all routes (moved to admin) |
| `src/routes/orderRoutes.js` | Remove `PATCH /orders/status/:orderNumber` |
| `CLAUDE.md` | Document admin panel module |
