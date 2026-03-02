# Safe Migration Strategy: Company Model & Data Isolation

This document describes how to safely introduce the Company model and company-based data isolation without breaking existing functionality.

## Overview

- **Company** model added with auto-generated `companyID` (format: `COMP-XXXXXX`).
- **User** has optional `company` (ObjectId ref). Existing users have `company: null` until assigned.
- **Gauges, Reports, Calibrations, Projects, Logs** have optional `company` (ObjectId ref, indexed). Existing documents have `company: null`.
- **GET APIs** for these entities filter by `req.user.company`. If the user has no company, the API returns `403 - User must be assigned to a company`.
- **Create/Update**: Backend sets `company: req.user.company`; frontend must NOT send `company`. Update/Destroy are allowed only when the resource’s `company` matches the logged-in user’s company.

## Pre-Migration (Current State)

- All new code is backward compatible:
  - `company` is **optional** (`required: false`) on User and on all entity schemas.
  - If `req.user.company` is missing, company-scoped GETs return 403.
  - Existing documents without `company` remain valid.

## Recommended Migration Steps

### Step 1: Deploy code

Deploy the application with the new Company model, routes, and company isolation logic. No data migration is required for the app to run.

### Step 2: Create companies and assign users

1. Create one or more companies via `POST /api/companies` (body: `name`, `address`, `website?`, `phoneNumber`, `email`).  
   Response includes the new company `_id` and server-generated `companyID`.
2. Assign each user to a company by updating the User document in MongoDB:
   ```javascript
   db.users.updateOne(
     { email: "user@example.com" },
     { $set: { company: ObjectId("<company_id>") } },
   );
   ```
   Or expose an admin endpoint, e.g. `PATCH /api/admin/users/:id` with `{ company: "<companyId>" }`, ensuring only admins can set it.

### Step 3: Backfill `company` on existing documents

Run a one-time script (or admin endpoint) that sets `company` on all existing Gauges, Reports, Calibrations, Projects, and Logs. Option A: assign everything to a single default company. Option B: derive company from the document’s `createdBy` user.

**Example (single default company):**

```javascript
const defaultCompanyId = new ObjectId("<your-default-company-id>");

await mongoose.connection
  .collection("gauges")
  .updateMany(
    { company: { $exists: false } },
    { $set: { company: defaultCompanyId } },
  );
await mongoose.connection
  .collection("reports")
  .updateMany(
    { company: { $exists: false } },
    { $set: { company: defaultCompanyId } },
  );
await mongoose.connection
  .collection("calibrations")
  .updateMany(
    { company: { $exists: false } },
    { $set: { company: defaultCompanyId } },
  );
await mongoose.connection
  .collection("projects")
  .updateMany(
    { company: { $exists: false } },
    { $set: { company: defaultCompanyId } },
  );
await mongoose.connection
  .collection("logs")
  .updateMany(
    { company: { $exists: false } },
    { $set: { company: defaultCompanyId } },
  );
```

**Example (derive from creator):**

- For each document with no `company`, look up `users._id === document.createdBy` and set `document.company = user.company` (if user has a company), otherwise set to default company.

### Step 4: (Optional) Make `company` required

After all users have a company and all relevant documents have `company` set:

1. In each schema (Gauge, Report, Calibration, Project, Log), change:
   - `company: { ..., required: false }` → `required: true`.
2. In User schema, you can keep `company` optional for super-admin accounts, or make it required and assign every user to a company.
3. Redeploy and run tests.

## Security Summary

- **companyID**: Generated only on the server; never accepted from the client. Pre-save hook rejects create without `companyID` and rejects updates that change `companyID`.
- **Filtering**: All list/get for Gauges, Reports, Calibrations, Projects, and Logs add `company: req.user.company` to the query. Single-resource get/update/delete check that the document’s `company` matches `req.user.company`; otherwise return 404.
- **Logs**: Every audit log is created with `company: req.user.company` from the logger service; the client cannot pass `company`.
- **ObjectIds**: Company and resource IDs are validated with `mongoose.Types.ObjectId.isValid` and strict string comparison where needed.

## No Breaking Changes

- Existing API contracts (request/response shapes) are unchanged except for new `company` field in responses where applicable.
- New endpoints: `POST/GET/GET/:id/PUT/DELETE /api/companies`.
- Existing documents without `company` are still returned only if you do **not** enforce “user must have company” (current code returns 403 when user has no company; documents without company would not be in the result set once you add `company` filter). After backfill, all documents have `company` and behavior is consistent.
