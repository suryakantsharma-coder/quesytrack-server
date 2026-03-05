# Dashboard Graph API – cURL examples

**Base URL:** `http://localhost:4000` (or your `PORT`)  
**Auth:** `Authorization: Bearer <token>`

---

## Behavior

| Role        | `companyId` query | Behavior |
|------------|-------------------|----------|
| **Super admin** | Optional (omit or `all`) | Sees **all companies'** graph data |
| **Super admin** | `companyId=<MongoDB id>` | Sees **that company's** graph only |
| **Other roles** | **Required** | Must pass their company id; sees **that company's** graph only. If missing → `400` "Company ID is required". If wrong company → `403` "Access denied to this company". |

**Query params (all endpoints):**

- `filter` – `7days`, `30days`, `6months`, `1year` (see dateFilter for exact values)
- `companyId` – **Required** for non–super admin; optional for super admin (MongoDB company `_id`)

---

## Endpoints

### 1. Gauges graph

`GET /api/dashboard/gauges`

**Super admin – all companies:**

```bash
curl -X GET "http://localhost:4000/api/dashboard/gauges?filter=30days" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Super admin – one company:**

```bash
curl -X GET "http://localhost:4000/api/dashboard/gauges?filter=30days&companyId=COMPANY_MONGODB_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Other roles (companyId required):**

```bash
curl -X GET "http://localhost:4000/api/dashboard/gauges?filter=30days&companyId=YOUR_COMPANY_MONGODB_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 2. Calibrations graph

`GET /api/dashboard/calibrations`

**Super admin – all companies:**

```bash
curl -X GET "http://localhost:4000/api/dashboard/calibrations?filter=30days" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Other roles (companyId required):**

```bash
curl -X GET "http://localhost:4000/api/dashboard/calibrations?filter=30days&companyId=YOUR_COMPANY_MONGODB_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 3. Projects graph

`GET /api/dashboard/projects`

**Super admin – all companies:**

```bash
curl -X GET "http://localhost:4000/api/dashboard/projects?filter=30days" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Other roles (companyId required):**

```bash
curl -X GET "http://localhost:4000/api/dashboard/projects?filter=30days&companyId=YOUR_COMPANY_MONGODB_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 4. System graph (Reports + Logs)

`GET /api/dashboard/system`

**Super admin – all companies:**

```bash
curl -X GET "http://localhost:4000/api/dashboard/system?filter=30days" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Other roles (companyId required):**

```bash
curl -X GET "http://localhost:4000/api/dashboard/system?filter=30days&companyId=YOUR_COMPANY_MONGODB_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Error examples

**Non–super admin without companyId (400):**

```bash
curl -X GET "http://localhost:4000/api/dashboard/gauges?filter=30days" \
  -H "Authorization: Bearer ADMIN_OR_VIEWER_TOKEN"
# → 400 "Company ID is required"
```

**Non–super admin with another company's id (403):**

```bash
curl -X GET "http://localhost:4000/api/dashboard/gauges?filter=30days&companyId=OTHER_COMPANY_ID" \
  -H "Authorization: Bearer ADMIN_OR_VIEWER_TOKEN"
# → 403 "Access denied to this company"
```
