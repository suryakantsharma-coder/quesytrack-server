# Search API – cURL Examples

**Base URL:** `http://localhost:4000` (or your `PORT`)

All search endpoints require authentication. Set your JWT token:

```bash
export TOKEN="your-jwt-token-here"
```

**Query parameters (common):**
- `search` – partial, case-insensitive text search
- `page` – page number (default: 1)
- `limit` – items per page (default: 10, max: 100)
- `sortBy` – field to sort by (default varies by entity)
- `sortOrder` – `asc` or `desc`
- `dateFrom` / `dateTo` – date range where applicable
- Entity-specific filters: `status`, `projectId`, `gaugeType`, etc.

---

## 1. Projects search

**GET /api/projects/search**

**Basic search (by name, description, or projectId):**
```bash
curl -s -X GET "http://localhost:4000/api/projects/search?search=quality" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json"
```

**With status filter and pagination:**
```bash
curl -s -X GET "http://localhost:4000/api/projects/search?status=active&page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json"
```

**With date range (startedAt):**
```bash
curl -s -X GET "http://localhost:4000/api/projects/search?dateFrom=2025-01-01&dateTo=2025-12-31" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json"
```

**Full example:**
```bash
curl -s -X GET "http://localhost:4000/api/projects/search?search=control&status=active&page=1&limit=20&sortBy=createdAt&sortOrder=desc" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json"
```

---

## 2. Gauges search

**GET /api/gauges/search**

**Search by name, model, manufacturer, gaugeId, or location:**
```bash
curl -s -X GET "http://localhost:4000/api/gauges/search?search=pressure" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json"
```

**Filter by status and gauge type:**
```bash
curl -s -X GET "http://localhost:4000/api/gauges/search?status=active&gaugeType=temperature" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json"
```

**With pagination:**
```bash
curl -s -X GET "http://localhost:4000/api/gauges/search?page=1&limit=15&sortBy=gaugeName&sortOrder=asc" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json"
```

---

## 3. Calibrations search

**GET /api/calibrations/search**

**Search by calibrationId, calibratedBy, or certificateNumber:**
```bash
curl -s -X GET "http://localhost:4000/api/calibrations/search?search=C-001" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json"
```

**Filter by status and project (custom projectId e.g. P-001):**
```bash
curl -s -X GET "http://localhost:4000/api/calibrations/search?status=completed&projectId=P-001" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json"
```

**Date range (calibrationDate):**
```bash
curl -s -X GET "http://localhost:4000/api/calibrations/search?dateFrom=2025-01-01&dateTo=2025-02-28" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json"
```

**Full example:**
```bash
curl -s -X GET "http://localhost:4000/api/calibrations/search?search=NABL&status=completed&page=1&limit=10&sortBy=calibrationDate&sortOrder=desc" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json"
```

---

## 4. Reports search

**GET /api/reports/search**

**Search by reportName or reportId:**
```bash
curl -s -X GET "http://localhost:4000/api/reports/search?search=monthly" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json"
```

**Filter by status:**
```bash
curl -s -X GET "http://localhost:4000/api/reports/search?status=completed" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json"
```

**Date range (calibrationDate):**
```bash
curl -s -X GET "http://localhost:4000/api/reports/search?dateFrom=2025-02-01&dateTo=2025-02-26" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json"
```

---

## 5. Admin – Users list and search

**Requires Admin role.**  
**GET /api/admin/users** – list users (paginated)  
**GET /api/admin/users/search** – search users

**List users:**
```bash
curl -s -X GET "http://localhost:4000/api/admin/users?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json"
```

**Search users (by name, email, designation, role):**
```bash
curl -s -X GET "http://localhost:4000/api/admin/users/search?search=john" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json"
```

**Filter by role:**
```bash
curl -s -X GET "http://localhost:4000/api/admin/users/search?role=Editor" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json"
```

---

## Response format (all search endpoints)

```json
{
  "success": true,
  "message": "Search successful",
  "data": {
    "data": [ ... ],
    "pagination": {
      "total": 25,
      "page": 1,
      "limit": 10,
      "pages": 3,
      "totalPages": 3,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

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
