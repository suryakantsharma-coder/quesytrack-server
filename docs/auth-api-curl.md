# Auth API – cURL Examples

**Base URL:** `http://localhost:4000` (or your `PORT`)

Only **GET /api/auth/me** requires a Bearer token. Register, login, and check-token do not.

---

## 1. Register

**POST /api/auth/register**

**Required:** `name`, `email`, `password`  
**Optional:** `designation`, `role` (default: `Viewer`)

```bash
curl -s -X POST "http://localhost:4000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "SecurePass123!",
    "designation": "Engineer",
    "role": "Editor"
  }'
```

**Minimal:**
```bash
curl -s -X POST "http://localhost:4000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"name": "Jane Doe", "email": "jane@example.com", "password": "SecurePass123!"}'
```

**Expected response (201):**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": {
      "id": "...",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "designation": "Engineer",
      "role": "Editor",
      "createdAt": "...",
      "updatedAt": "..."
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Error (400):**
- Missing fields: `"Please provide name, email, and password"`
- Email exists: `"User with this email already exists"`

---

## 2. Login

**POST /api/auth/login**

**Required:** `email`, `password`

Token payload includes `userId`, `email`, and `company` (if user has a company) for company-scoped APIs.

```bash
curl -s -X POST "http://localhost:4000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "jane@example.com", "password": "SecurePass123!"}'
```

**Save token to variable:**
```bash
export TOKEN=$(curl -s -X POST "http://localhost:4000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"jane@example.com","password":"SecurePass123!"}' | jq -r '.data.token')
```

**Expected response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "...",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "designation": "Engineer",
      "role": "Editor",
      "createdAt": "...",
      "updatedAt": "..."
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Error (400):** `"Please provide email and password"`  
**Error (401):** `"Invalid email or password"`

---

## 3. Check token

**POST /api/auth/check-token**

**Required (body):** `token`

```bash
curl -s -X POST "http://localhost:4000/api/auth/check-token" \
  -H "Content-Type: application/json" \
  -d "{\"token\": \"$TOKEN\"}"
```

**Expected response (200):**
```json
{
  "success": true,
  "message": "Token is valid",
  "data": {
    "token": {
      "userId": "...",
      "email": "jane@example.com",
      "company": "..." or null,
      "iat": 1234567890,
      "exp": 1234567890
    }
  }
}
```

**Error (400):** `"Token is required"`  
**Error (401):** `"Invalid token"` (expired or invalid JWT)

---

## 4. Get current user (me)

**GET /api/auth/me**

Requires **Authorization: Bearer &lt;token&gt;**.

```bash
curl -s -X GET "http://localhost:4000/api/auth/me" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json"
```

**Expected response (200):**
```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "user": {
      "id": "...",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "designation": "Engineer",
      "role": "Editor",
      "createdAt": "...",
      "updatedAt": "..."
    }
  }
}
```

**Error (401):** No token or invalid/expired token.

---

## Summary

| Method | Endpoint              | Auth  | Description        |
|--------|------------------------|-------|--------------------|
| POST   | /api/auth/register     | No    | Register new user  |
| POST   | /api/auth/login        | No    | Login, get token   |
| POST   | /api/auth/check-token  | No    | Validate token     |
| GET    | /api/auth/me           | Bearer| Current user       |
