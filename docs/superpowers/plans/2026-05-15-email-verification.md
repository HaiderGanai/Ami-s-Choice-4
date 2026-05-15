# Email Verification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Require new users to verify their email via OTP before they can log in, and return a JWT on successful verification.

**Architecture:** Reuse the existing `passwordResetToken`/`passwordResetExpiry` columns on the `users` table to store the email verification OTP. Add a single `isEmailVerified` boolean column. Three touch points: `register` (send OTP), `login` (gate on verified + resend OTP), and a new `verifyEmail` endpoint (verify OTP → mark verified → return JWT).

**Tech Stack:** Node.js, Express, Sequelize (MySQL), bcryptjs, jsonwebtoken, crypto (built-in)

---

## File Map

| File | Action |
|---|---|
| `src/models/userModel.js` | Add `isEmailVerified` field |
| `src/controllers/authController.js` | Update `register`, update `login`, add `verifyEmail` |
| `src/routes/authRoutes.js` | Register `POST /auth/verifyEmail` route |
| `CLAUDE.md` | Document email verification flow |

---

## Task 1: Add `isEmailVerified` to User model

**Files:**
- Modify: `src/models/userModel.js`

- [ ] **Step 1: Add the field to the model**

In `src/models/userModel.js`, add the `isEmailVerified` field inside the column definitions object (after `passwordResetExpiry`):

```js
passwordResetExpiry: {
  type: DataTypes.DATE,
  allowNull: true,
},
isEmailVerified: {
  type: DataTypes.BOOLEAN,
  defaultValue: false,
  allowNull: false,
},
```

- [ ] **Step 2: Run the database migration**

Connect to your MySQL database and execute:

```sql
ALTER TABLE users ADD COLUMN isEmailVerified BOOLEAN NOT NULL DEFAULT false;
```

Verify the column was added:

```sql
DESCRIBE users;
```

Expected: `isEmailVerified` appears in the output with `Type: tinyint(1)`, `Null: NO`, `Default: 0`.

- [ ] **Step 3: Commit**

```bash
git add src/models/userModel.js
git commit -m "feat: add isEmailVerified field to User model"
```

---

## Task 2: Update `register` to send a verification OTP

**Files:**
- Modify: `src/controllers/authController.js`

The goal: after creating the user, generate an OTP, save it hashed to `passwordResetToken`/`passwordResetExpiry`, and log it (same pattern as `forgotPassword`). Return a message telling the user to verify their email instead of a generic success.

- [ ] **Step 1: Replace the success block in `register`**

Find the current success block in `register` (after `User.create(...)`):

```js
console.log("New Register Request")
res.status(201).json({
    status: 'success',
    data: {
        firstName,
        lastName,
        email,
        phone,
        address
    }
});
```

Replace it with:

```js
const verifyCode = String(1234);
const hashedVerifyToken = crypto.createHash('sha256').update(verifyCode).digest('hex');
newUser.passwordResetToken = hashedVerifyToken;
newUser.passwordResetExpiry = Date.now() + 10 * 60 * 1000;
await newUser.save();

if (process.env.NODE_ENV !== 'production') {
    console.log(`📧 Email verification OTP for ${email}: ${verifyCode}`);
}

res.status(201).json({
    status: 'success',
    message: 'Registration successful. Please verify your email.',
    data: {
        firstName,
        lastName,
        email,
        phone,
        address
    }
});
```

- [ ] **Step 2: Test registration with curl**

Make sure the server is running (`node src/server.js` on port 3000), then:

```bash
curl -s -X POST http://localhost:3000/api/v1/register \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Test","lastName":"User","email":"test@example.com","password":"Pass1234!","passwordConfirm":"Pass1234!"}' | jq .
```

Expected response:
```json
{
  "status": "success",
  "message": "Registration successful. Please verify your email.",
  "data": { "firstName": "Test", "lastName": "User", "email": "test@example.com", ... }
}
```

Expected server console output:
```
📧 Email verification OTP for test@example.com: 1234
```

