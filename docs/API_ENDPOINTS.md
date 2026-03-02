# API Endpoints – Full Reference

**Base URL:** `http://localhost:4000` (or your `PORT`)

**Auth:** Most endpoints require `Authorization: Bearer <token>`. Get token via `POST /api/auth/login`.

**Company isolation:** Endpoints under Projects, Gauges, Calibrations, Reports, Logs, and Companies filter or scope by the authenticated user’s company. User must have a company assigned (403 if not).

---

## Common query parameters (list/search)

Used across many GET list and search endpoints:

| Param      | Type   | Default   | Description                          |
|-----------|--------|-----------|--------------------------------------|
| `page`    | number | 1         | Page number                          |
| `limit`   | number | 10, max 100 | Items per page                    |
| `sortBy`  | string | varies    | Field to sort by                     |
| `sortOrder` | string | desc    | `asc` or `desc`                      |
| `search`  | string | -         | Partial, case-insensitive text search (where supported) |
| `dateFrom`| string | -         | ISO date; start of date range        |
| `dateTo`  | string | -         | ISO date; end of date range          |

---

## 1. Auth – `/api/auth`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Register new user |
| POST | `/api/auth/login` | No | Login, get JWT (includes `company` in payload if set) |
| POST | `/api/auth/check-token` | No | Validate token |
| GET | `/api/auth/me` | Bearer | Current user profile |

### POST /api/auth/register

**Body (JSON):**

| Field         | Type   | Required | Description |
|---------------|--------|----------|-------------|
| name          | string | Yes      | Full name   |
| email         | string | Yes      | Unique email |
| password      | string | Yes      | Password    |
| designation   | string | No       | Default `""` |
| role          | string | No       | Default `Viewer` |

### POST /api/auth/login

**Body (JSON):**

| Field    | Type   | Required |
|----------|--------|----------|
| email    | string | Yes      |
| password | string | Yes      |

### POST /api/auth/check-token

**Body (JSON):**

| Field | Type   | Required |
|-------|--------|----------|
| token | string | Yes      |

### GET /api/auth/me

**Headers:** `Authorization: Bearer <token>`  
**Response:** Current user (id, name, email, designation, role, createdAt, updatedAt).

---

## 2. Companies – `/api/companies`

All require **Bearer**. List/Get/Update/Delete require user to be assigned to a company; create is allowed for any authenticated user.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/companies` | Create company |
| GET | `/api/companies` | List user’s company (single) |
| GET | `/api/companies/:id` | Get company by ID |
| PUT | `/api/companies/:id` | Update company |
| DELETE | `/api/companies/:id` | Delete company |

### POST /api/companies

**Body (JSON):**

| Field       | Type   | Required | Description |
|-------------|--------|----------|-------------|
| name        | string | Yes      | Company name |
| address     | string | Yes      | Address     |
| phoneNumber | string | Yes      | Phone       |
| email       | string | Yes      | Unique, valid email |
| website     | string | No       | Valid URL or empty |

**Response:** Created company with server-generated `companyID` (e.g. `COMP-123456`). Do not send `company` or `companyID`.

### GET /api/companies

**Query:** None. Returns only the company assigned to the current user.

### GET /api/companies/:id

**Path:** `id` = company MongoDB `_id`. User must belong to this company.

### PUT /api/companies/:id

**Body (JSON):** All optional; only provided fields are updated.

| Field       | Type   |
|-------------|--------|
| name        | string |
| address     | string |
| website     | string |
| phoneNumber | string |
| email       | string |

**Note:** `companyID` is immutable; do not send.

### DELETE /api/companies/:id

**Path:** `id` = company MongoDB `_id`. User must belong to this company.

---

## 3. Projects – `/api/projects`

All require **Bearer** and user must have a company.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/projects` | Create project |
| GET | `/api/projects` | List projects (paginated) |
| GET | `/api/projects/search` | Search projects |
| GET | `/api/projects/:id` | Get project by ID |
| GET | `/api/projects/:id/gauges` | List gauges for this project (paginated) |
| GET | `/api/projects/:id/calibrations` | List calibrations for this project (paginated) |
| PUT | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project |

### POST /api/projects

**Body (JSON):** Do not send `company` or `projectId` (auto-generated).

