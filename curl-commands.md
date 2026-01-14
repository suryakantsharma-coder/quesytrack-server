# API cURL Commands

This file contains cURL commands for testing all server endpoints.

**Base URL:** `http://localhost:4000` (or your configured PORT)

---

## Health Check

### GET /health
Check if the server is running.

```bash
curl -X GET http://localhost:4000/health
```

**Expected Response:**
```json
{
  "status": "OK",
  "message": "Server is running"
}
```

---

## Authentication Endpoints

### POST /api/auth/register
Register a new user.

```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "designation": "Software Engineer",
    "role": "Editor"
  }'
```

**Minimal Request (required fields only):**
```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "password123"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": {
      "id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "designation": "Software Engineer",
      "role": "Editor",
      "createdAt": "...",
      "updatedAt": "..."
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### POST /api/auth/login
Login with email and password.

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "designation": "Software Engineer",
      "role": "Editor",
      "createdAt": "...",
      "updatedAt": "..."
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Note:** Save the `token` from the response to use in protected endpoints.

---

### GET /api/auth/me
Get current authenticated user information.

**Prerequisites:** You need a valid JWT token from login/register.

```bash
curl -X GET http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Example with actual token:**
```bash
curl -X GET http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NzEyMzQ1Njc4OTAxMjMiLCJlbWFpbCI6ImpvaG5AZXhhbXBsZS5jb20iLCJpYXQiOjE3MTIzNDU2NzgsImV4cCI6MTcxMjQzMjA3OH0.example"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "user": {
      "id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "designation": "Software Engineer",
      "role": "Editor",
      "createdAt": "...",
      "updatedAt": "..."
    }
  }
}
```

**Error Response (no token):**
```json
{
  "success": false,
  "error": "No token provided, authorization denied"
}
```

---

## Complete Workflow Example

### Step 1: Register a new user
```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "test123",
    "role": "Admin"
  }'
```

### Step 2: Copy the token from the response and use it to get user info
```bash
# Replace YOUR_TOKEN with the actual token from Step 1
curl -X GET http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Step 3: Login (alternative to get a token)
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123"
  }'
```

---

## Error Responses

All endpoints follow a consistent error format:

```json
{
  "success": false,
  "error": "Error message here"
}
```

**Common Error Scenarios:**

1. **400 Bad Request** - Missing required fields
2. **401 Unauthorized** - Invalid credentials or missing/invalid token
3. **404 Not Found** - Route not found
4. **500 Internal Server Error** - Server error

---

## Notes

- Default server port: `4000` (can be changed via `PORT` environment variable)
- All JSON endpoints require `Content-Type: application/json` header
- Protected endpoints require `Authorization: Bearer <token>` header
- Token format: `Bearer <your-jwt-token>`
- Role options: `Admin`, `Viewer`, `Editor` (default: `Viewer`)
