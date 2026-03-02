# cURL documentation index

**Full endpoint reference (all endpoints + params in one file):** [API_ENDPOINTS.md](./API_ENDPOINTS.md)

Quick reference to cURL example files:

| File | APIs covered |
|------|----------------|
| [auth-api-curl.md](./auth-api-curl.md) | Auth: register, login, check-token, get me |
| [company-api-curl.md](./company-api-curl.md) | Companies: CRUD (create, list, get, update, delete) |
| [project-gauges-calibrations-curl.md](./project-gauges-calibrations-curl.md) | Project: list gauges / calibrations by project ID |
| [../calibration-update-curl.md](../calibration-update-curl.md) | Calibrations: update with attachments (multipart/JSON) |
| [../logs-curl.md](../logs-curl.md) | Logs: list, search, get by ID |
| [../search-api-curl.md](../search-api-curl.md) | Search: projects, gauges, calibrations, reports, admin users |

**Base URL:** `http://localhost:4000` (or your `PORT`)

**Get a token:** See [auth-api-curl.md](./auth-api-curl.md) (login) or use:

```bash
export TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword"}' | jq -r '.data.token')
```