- [ ] **Step 3: Commit**

```bash
git add src/controllers/authController.js
git commit -m "feat: send email verification OTP on registration"
```

---

## Task 3: Gate `login` on `isEmailVerified`

**Files:**
- Modify: `src/controllers/authController.js`

The goal: after the password check passes, if `isEmailVerified` is false, generate a fresh OTP, save it, log it, and return `403`. Only issue the JWT if the email is verified.

- [ ] **Step 1: Add the email verification gate to `login`**

In the `login` function, find the block that starts after the password match check and generates the JWT:

```js
//generate JWT token
const token = jwt.sign(
    { id: userExixts.id,
      email: userExixts.email,
      role: userExixts.role,  
     },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRY}
);

let firstName = userExixts.firstName;
let lastName = userExixts.lastName;
return res.status(200).json({
    status: 'success',
    data: {
        firstName,
        lastName,
        token
    }
});
```

Replace it with:

```js
if (!userExixts.isEmailVerified) {
    const verifyCode = String(1234);
    const hashedVerifyToken = crypto.createHash('sha256').update(verifyCode).digest('hex');
    userExixts.passwordResetToken = hashedVerifyToken;
    userExixts.passwordResetExpiry = Date.now() + 10 * 60 * 1000;
    await userExixts.save();

    if (process.env.NODE_ENV !== 'production') {
        console.log(`📧 Email verification OTP for ${userExixts.email}: ${verifyCode}`);
    }

    return res.status(403).json({
        status: 'fail',
        message: 'Email not verified. A new OTP has been sent to your email.'
    });
}

//generate JWT token
const token = jwt.sign(
    { id: userExixts.id,
      email: userExixts.email,
      role: userExixts.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRY }
);

let firstName = userExixts.firstName;
let lastName = userExixts.lastName;
return res.status(200).json({
    status: 'success',
    data: {
        firstName,
        lastName,
        token
    }
});
```

- [ ] **Step 2: Test login with unverified user**

Using the test user registered in Task 2 (email not yet verified):

```bash
curl -s -X POST http://localhost:3000/api/v1/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Pass1234!"}' | jq .
```

Expected response (HTTP 403):
```json
{
  "status": "fail",
  "message": "Email not verified. A new OTP has been sent to your email."
}
```

Expected server console output:
```
📧 Email verification OTP for test@example.com: 1234
```

- [ ] **Step 3: Commit**

```bash
git add src/controllers/authController.js
git commit -m "feat: block login for unverified emails, resend OTP automatically"
```

---

## Task 4: Add `verifyEmail` controller and route

**Files:**
- Modify: `src/controllers/authController.js`
- Modify: `src/routes/authRoutes.js`

The goal: new endpoint `POST /auth/verifyEmail` that takes `{ email, otp }`, verifies the hashed OTP, marks the user as verified, clears the token fields, and returns a JWT + user data.

- [ ] **Step 1: Add `verifyEmail` function to the controller**

In `src/controllers/authController.js`, add the following function before the `module.exports` line:

```js
const verifyEmail = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email) {
            return res.status(400).json({
                status: 'fail',
                message: 'Email is required.'
            });
        }

        if (!otp) {
            return res.status(400).json({
                status: 'fail',
                message: 'OTP is required.'
            });
        }

        const hashedToken = crypto.createHash('sha256').update(String(otp)).digest('hex');

        const user = await User.findOne({
            where: {
                email,
                passwordResetToken: hashedToken,
                passwordResetExpiry: { [Op.gt]: Date.now() }
            }
        });

        if (!user) {
            return res.status(400).json({
                status: 'fail',
                message: 'Invalid OTP or OTP expired!'
            });
        }

        user.isEmailVerified = true;
        user.passwordResetToken = null;
        user.passwordResetExpiry = null;
        await user.save();

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRY }
        );

        console.log('Verify Email API hit!');

        return res.status(200).json({
            status: 'success',
            message: 'Email verified successfully!',
            data: {
                firstName: user.firstName,
                lastName: user.lastName,
                token
            }
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status: 'fail',
            message: 'Internal Server Error!'
        });
    }
};
```

