# Email Verification on Registration

**Date:** 2026-05-15
**Status:** Approved

## Overview

Add OTP-based email verification to the registration and login flows. New users must verify their email before they can log in. Unverified users who attempt login receive a fresh OTP automatically. Successful verification returns a JWT so the user does not need to log in again.

## Database Change

Add one column to the `users` table:

```sql
ALTER TABLE users ADD COLUMN isEmailVerified BOOLEAN NOT NULL DEFAULT false;
```

Reuse existing `passwordResetToken` (VARCHAR) and `passwordResetExpiry` (DATE) columns for the email verification OTP. These fields are always null on a newly registered user, so there is no conflict. After verification they are cleared, identical to the password-reset flow.

Add `isEmailVerified` to `userModel.js`:

```js
isEmailVerified: {
  type: DataTypes.BOOLEAN,
  defaultValue: false,
  allowNull: false,
}
```

## OTP Mechanism

Identical to `forgotPassword`:
- 4-digit code (`String(1234)` hardcoded — matching existing pattern)
- SHA256 hashed before storage
- 10-minute expiry window
- Email sending commented out (console.log in dev), ready for SendGrid when enabled

## Flow: Registration (`POST /register`)

1. Validate input and create user as normal
2. Generate OTP → hash → save to `passwordResetToken` / `passwordResetExpiry`
3. Log OTP in dev (same as forgotPassword)
4. Return `201`:
   ```json
   { "status": "success", "message": "Registration successful. Please verify your email." }
   ```

## Flow: Login (`POST /login`)

After password check passes, before issuing JWT:

1. If `user.isEmailVerified === false`:
   - Generate fresh OTP → hash → save token + expiry
   - Log OTP in dev
   - Return `403`:
     ```json
     { "status": "fail", "message": "Email not verified. A new OTP has been sent to your email." }
     ```
2. If `user.isEmailVerified === true` → issue JWT as normal (no change)

## Flow: Verify Email (`POST /auth/verifyEmail`) — new endpoint

**Request body:** `{ email, otp }`

**Steps:**
1. Validate `email` and `otp` present
2. Hash OTP with SHA256
3. Find user where `email` matches AND `passwordResetToken` = hash AND `passwordResetExpiry > now`
4. If not found → `400 { status: 'fail', message: 'Invalid OTP or OTP expired!' }`
5. If found:
   - Set `isEmailVerified = true`
   - Clear `passwordResetToken = null`, `passwordResetExpiry = null`
   - Save user
   - Issue JWT with payload `{ id, email, role }` and `JWT_EXPIRY`
   - Return `200`:
     ```json
     {
       "status": "success",
       "message": "Email verified successfully!",
       "data": { "firstName": "...", "lastName": "...", "token": "..." }
     }
     ```

## Files Changed

| File | Change |
|---|---|
| `src/models/userModel.js` | Add `isEmailVerified` field |
| `src/controllers/authController.js` | Update `register`, `login`; add `verifyEmail` |
| `src/routes/authRoutes.js` | Add `POST /auth/verifyEmail` route |
| `CLAUDE.md` | Document new flow |
| DB migration | `ALTER TABLE users ADD COLUMN isEmailVerified BOOLEAN NOT NULL DEFAULT false` |

## Out of Scope

- Admin bypass of email verification
- Resend OTP as a standalone endpoint (login handles resend implicitly)
- Rate limiting on OTP attempts