| Field             | Type   | Required | Description |
|-------------------|--------|----------|-------------|
| projectName       | string | Yes      | |
| startedAt        | string (date) | Yes | Start date |
| projectDescription| string | No       | Default `""` |
| overdue           | number | No       | Default 0   |
| progress          | string | No       | Default `Not Started` |
| status            | string | No       | Default `Active`; enum: active, on-hold, completed |

### GET /api/projects

**Query:**

| Param | Type   | Description |
|-------|--------|-------------|
| page, limit, sortBy, sortOrder | - | Pagination/sort |
| search | string | Matches projectName, projectDescription, projectId |
| projectName, projectDescription, projectId, status | string | Exact filter |

### GET /api/projects/search

**Query:**

| Param | Type   | Description |
|-------|--------|-------------|
| page, limit, sortBy, sortOrder, search | - | As above |
| dateFrom, dateTo | string | Range on `startedAt` |
| status | string | Filter by status |

### GET /api/projects/:id

**Path:** `id` = project MongoDB `_id`. Resource must belong to user’s company.

### PUT /api/projects/:id

**Body (JSON):** Any subset of project fields. Do not send `company` or `projectId`.

### DELETE /api/projects/:id

**Path:** `id` = project MongoDB `_id`. Resource must belong to user’s company.

---

## 4. Gauges – `/api/gauges`

All require **Bearer** and user must have a company. Create/Update can include optional image upload.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/gauges` | Create gauge (optional `image` file) |
| GET | `/api/gauges` | List gauges (paginated) |
| GET | `/api/gauges/search` | Search gauges |
| GET | `/api/gauges/:id` | Get gauge by ID |
| PUT | `/api/gauges/:id` | Update gauge (optional `image` file) |
| DELETE | `/api/gauges/:id` | Delete gauge |

### POST /api/gauges

**Content-Type:** `multipart/form-data` (if image) or `application/json`.

**Body (JSON or form):** Do not send `company` or `gaugeId` (auto-generated).

| Field        | Type   | Required | Description |
|--------------|--------|----------|-------------|
| gaugeName    | string | Yes      | |
| gaugeType    | string | Yes      | pressure, temperature, vernier, vacuum, torque, mechanical, other |
| gaugeModel   | string | No       | |
| manufacturer | string | No       | |
| location     | string | No       | |
| traceability | string | No       | NIST, ISO, NABL, None, UKAS; default NIST |
| nominalSize  | string | No       | |
| status       | string | No       | active, inactive, under calibration, retired, maintenance; default Active |
| projectId    | string (ObjectId) | No | Must be project in user’s company |
| image        | file   | No       | Form field name `image` (single file) |

### GET /api/gauges

**Query:**

| Param | Type   | Description |
|-------|--------|-------------|
| page, limit, sortBy, sortOrder, search | - | Pagination/sort and text search |
| gaugeName, gaugeModel, manufacturer, gaugeId, status, gaugeType | string | Exact filter |

### GET /api/gauges/search

**Query:**

| Param | Type   | Description |
|-------|--------|-------------|
| page, limit, sortBy, sortOrder, search | - | Search in gaugeName, gaugeModel, manufacturer, gaugeId, location |
| dateFrom, dateTo | string | Not used by gauge schema; may be ignored |
| status, gaugeType | string | Filter |

### GET /api/gauges/:id

**Path:** `id` = gauge MongoDB `_id`. Resource must belong to user’s company.

### PUT /api/gauges/:id

**Content-Type:** `multipart/form-data` (if image) or `application/json`.  
**Body:** Same fields as create; all optional. Use form field `image` to replace image. Do not send `company` or `gaugeId`.

### DELETE /api/gauges/:id

**Path:** `id` = gauge MongoDB `_id`. Resource must belong to user’s company.

---

## 5. Calibrations – `/api/calibrations`

All require **Bearer** and user must have a company. Create/Update support multiple file uploads and attachment replacement.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/calibrations` | Create calibration (optional `files`) |
| GET | `/api/calibrations` | List calibrations (paginated) |
| GET | `/api/calibrations/search` | Search calibrations |
| GET | `/api/calibrations/:id` | Get calibration by ID |
| PUT | `/api/calibrations/:id` | Update calibration; replace/add attachments |
| DELETE | `/api/calibrations/:id` | Delete calibration |

### POST /api/calibrations

**Content-Type:** `multipart/form-data` (if files) or `application/json`.

