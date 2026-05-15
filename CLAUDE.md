# Ami's Choice — Backend Context

## Project Overview
Express.js + Sequelize ORM e-commerce backend. REST API with 41 endpoints across 10 service modules. Deployed on Vercel.

## Stack
- **Runtime**: Node.js / Express
- **ORM**: Sequelize (MySQL)
- **Auth**: JWT (access token via `verifyToken` middleware, role check via `isAdmin`)
- **Storage**: Cloudinary (product images, 500x500 auto-transform)
- **Email**: SendGrid (OTP password reset)
- **Validation**: Joi schemas at API boundaries
- **Logging**: Custom color-coded HTTP logger middleware

## Key Architecture Decisions
- All IDs are UUIDs
- 11 models, 16 associations defined in `src/associations.js` (loaded in `app.js` — **not** `src/models/index.js`, which is export-only)
- Discount prices computed via Sequelize model hooks (not stored raw)
- Coupon single-use enforced via `CouponUsage` join table
- Delivery slots auto-expire based on cutoff time windows
- OTP reset: SHA256 hash + 10-minute expiry window
- Password excluded from queries via model scope

## Route Structure (`src/routes/`)
All routes mounted under `/api/v1`:
- `authRoutes` — register, login, OTP reset, verifyEmail
- `cartRoutes` — cart CRUD + preview (all behind `verifyToken`)
- `orderRoutes` — checkout, order history
- `productRoutes` — browse, filter, paginate
- `categoryRoutes`, `couponRoutes`, `reviewRoutes`, `userRoutes`, `deliverySlotsRoutes`, `adminRoutes`

## Cart Implementation (current)
- `POST /api/v1/cart` — adds one product at a time (`productId`, `quantity`)
- Already handles merge: if product exists in cart, quantity is summed (with stock cap check)
- All cart routes are behind `verifyToken` — no guest access
- `addToCart` delegates to `getCartWithTotals` for cart summary calculations (same as `getCart` and `cartPreview`) — no N+1 loop

**`addToCart` response shape:**
```json
{
  "data": { "productId", "quantity", "itemTotalPrice", "discount" },
  "cartSummary": { "totalValue", "totalDiscount", "totalPayable" }
}
```
- `totalValue` = original price subtotal (before discounts)
- `totalDiscount` = total product discount amount
- `totalPayable` = amount payable (after product discounts, before coupon)

## Planned Feature: Guest Cart Sync
**Context** (discussed 2026-05-12):
- Guest users browse and add to cart entirely on the frontend (local state / localStorage)
- On checkout attempt, frontend redirects guest to login
- After login, frontend sends the guest cart to the backend to merge into the user's server-side cart
- Merge rule: if product already in user's cart → add quantities (respect stock cap); otherwise create new cart item
- After sync, user proceeds through the existing checkout flow unchanged

**Decision**: Add a new `POST /api/v1/cart/bulk` endpoint rather than calling the existing single-add endpoint N times.
- Accepts `[{ productId, quantity }]` array
- Wraps all inserts/updates in a single Sequelize transaction
- Returns merged cart summary in one round trip
- Avoids the N×full-cart-recalculation cost of looping the existing endpoint

## Models of Note
- `Cart` — `userId`, `productId`, `productQuantity`
- `Product` — `price`, `discountPrice` (hook-computed), `stockQuantity`, `isInStock`
- `Order` / `OrderItem` — created at checkout, stock decremented transactionally; `cancelReason` (TEXT, nullable) stored on cancellation
- `CouponUsage` — enforces one-time coupon use per user
- `Notification` — `id` (UUID), `userId` (UUID FK), `title`, `body`, `isRead` (bool, default false), timestamps

## Notification Module (added 2026-05-15)
Routes under `/api/v1/notifications`, all behind `verifyToken`:
- `GET /notifications` — paginated list (`?page=&limit=`, default 10/page, max 50)
- `GET /notifications/unread-count` — returns count of unread notifications
- `GET /notifications/:id` — fetch single notification + auto-marks it as read
- `PATCH /notifications/read-all` — marks all user notifications as read

**Association pattern**: defined in `src/associations.js` (`User.hasMany Notification`, `Notification.belongsTo User`, both with `as: 'notifications'`/`'user'`).
**Important**: `src/models/index.js` is export-only — never define associations there.

**Notification triggers in `orderControllers.js`** (all create a `Notification` row after the status change):
- `checkOut` — "Order Placed" after transaction commit (initial pending status)
- `changeOrderStatus` — "Order Status Updated" after the save loop (admin-driven)
- `cancelOrder` — "Order Cancelled" after save (user-driven); accepts optional `cancelReason` in request body, saved to `orders.cancelReason`

## Email Verification Flow (added 2026-05-15)

New users must verify their email before logging in. The OTP mechanism reuses `passwordResetToken`/`passwordResetExpiry` columns.

**Registration**: Creates user with `isEmailVerified: false`, generates OTP, saves hashed token (10-min expiry), logs OTP to console in dev.

**Login gate**: If `isEmailVerified === false` → regenerates OTP, saves token, returns `403` with message. Proceeds to JWT only if verified.

**New endpoint** `POST /auth/verifyEmail`:
- Body: `{ email, otp }`
- Verifies SHA256-hashed OTP against stored token and expiry
- On success: sets `isEmailVerified = true`, clears token fields, returns JWT + firstName + lastName
- On failure: `400 Invalid OTP or OTP expired!`

**User model field**: `isEmailVerified` (BOOLEAN, NOT NULL, default `false`)

## File Locations
- Controllers: `src/controllers/`
- Routes: `src/routes/`
- Models: `src/models/`
- Middleware: `src/middleware/` (`verifyToken.js`, `isAdmin.js`, `logger.js`)
- Utils: `src/utils/` (`couponValidator.js`, `deliverySlotResolver.js`, `emailSender.js`)
- Validation: `src/validation/` (Joi schemas)
- Config: `src/config/` (Cloudinary, DB)
