# Authentication & Authorization

## Overview

PRMCF uses a **mobile OTP-based login** system. There are no passwords — a registered member enters their phone number, receives an OTP, and logs in. On successful verification a signed JWT is issued and stored in `localStorage`.

Access to routes is fully configurable through the **Auth Control** admin panel, which reads from the `route_permissions` table at runtime.

---

## Flow

```
Member enters phone number
        │
        ▼
POST /api/auth/request-otp
  → Looks up member by phone in members table
  → If found: writes OTP + expiry to otp_sessions table
  → Returns { success: true, message: "OTP sent" }
        │
        ▼
Member enters OTP (hardcoded: 9707 until SMS service integrated)
        │
        ▼
POST /api/auth/verify-otp
  → Validates OTP from otp_sessions (not expired, not used)
  → Marks session as used
  → Signs JWT with member payload
  → Returns { access_token, user }
        │
        ▼
Frontend stores token in localStorage
AuthContext sets isAuthenticated = true
User redirected → /admin (admin type) or /dashboard (others)
```

---

## Database Tables

### `otp_sessions`

Tracks active OTP requests. Each new request for a phone deletes prior sessions for that number.

| Column      | Type           | Notes                              |
|-------------|----------------|------------------------------------|
| id          | INT PK AUTO    |                                    |
| phone       | VARCHAR(15)    | Member's registered phone number   |
| otp         | VARCHAR(10)    | OTP value (currently hardcoded)    |
| expires_at  | TIMESTAMP      | 10 minutes from creation           |
| is_used     | TINYINT(1)     | Marked 1 after successful verify   |
| created_at  | TIMESTAMP      |                                    |

### `route_permissions`

Defines access rules per route. Managed through the Auth Control admin page.

| Column           | Type           | Notes                                           |
|------------------|----------------|-------------------------------------------------|
| id               | INT PK AUTO    |                                                 |
| route_key        | VARCHAR(100)   | Unique slug matching frontend route check       |
| route_label      | VARCHAR(200)   | Display name in Auth Control UI                 |
| description      | VARCHAR(300)   | Optional description                            |
| require_login    | TINYINT(1)     | 1 = must be authenticated                       |
| allowed_type_ids | JSON           | Array of user_type IDs; empty = all logged-in users |
| created_at       | TIMESTAMP      |                                                 |
| updated_at       | TIMESTAMP      |                                                 |

#### Seed data

| route_key | route_label      | require_login | allowed_type_ids |
|-----------|------------------|---------------|------------------|
| admin     | Admin Panel      | 1             | [1]              |
| donate    | Donate Page      | 1             | []               |
| dashboard | Member Dashboard | 1             | []               |

---

## JWT Token

Signed with `JWT_SECRET` from `.env`. Default expiry: `7d`.

### Payload

```json
{
  "id": 42,
  "member_id": "MEM001",
  "name": "Siva Kumar",
  "phone": "9876543210",
  "user_type_id": 1,
  "type_name": "admin"
}
```

Token is attached as `Authorization: Bearer <token>` on every API request via the axios request interceptor in `frontend-web/src/services/api.js`. A 401 response automatically clears the token and redirects to `/login`.

---

## Backend Files

### Models

| File | Exports |
|------|---------|
| `backend/src/models/authModel.js` | `findMemberByPhone`, `createOtpSession`, `validateAndConsumeOtp` |
| `backend/src/models/routePermissionModel.js` | `getAllRoutePermissions`, `createRoutePermission`, `updateRoutePermission`, `deleteRoutePermission` |

### Service

| File | Exports |
|------|---------|
| `backend/src/services/authService.js` | `requestOtp(phone)`, `verifyOtp(phone, otp)` |

`HARDCODED_OTP` is defined as a constant in `authService.js`. Replace with a real SMS provider (e.g. Twilio, MSG91) when ready.

### Controllers & Routes

| Route | Method | Handler | Auth |
|-------|--------|---------|------|
| `/api/auth/request-otp` | POST | `handleRequestOtp` | Public |
| `/api/auth/verify-otp` | POST | `handleVerifyOtp` | Public |
| `/api/auth/profile` | GET | `profile` | JWT required |
| `/api/route-permissions` | GET | `getAll` | Public |
| `/api/route-permissions` | POST | `create` | JWT required |
| `/api/route-permissions/:id` | PUT | `update` | JWT required |
| `/api/route-permissions/:id` | DELETE | `destroy` | JWT required |