**Body (JSON or form):** Do not send `company`. `calibrationId` optional (auto-generated if omitted).

| Field              | Type   | Required | Description |
|--------------------|--------|----------|-------------|
| projectId          | string | Yes      | ObjectId or custom projectId (e.g. P-001) in user’s company |
| calibrationDate    | string (date) | Yes | |
| calibrationDueDate| string (date) | Yes | |
| gaugeId            | string | No       | Custom gauge id (e.g. G-001) |
| calibratedBy       | string | No       | |
| calibrationType    | string | No       | internal, external, third party; default third party |
| traceability       | string | No       | NIST, ISO, NABL, None |
| certificateNumber  | string | No       | |
| reportLink         | string | No       | |
| files              | file[] | No       | Form field `files` (multiple, max 10) |

### GET /api/calibrations

**Query:**

| Param | Type   | Description |
|-------|--------|-------------|
| page, limit, sortBy, sortOrder, search | - | Pagination/sort and text search |
| calibrationId, calibratedBy, certificateNumber, projectId | string | Filter (projectId can be custom id e.g. P-001) |

### GET /api/calibrations/search

**Query:**

| Param | Type   | Description |
|-------|--------|-------------|
| page, limit, sortBy, sortOrder, search | - | Search in calibrationId, calibratedBy, certificateNumber |
| dateFrom, dateTo | string | Range on `calibrationDate` |
| status, projectId | string | Filter |

### GET /api/calibrations/:id

**Path:** `id` = calibration MongoDB `_id`. Resource must belong to user’s company.

### PUT /api/calibrations/:id

**Content-Type:** `multipart/form-data` (if changing attachments or adding files) or `application/json`.

**Body:**

- **JSON:** Any calibration fields + optional `attachments` array.  
  - `attachments`: replace existing list. Each item: `{ fileName, filePath, fileType, fileSize }`.  
  - Omit `attachments` to keep current attachments; send `[]` to remove all.
- **Multipart:** Same fields as form; `attachments` as JSON string (e.g. `[]` or `[{...}]`); `files` = new files to append after replacing with `attachments`.

Do not send `company`. `projectId` can be ObjectId or custom projectId.

### DELETE /api/calibrations/:id

**Path:** `id` = calibration MongoDB `_id`. Resource must belong to user’s company.

---

## 6. Reports – `/api/reports`

All require **Bearer** and user must have a company.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/reports` | Create report |
| GET | `/api/reports` | List reports (paginated) |
| GET | `/api/reports/search` | Search reports |
| GET | `/api/reports/:id` | Get report by ID |
| PUT | `/api/reports/:id` | Update report |
| DELETE | `/api/reports/:id` | Delete report |

### POST /api/reports

**Body (JSON):** Do not send `company` or `reportId` (auto-generated).

| Field              | Type   | Required | Description |
|--------------------|--------|----------|-------------|
| reportName         | string | Yes      | |
| projectId          | string (ObjectId) | Yes | Project in user’s company |
| calibrationDate   | string (date) | Yes | |
| calibrationDueDate| string (date) | Yes | |
| status             | string | No       | completed, pending, overdue; default completed |
| reportLink         | string | No       | |

### GET /api/reports

**Query:**

| Param | Type   | Description |
|-------|--------|-------------|
| page, limit, sortBy, sortOrder, search | - | Pagination/sort and text search |
| reportName, reportId, status | string | Exact filter |

### GET /api/reports/search

**Query:**

| Param | Type   | Description |
|-------|--------|-------------|
| page, limit, sortBy, sortOrder, search | - | Search in reportName, reportId |
| dateFrom, dateTo | string | Range on `calibrationDate` |
| status | string | Filter |

### GET /api/reports/:id

**Path:** `id` = report MongoDB `_id`. Resource must belong to user’s company.

### PUT /api/reports/:id

**Body (JSON):** Any subset of report fields. Do not send `company` or `reportId`.

### DELETE /api/reports/:id

**Path:** `id` = report MongoDB `_id`. Resource must belong to user’s company.

---

## 7. Logs – `/api/logs`

All require **Bearer** and user must have a company. Read-only.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/logs` | List logs (paginated, default sort: createdAt desc) |
| GET | `/api/logs/search` | Search/filter logs |
| GET | `/api/logs/:id` | Get log by ID |

### GET /api/logs

**Query:**

