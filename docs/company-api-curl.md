# Company API – cURL Examples

**Base URL:** `http://localhost:4000` (or your `PORT`)

All endpoints require authentication. Use the token from login in the `Authorization` header:

```bash
export TOKEN="your-jwt-token-here"
```

**Access rules:**
- **Create company:** Any authenticated user can create a company.
- **List / Get / Update / Delete:** User must be assigned to a company (`req.user.company`). List returns only the user’s company. Get/Update/Delete require the resource’s `company` to match the user’s company.

---

## 1. Create company

**POST /api/companies**

**Required:** `name`, `address`, `phoneNumber`, `email`  
**Optional:** `website`

```bash
curl -s -X POST "http://localhost:4000/api/companies" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme Labs",
    "address": "123 Industrial Ave, City 400001",
    "website": "https://acmelabs.example.com",
    "phoneNumber": "+91-9876543210",
    "email": "contact@acmelabs.example.com"
  }'
```

**Minimal (no website):**
```bash
curl -s -X POST "http://localhost:4000/api/companies" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Beta Corp",
    "address": "456 Tech Park",
    "phoneNumber": "+91-9123456789",
    "email": "info@betacorp.example.com"
  }'
```

**Expected response (201):**
```json
{
  "success": true,
  "message": "Company created successfully",
  "data": {
    "company": {
      "_id": "...",
      "companyID": "COMP-123456",
      "name": "Acme Labs",
      "address": "123 Industrial Ave, City 400001",
      "website": "https://acmelabs.example.com",
      "phoneNumber": "+91-9876543210",
      "email": "contact@acmelabs.example.com",
      "createdAt": "...",
      "updatedAt": "..."
    }
  }
}
```

**Error (400 – missing required fields):**
```json
{
  "success": false,
  "error": "Name, address, phone number and email are required"
}
```

---

## 2. List companies (user’s company only)

**GET /api/companies**

Returns only the company assigned to the logged-in user. If the user has no company, returns **403**.

```bash
curl -s -X GET "http://localhost:4000/api/companies" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json"
```

**Expected response (200):**
```json
{
  "success": true,
  "message": "Companies retrieved successfully",
  "data": {
    "companies": [
      {
        "_id": "...",
        "companyID": "COMP-123456",
        "name": "Acme Labs",
        "address": "123 Industrial Ave",
        "website": "https://acmelabs.example.com",
        "phoneNumber": "+91-9876543210",
        "email": "contact@acmelabs.example.com",
        "createdAt": "...",
        "updatedAt": "..."
      }
    ]
  }
}
```

**Error (403 – user not assigned to a company):**
```json
{
  "success": false,
  "error": "User must be assigned to a company"
}
```

---

## 3. Get company by ID

**GET /api/companies/:id**

`id` is the MongoDB `_id` of the company. User must belong to that company.

```bash
export COMPANY_ID="your-company-mongodb-id"

curl -s -X GET "http://localhost:4000/api/companies/$COMPANY_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json"
```

**Expected response (200):**
```json
{
  "success": true,
  "message": "Company retrieved successfully",
  "data": {
    "company": {
      "_id": "...",
      "companyID": "COMP-123456",
      "name": "Acme Labs",
      "address": "123 Industrial Ave",
      "website": "https://acmelabs.example.com",
      "phoneNumber": "+91-9876543210",
      "email": "contact@acmelabs.example.com",
      "createdAt": "...",
      "updatedAt": "..."
    }
  }
}
```

**Error (400 – invalid ID):**
```json
{
  "success": false,
  "error": "Invalid company ID"
}
```

**Error (403):**
```json
{
  "success": false,
  "error": "Access denied to this company"
}
```

**Error (404):**
```json
{
  "success": false,
  "error": "Company not found"
}
```

---

## 4. Update company

**PUT /api/companies/:id**

User must belong to the company. All body fields are optional; only provided fields are updated.

```bash
curl -s -X PUT "http://localhost:4000/api/companies/$COMPANY_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme Labs Pvt Ltd",
    "address": "123 Industrial Ave, New City 400002",
    "website": "https://acmelabs.example.com",
    "phoneNumber": "+91-9876543211",
    "email": "contact@acmelabs.example.com"
  }'
```

**Partial update (e.g. only phone):**
```bash
curl -s -X PUT "http://localhost:4000/api/companies/$COMPANY_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+91-9876543211"}'
```

**Expected response (200):**
```json
{
  "success": true,
  "message": "Company updated successfully",
  "data": {
    "company": {
      "_id": "...",
      "companyID": "COMP-123456",
      "name": "Acme Labs Pvt Ltd",
      "address": "123 Industrial Ave, New City 400002",
      "website": "https://acmelabs.example.com",
      "phoneNumber": "+91-9876543211",
      "email": "contact@acmelabs.example.com",
      "createdAt": "...",
      "updatedAt": "..."
    }
  }
}
```

**Note:** `companyID` is immutable and cannot be sent or changed.

---

## 5. Delete company

**DELETE /api/companies/:id**

User must belong to the company.

```bash
curl -s -X DELETE "http://localhost:4000/api/companies/$COMPANY_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json"
```

**Expected response (200):**
```json
{
  "success": true,
  "message": "Company deleted successfully"
}
```

**Error (403 / 404):** Same as Get company by ID.

---

## 6. Unauthorized (no token)

```bash
curl -s -X GET "http://localhost:4000/api/companies"
```

**Expected:** `401` with `{ "success": false, "error": "..." }`

---

## Get a token (for copy-paste)

```bash
# Login and save token
curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword"}' | jq -r '.data.token'

# Then set it:
export TOKEN="<paste-token-here>"
```

---

## Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | /api/companies     | Create company (any authenticated user) |
| GET    | /api/companies     | List user’s company (user must have company) |
| GET    | /api/companies/:id | Get company by ID (must be user’s company) |
| PUT    | /api/companies/:id | Update company (must be user’s company) |
| DELETE | /api/companies/:id | Delete company (must be user’s company) |