### Middleware

**`backend/src/middleware/authMiddleware.js`**

```js
// Verifies Bearer JWT and attaches decoded payload to req.user
authMiddleware

// Checks req.user.user_type_id is in the provided list
requireTypes(...typeIds)
```

Usage example:
```js
router.delete('/:id', authMiddleware, requireTypes(1), destroy);
```

---

## Frontend Files

### Services

**`frontend-web/src/services/authService.js`**

| Method | Description |
|--------|-------------|
| `requestOtp(phone)` | POST to `/auth/request-otp` |
| `verifyOtp(phone, otp)` | POST to `/auth/verify-otp`, stores token + user in `localStorage` |
| `logout()` | Clears `localStorage` |
| `getCurrentUser()` | Returns parsed user object from `localStorage` |
| `getToken()` | Returns raw JWT string |
| `isAuthenticated()` | Returns `true` if token exists |

### Context

**`frontend-web/src/context/AuthContext.jsx`**

Provides to the entire app via `AuthProvider`:

| Value | Type | Description |
|-------|------|-------------|
| `user` | object | Decoded member info from JWT |
| `isAuthenticated` | boolean | Whether a valid session exists |
| `routePermissions` | array | Loaded from `/api/route-permissions` on mount |
| `loading` | boolean | True while OTP requests are in-flight |
| `error` | string | Last auth error message |
| `requestOtp(phone)` | fn | Step 1 of login |
| `verifyOtp(phone, otp)` | fn | Step 2 of login |
| `logout()` | fn | Clears session |
| `canAccess(routeKey)` | fn | Returns true if current user can access the route |

**`canAccess(routeKey)` logic:**
1. Find the permission row matching `routeKey`
2. If not found → allow (no restriction)
3. If `require_login` and not authenticated → deny
4. If `allowed_type_ids` is non-empty → check `user.user_type_id` is in the list
5. Otherwise → allow

### Pages

**`frontend-web/src/pages/auth/LoginPage.jsx`**

Two-step UI:
- **Step 1 (phone)** — enter 10-digit mobile number → "Get OTP"
- **Step 2 (otp)** — enter OTP → "Verify OTP" — "Change number" link to go back

On success, navigates to `/admin` for admin users, `/dashboard` for all others.

**`frontend-web/src/pages/admin/AuthControl.jsx`**

Full CRUD table for `route_permissions`:
- Table: Route Key | Label | Description | Login Required | Allowed Types | Actions
- **Add** — modal with all fields
- **Edit** — modal pre-filled; route_key is read-only after creation
- **Delete** — confirmation modal

### Route Protection

**`frontend-web/src/routes/AppRoutes.jsx`**

```jsx
<ProtectedRoute routeKey="admin">
  <AdminLayout />
</ProtectedRoute>
```

`ProtectedRoute` calls `canAccess(routeKey)`. If denied:
- Not authenticated → redirect to `/login`
- Authenticated but wrong type → redirect to `/`

Current protected routes:

| Path | Route Key |
|------|-----------|
| `/admin/*` | `admin` |
| `/dashboard` | `dashboard` |
| `/donate` | `donate` |

---

## OTP — Current State & Upgrade Path

| Phase | OTP Source |
|-------|-----------|
| **Now** | Hardcoded `9707` in `authService.js` |
| **Next** | Integrate SMS provider (MSG91, Twilio, Fast2SMS) |

To upgrade:
1. In `backend/src/services/authService.js`, replace `HARDCODED_OTP` with a random 6-digit generator
2. Pass the generated OTP to `createOtpSession(phone, otp)`
3. Send the OTP via SMS API before returning the response
4. No other code changes needed — validation flow stays the same

---

## User Types (from `user_types` table)

| ID | Name |
|----|------|
| 1 | admin |
| 2 | member |
| 3 | committee |
| 4 | president |

Use these IDs in `allowed_type_ids` when configuring route permissions.