| Param | Type   | Description |
|-------|--------|-------------|
| page, limit, sortBy, sortOrder | - | Pagination/sort (default sortBy: createdAt, sortOrder: desc) |

### GET /api/logs/search

**Query:**

| Param | Type   | Description |
|-------|--------|-------------|
| page, limit, sortBy, sortOrder | - | Pagination/sort |
| search | string | Matches title, description, entityName |
| entityType | string | e.g. PROJECT, GAUGE, CALIBRATION, REPORT, USER |
| actionType | string | e.g. CREATE, UPDATE, DELETE, UPLOAD |
| performedByUserId | string | User ObjectId |
| dateFrom, dateTo | string | Range on createdAt |

### GET /api/logs/:id

**Path:** `id` = log MongoDB `_id`. Resource must belong to user’s company.

---

## 8. Admin – `/api/admin`

All require **Bearer** and **Admin** role.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/users` | List users (paginated) |
| GET | `/api/admin/users/search` | Search users |
| PATCH | `/api/admin/users/:id` | Assign or unassign user's company |
| GET | `/api/admin/sequence-info` | Sequence info for all models |
| GET | `/api/admin/sequence-info/:type` | Sequence info for one model |
| POST | `/api/admin/reset-sequence/:type` | Reset sequence for one model |
| POST | `/api/admin/reset-all-sequences` | Reset all sequences |

### GET /api/admin/users

**Query:**

| Param | Type   | Description |
|-------|--------|-------------|
| page, limit, sortBy, sortOrder | - | Pagination/sort |
| search, dateFrom, dateTo | - | buildSearchFilter (name, email, designation, role) |

### GET /api/admin/users/search

**Query:** Same as `/api/admin/users`; uses search filter on name, email, designation, role.

### PATCH /api/admin/users/:id (assign user to company)

**Path:** `id` = user MongoDB `_id` to update.

**Body (JSON):**

| Field   | Type   | Required | Description |
|---------|--------|----------|-------------|
| company | string \| null | Yes | Company MongoDB `_id` to assign, or `null` to unassign |

**Response:** Updated user (no password). User must log in again for token to include new `company`.

**Errors:** 400 invalid user/company ID, 404 user or company not found.

### GET /api/admin/sequence-info

**Response:** `{ project: {...}, report: {...}, gauge: {...}, calibration: {...} }` per model.

### GET /api/admin/sequence-info/:type

**Path:** `type` = one of: `project`, `report`, `gauge`, `calibration`.

### POST /api/admin/reset-sequence/:type

**Path:** `type` = one of: `project`, `report`, `gauge`, `calibration`.  
**Body (JSON):**

| Field     | Type   | Required | Description |
|-----------|--------|----------|-------------|
| startFrom | number | No       | Default 1   |

### POST /api/admin/reset-all-sequences

**Body (JSON):**

| Field     | Type   | Required | Description |
|-----------|--------|----------|-------------|
| startFrom | number | No       | Default 1   |

---

## 9. AI Chat – `/api/ai-chat`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/ai-chat` | No (per implementation) | Streamed AI chat (SSE) |

### POST /api/ai-chat

**Body (JSON):**

| Field    | Type  | Required | Description |
|----------|-------|----------|-------------|
| messages | array | Yes      | Non-empty array of `{ role: "user" \| "assistant", content: string }` |

**Response:** `text/event-stream`. Chunks: `data: {"content":"..."}\n\n`. End: `data: [DONE]\n\n`.

---

## 10. Health

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | No | Server health check |

**Response:** `{ status: "OK", message: "Server is running" }`.

---

## Response shape (standard)

- **Success:** `{ success: true, message: string, data: ... }`
- **Error:** `{ success: false, error: string }`
- **Paginated:** `data` contains `data` (array) and `pagination`: `{ total, page, limit, pages, totalPages, hasNextPage, hasPrevPage }`

---

## Notes

- **Company:** Never send `company` in request body; it is set from `req.user.company`.
- **IDs:** `projectId`, `gaugeId`, `calibrationId`, `reportId`, `companyID` are server-generated; do not set on create (except calibrationId which can be optional custom).
- **File uploads:** Gauges use single `image`; calibrations use multiple `files` (max 10). Use `multipart/form-data`.
- **404/403:** Single-resource endpoints return 404 when resource is missing or 403 when company access is denied.
