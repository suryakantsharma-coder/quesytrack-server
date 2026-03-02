# Logs API – cURL Examples

**Base URL:** `http://localhost:4000` (or your `PORT`)

All endpoints require authentication. Use the token from login in the `Authorization` header:

```bash
export TOKEN="your-jwt-token-here"
```

---

## 1. List logs (paginated, latest first)

```bash
curl -s -X GET "http://localhost:4000/api/logs" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json"
```

**With pagination:**
```bash
curl -s -X GET "http://localhost:4000/api/logs?page=1&limit=20" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json"
```

**With sorting (default: createdAt desc):**
```bash
curl -s -X GET "http://localhost:4000/api/logs?sortBy=createdAt&sortOrder=desc" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json"
```

**Expected response shape:**
```json
{
  "success": true,
  "message": "Logs retrieved successfully",
  "data": {
    "data": [
      {
        "_id": "...",
        "title": "New Project Created",
        "description": "Quality Control project created by John Doe.",
        "actionType": "CREATE",
        "entityType": "PROJECT",
        "entityId": "...",
        "entityName": "Quality Control",
        "performedByUserId": "...",
        "performedByUserName": "John Doe",
        "performedByCompany": "",
        "ipAddress": "::1",
        "userAgent": "...",
        "date": "2025-02-26T...",
        "time": "2025-02-26T...",
        "createdAt": "...",
        "updatedAt": "..."
      }
    ],
    "pagination": {
      "total": 10,
      "page": 1,
      "limit": 10,
      "pages": 1,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  }
}
```

---

## 2. Search logs

**By entity type (e.g. PROJECT, GAUGE, CALIBRATION, REPORT, USER):**
```bash
curl -s -X GET "http://localhost:4000/api/logs/search?entityType=PROJECT" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json"
```

**By action type (e.g. CREATE, UPDATE, DELETE, UPLOAD):**
```bash
curl -s -X GET "http://localhost:4000/api/logs/search?actionType=CREATE" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json"
```

**By performer (user ID):**
```bash
curl -s -X GET "http://localhost:4000/api/logs/search?performedByUserId=69673747c09bec17837a9cfe" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json"
```

**By date range:**
```bash
curl -s -X GET "http://localhost:4000/api/logs/search?dateFrom=2025-02-01&dateTo=2025-02-28" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json"
```

**Text search (title, description, entityName):**
```bash
curl -s -X GET "http://localhost:4000/api/logs/search?search=project" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json"
```

**Combined filters + pagination:**
```bash
curl -s -X GET "http://localhost:4000/api/logs/search?entityType=CALIBRATION&actionType=UPLOAD&page=1&limit=10&sortBy=createdAt&sortOrder=desc" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json"
```

---

## 3. Get a single log by ID

```bash
curl -s -X GET "http://localhost:4000/api/logs/LOG_MONGO_ID_HERE" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json"
```

**Example:**
```bash
curl -s -X GET "http://localhost:4000/api/logs/67a1b2c3d4e5f6789012345" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json"
```

**Expected response:**
```json
{
  "success": true,
  "message": "Log retrieved successfully",
  "data": {
    "_id": "...",
    "title": "New Project Created",
    "description": "...",
    "actionType": "CREATE",
    "entityType": "PROJECT",
    "entityId": "...",
    "entityName": "...",
    "date": "...",
    "time": "...",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

---

## 4. Unauthorized (no token)

```bash
curl -s -X GET "http://localhost:4000/api/logs"
```

**Expected:** `401` with `{ "success": false, "error": "..." }`
