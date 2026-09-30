# Authentication & Authorization

## Overview

PRMCF uses phone-number and password login for both registered members and external staff. Members authenticate against `members`; external staff authenticate against `users`. On success, a signed JWT and a refresh-token session are issued and stored in `localStorage`.

Access to routes is fully configurable through the **Auth Control** admin panel, which reads from the `route_permissions` table at runtime.

---

## Flow

```
Member or staff enters phone number and password
        │
        ▼
POST /api/auth/login
  → Looks up active member and staff accounts by phone
  → Matches password hash and identifies account_type
  → Signs JWT and creates a refresh session for that account
  → Returns { access_token, user }
        │
        ▼
Frontend stores token in localStorage
AuthContext sets isAuthenticated = true
User redirected → /admin (admin type) or /dashboard (others)
```

---

## Database Tables

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
  "account_type": "member",
  "id": 42,
  "member_id": "MEM001",
  "name": "Siva Kumar",
  "phone": "9876543210",
  "user_type_id": 1,
  "type_name": "admin"
}
```

Token is attached as `Authorization: Bearer <token>` on every API request via the axios request interceptor in `frontend-web/src/services/api.js`. A 401 response automatically clears the token and redirects to `/login`. Staff account activity and current user type are rechecked on authenticated requests so deactivation or role changes apply immediately.

### External staff accounts

External staff are stored in `users`, never in `members`. Their `user_type_id` points to the shared `admin` row in `user_types`, so existing role-based admin authorization applies. Member and staff rows may have overlapping numeric IDs; tokens therefore include `account_type` (`member` or `staff`), and sessions store `member_id` or `user_id` with that account kind. Member self-service endpoints reject staff principals rather than interpreting a staff ID as a member ID. Staff accounts are managed from Settings → Staff Users.

---

## Backend Files

### Models

| File | Exports |
|------|---------|
| `backend/src/models/authModel.js` | `findMemberByPhone` |
| `backend/src/models/routePermissionModel.js` | `getAllRoutePermissions`, `createRoutePermission`, `updateRoutePermission`, `deleteRoutePermission` |

### Service

| File | Exports |
|------|---------|
| `backend/src/services/authService.js` | `loginWithPassword(phone, password)`, `refreshSession`, `logout` |

### Controllers & Routes

| Route | Method | Handler | Auth |
|-------|--------|---------|------|
| `/api/auth/login` | POST | `handleLogin` | Public |
| `/api/auth/login-type` | POST | `identifyLoginType` | Public |
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
| `login(phone, password)` | POST to `/auth/login`, stores token + user in `localStorage` |
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
| `loading` | boolean | True while the login request is in-flight |
| `error` | string | Last auth error message |
| `login(phone)` | fn | Logs the member in directly |
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

Single-step UI — enter 10-digit mobile number → "Sign in".

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

## User Types (from `user_types` table)

| ID | Name |
|----|------|
| 1 | admin |
| 2 | member |
| 3 | committee |
| 4 | president |

Use these IDs in `allowed_type_ids` when configuring route permissions.
