# API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <access_token>
```

## Response Format

All responses follow this format:

### Success Response (2xx)
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

### Error Response (4xx, 5xx)
```json
{
  "success": false,
  "message": "Error description"
}
```

## Endpoints

### 1. Authentication

#### Register
```
POST /auth/register
Content-Type: application/json

Request:
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "confirmPassword": "SecurePass123"
}

Response (201):
{
  "success": true,
  "message": "Registration successful",
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}

Errors:
- 400: Missing required fields
- 400: Passwords do not match
- 400: Password too short (min 6 characters)
- 409: User already exists
```

#### Login
```
POST /auth/login
Content-Type: application/json

Request:
{
  "email": "john@example.com",
  "password": "SecurePass123"
}

Response (200):
{
  "success": true,
  "message": "Login successful",
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}

Errors:
- 400: Email and password required
- 401: User not found
- 401: Invalid password
```

#### Get Profile
```
GET /auth/profile
Authorization: Bearer <access_token>

Response (200):
{
  "success": true,
  "user": {
    "id": 1,
    "role": "user"
  }
}

Errors:
- 401: No token provided
- 401: Invalid or expired token
```

### 2. Health Check

#### Server Status
```
GET /health

Response (200):
{
  "status": "UP",
  "message": "Server is running"
}
```

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 201 | Created - Resource created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource already exists |
| 500 | Server Error - Internal server error |

## Rate Limiting

Not yet implemented. Recommended for production:
- 100 requests per minute per IP
- 10 requests per minute for login/register endpoints

## Error Handling

All errors follow this format:
```json
{
  "success": false,
  "message": "Error description"
}
```

## Token Management

### Token Expiry
- Default expiry: 7 days
- Configurable via `JWT_EXPIRE` in `.env`

### Refresh Token (Recommended for Production)
Implement a refresh token endpoint:
```
POST /auth/refresh
Authorization: Bearer <refresh_token>

Response:
{
  "success": true,
  "access_token": "new_token"
}
```

## CORS Configuration

Frontend Origin: Configured in backend `.env`
```
CORS_ORIGIN=http://localhost:5173
```

## Pagination (Future Implementation)

```
GET /resource?page=1&limit=20

Response:
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

## Filtering & Sorting (Future Implementation)

```
GET /resource?search=query&sort=-created_at

Response:
{
  "success": true,
  "data": []
}
```

## Testing with cURL

### Register
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123",
    "confirmPassword": "SecurePass123"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123"
  }'
```

### Get Profile
```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Health Check
```bash
curl http://localhost:3000/api/health
```

## Testing with Postman

1. Import the environment variables
2. Use `{{base_url}}` for API base URL
3. Use `{{token}}` for Bearer token
4. Set token in Tests tab:
   ```javascript
   pm.environment.set("token", pm.response.json().access_token);
   ```

## Versioning

Current API Version: v1 (path prefix: `/api`)

For future versions:
```
/api/v2/auth/login
/api/v3/auth/login
```
