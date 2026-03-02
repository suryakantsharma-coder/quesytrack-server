# Project gauges & calibrations – cURL examples

**Base URL:** `http://localhost:4000`

Pass a **project ID** (MongoDB `_id` or custom `projectId` like `P-001`) to get gauges or calibrations for that project. All endpoints require **Bearer** token and user must have a company.

```bash
export TOKEN="your-jwt-token"
export PROJECT_ID="your-project-id"   # MongoDB _id or custom e.g. P-001
```

---

## 1. Get gauges by project ID

**GET /api/projects/:id/gauges**

**Path:** `id` = project MongoDB `_id` or custom `projectId` (e.g. `P-001`).

**Basic:**
```bash
curl -s -X GET "http://localhost:4000/api/projects/$PROJECT_ID/gauges" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json"
```

**With pagination:**
```bash
curl -s -X GET "http://localhost:4000/api/projects/$PROJECT_ID/gauges?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json"
```

**With sorting:**
```bash
curl -s -X GET "http://localhost:4000/api/projects/$PROJECT_ID/gauges?sortBy=gaugeName&sortOrder=asc" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json"
```

**Example with custom projectId (e.g. P-001):**
```bash
curl -s -X GET "http://localhost:4000/api/projects/P-001/gauges" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json"
```

**Expected response (200):**
```json
{
  "success": true,
  "message": "Gauges retrieved successfully",
  "data": {
    "gauges": [
      {
        "_id": "...",
        "gaugeId": "G-001",
        "gaugeName": "...",
        "gaugeType": "pressure",
        "projectId": { "_id": "...", "projectName": "...", "projectId": "P-001" },
        "createdBy": { "name": "...", "email": "..." },
        ...
      }
    ],
    "pagination": {
      "total": 5,
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

## 2. Get calibrations by project ID

**GET /api/projects/:id/calibrations**

**Path:** `id` = project MongoDB `_id` or custom `projectId` (e.g. `P-001`).

**Basic:**
```bash
curl -s -X GET "http://localhost:4000/api/projects/$PROJECT_ID/calibrations" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json"
```

**With pagination:**
```bash
curl -s -X GET "http://localhost:4000/api/projects/$PROJECT_ID/calibrations?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json"
```

**With sorting:**
```bash
curl -s -X GET "http://localhost:4000/api/projects/$PROJECT_ID/calibrations?sortBy=calibrationDate&sortOrder=desc" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json"
```

**Example with custom projectId (e.g. P-001):**
```bash
curl -s -X GET "http://localhost:4000/api/projects/P-001/calibrations" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json"
```

**Expected response (200):**
```json
{
  "success": true,
  "message": "Calibrations retrieved successfully",
  "data": {
    "calibrations": [
      {
        "_id": "...",
        "calibrationId": "C-001",
        "projectId": { "_id": "...", "projectName": "...", "projectId": "P-001" },
        "calibrationDate": "...",
        "calibrationDueDate": "...",
        "createdBy": { "name": "...", "email": "..." },
        ...
      }
    ],
    "pagination": {
      "total": 3,
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

## Errors

- **404** – Project not found (invalid id or not in your company).
- **403** – User must be assigned to a company, or project access denied.
- **401** – Missing or invalid token.

---

## Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/projects/:id/gauges | List gauges for project (paginated) |
| GET | /api/projects/:id/calibrations | List calibrations for project (paginated) |

**Query params (optional):** `page`, `limit`, `sortBy`, `sortOrder`.