- [ ] **Step 2: Export `verifyEmail`**

Find the `module.exports` line at the bottom of `authController.js`:

```js
module.exports = { register, login, forgotPassword, verifyOtp, resetPassword, logout };
```

Replace it with:

```js
module.exports = { register, login, forgotPassword, verifyOtp, resetPassword, logout, verifyEmail };
```

- [ ] **Step 3: Register the route**

In `src/routes/authRoutes.js`, add the import and route.

Find:

```js
const { register, login, forgotPassword, resetPassword, verifyOtp, logout } = require('../controllers/authController');
```

Replace with:

```js
const { register, login, forgotPassword, resetPassword, verifyOtp, logout, verifyEmail } = require('../controllers/authController');
```

Then add the new route after the existing `verifyOtp` route:

```js
authRouter.post('/auth/verifyOtp', verifyOtp);
authRouter.post('/auth/verifyEmail', verifyEmail);
```

- [ ] **Step 4: Test the full registration → verify → login flow**

**4a. Register a new user** (use a fresh email to avoid conflict with Task 2 user):

```bash
curl -s -X POST http://localhost:3000/api/v1/register \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Jane","lastName":"Doe","email":"jane@example.com","password":"Pass1234!","passwordConfirm":"Pass1234!"}' | jq .
```

Expected: `201` with `"message": "Registration successful. Please verify your email."` and OTP `1234` logged to console.

**4b. Verify the email OTP:**

```bash
curl -s -X POST http://localhost:3000/api/v1/auth/verifyEmail \
  -H "Content-Type: application/json" \
  -d '{"email":"jane@example.com","otp":"1234"}' | jq .
```

Expected response (HTTP 200):
```json
{
  "status": "success",
  "message": "Email verified successfully!",
  "data": {
    "firstName": "Jane",
    "lastName": "Doe",
    "token": "<jwt>"
  }
}
```

**4c. Confirm login now works for the verified user:**

```bash
curl -s -X POST http://localhost:3000/api/v1/login \
  -H "Content-Type: application/json" \
  -d '{"email":"jane@example.com","password":"Pass1234!"}' | jq .
```

Expected: `200` with `token` in data.

**4d. Confirm expired OTP returns an error** (wait 10 minutes or manually set `passwordResetExpiry` to a past date in the DB, then call `verifyEmail` again):

```bash
curl -s -X POST http://localhost:3000/api/v1/auth/verifyEmail \
  -H "Content-Type: application/json" \
  -d '{"email":"jane@example.com","otp":"1234"}' | jq .
```

Expected: `400` with `"message": "Invalid OTP or OTP expired!"` (token was cleared after successful verification).

- [ ] **Step 5: Commit**

```bash
git add src/controllers/authController.js src/routes/authRoutes.js
git commit -m "feat: add verifyEmail endpoint — verifies OTP and returns JWT"
```

---

## Task 5: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Add email verification section to Auth documentation**

In `CLAUDE.md`, find the `## Route Structure` section. Under the `authRoutes` bullet, add a note about the new route. Then add a new `## Email Verification Flow` section after the existing auth content:

```markdown
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
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: document email verification flow in CLAUDE.md"
```

---

## Self-Review Checklist

- [x] **Spec coverage**: Registration sends OTP ✓, Login gates on `isEmailVerified` ✓, Login resends OTP if unverified ✓, `verifyEmail` endpoint verifies OTP ✓, `verifyEmail` returns JWT ✓, `isEmailVerified` model field ✓, DB migration ✓, CLAUDE.md updated ✓
- [x] **No placeholders**: All steps contain actual code. No TBDs.
- [x] **Type consistency**: `verifyEmail` is exported and imported by the same name. `Op` is already imported in the controller (`const { Op, where } = require("sequelize")`). `crypto`, `jwt`, `User` already imported at top of controller.
