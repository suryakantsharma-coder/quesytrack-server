# Report Routes cURL Commands

This file contains cURL commands for testing all report endpoints.

**Base URL:** `http://localhost:4000` (or your configured PORT)

**Note:** All report routes require authentication. You must include a valid JWT token in the `Authorization` header.

---

## Prerequisites

Before testing report routes, you need to:
1. Register or login to get a JWT token
2. Use that token in the `Authorization: Bearer <token>` header for all requests

**Get Token Example:**
```bash
# Login to get token
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "your-password"
  }'
```

Copy the `token` from the response and use it in the `YOUR_TOKEN_HERE` placeholder below.

---

## Create Report

### POST /api/reports
Create a new report.

**Required Fields:**
- `reportName` (string)
- `projectId` (ObjectId - must be a valid project ID)
- `calibrationDate` (Date - ISO 8601 format)
- `calibrationDueDate` (Date - ISO 8601 format)

**Optional Fields:**
- `status` (enum: 'Completed', 'Pending', 'Overdue', default: 'Pending')
- `reportLink` (string)

```bash
curl -X POST http://localhost:4000/api/reports \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "reportName": "Monthly Calibration Report - January 2024",
    "projectId": "PROJECT_ID_HERE",
    "calibrationDate": "2024-01-15T00:00:00.000Z",
    "calibrationDueDate": "2024-02-15T00:00:00.000Z",
    "status": "Completed",
    "reportLink": "https://example.com/reports/january-2024.pdf"
  }'
```

**Minimal Request (required fields only):**
```bash
curl -X POST http://localhost:4000/api/reports \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "reportName": "Monthly Calibration Report",
    "projectId": "PROJECT_ID_HERE",
    "calibrationDate": "2024-01-15T00:00:00.000Z",
    "calibrationDueDate": "2024-02-15T00:00:00.000Z"
  }'
```

**Expected Success Response (201):**
```json
{
  "success": true,
  "message": "Report created successfully",
  "data": {
    "report": {
      "_id": "...",
      "reportName": "Monthly Calibration Report - January 2024",
      "projectId": "...",
      "calibrationDate": "2024-01-15T00:00:00.000Z",
      "calibrationDueDate": "2024-02-15T00:00:00.000Z",
      "status": "Completed",
      "reportLink": "https://example.com/reports/january-2024.pdf",
      "createdBy": "...",
      "createdAt": "...",
      "updatedAt": "..."
    }
  }
}
```

**Error Response (400) - Missing required fields:**
```json
{
  "success": false,
  "error": "Required report fields are missing"
}
```

**Error Response (401) - No token:**
```json
{
  "success": false,
  "error": "No token provided, authorization denied"
}
```

---

## Get All Reports

### GET /api/reports
Retrieve all reports (sorted by creation date, newest first).

```bash
curl -X GET http://localhost:4000/api/reports \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Success Response (200):**
```json
{
  "success": true,
  "message": "Reports retrieved successfully",
  "data": {
    "reports": [
      {
        "_id": "...",
        "reportName": "Monthly Calibration Report - January 2024",
        "projectId": {
          "_id": "...",
          "projectName": "Website Redesign"
        },
        "calibrationDate": "2024-01-15T00:00:00.000Z",
        "calibrationDueDate": "2024-02-15T00:00:00.000Z",
        "status": "Completed",
        "reportLink": "https://example.com/reports/january-2024.pdf",
        "createdBy": {
          "_id": "...",
          "name": "John Doe",
          "email": "john@example.com"
        },
        "createdAt": "...",
        "updatedAt": "..."
      }
    ]
  }
}
```

**Empty Response (200) - No reports:**
```json
{
  "success": true,
  "message": "Reports retrieved successfully",
  "data": {
    "reports": []
  }
}
```

---

## Get Report by ID

### GET /api/reports/:id
Retrieve a single report by its ID.

```bash
curl -X GET http://localhost:4000/api/reports/REPORT_ID_HERE \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Example:**
```bash
curl -X GET http://localhost:4000/api/reports/65a1b2c3d4e5f6789012345 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Success Response (200):**
```json
{
  "success": true,
  "message": "Report retrieved successfully",
  "data": {
    "report": {
      "_id": "65a1b2c3d4e5f6789012345",
      "reportName": "Monthly Calibration Report - January 2024",
      "projectId": {
        "_id": "...",
        "projectName": "Website Redesign"
      },
      "calibrationDate": "2024-01-15T00:00:00.000Z",
      "calibrationDueDate": "2024-02-15T00:00:00.000Z",
      "status": "Completed",
      "reportLink": "https://example.com/reports/january-2024.pdf",
      "createdBy": {
        "_id": "...",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "createdAt": "...",
      "updatedAt": "..."
    }
  }
}
```

**Error Response (404) - Report not found:**
```json
{
  "success": false,
  "error": "Report not found"
}
```

**Error Response (400) - Invalid ID format:**
```json
{
  "success": false,
  "error": "Invalid ID format"
}
```

---

## Update Report

### PUT /api/reports/:id
Update an existing report. You can update any field(s).

```bash
curl -X PUT http://localhost:4000/api/reports/REPORT_ID_HERE \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "reportName": "Updated Report Name",
    "status": "Overdue",
    "reportLink": "https://example.com/reports/updated-report.pdf"
  }'
```

**Example:**
```bash
curl -X PUT http://localhost:4000/api/reports/65a1b2c3d4e5f6789012345 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "status": "Overdue",
    "calibrationDueDate": "2024-03-15T00:00:00.000Z"
  }'
```

**Expected Success Response (200):**
```json
{
  "success": true,
  "message": "Report updated successfully",
  "data": {
    "report": {
      "_id": "65a1b2c3d4e5f6789012345",
      "reportName": "Updated Report Name",
      "projectId": "...",
      "calibrationDate": "2024-01-15T00:00:00.000Z",
      "calibrationDueDate": "2024-03-15T00:00:00.000Z",
      "status": "Overdue",
      "reportLink": "https://example.com/reports/updated-report.pdf",
      "createdBy": "...",
      "createdAt": "...",
      "updatedAt": "..."
    }
  }
}
```

**Error Response (404) - Report not found:**
```json
{
  "success": false,
  "error": "Report not found"
}
```

---

## Delete Report

### DELETE /api/reports/:id
Delete a report by its ID.

```bash
curl -X DELETE http://localhost:4000/api/reports/REPORT_ID_HERE \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Example:**
```bash
curl -X DELETE http://localhost:4000/api/reports/65a1b2c3d4e5f6789012345 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Success Response (200):**
```json
{
  "success": true,
  "message": "Report deleted successfully"
}
```

**Error Response (404) - Report not found:**
```json
{
  "success": false,
  "error": "Report not found"
}
```

---

## Complete Workflow Example

### Step 1: Login to get a token
```bash
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }' | grep -o '"token":"[^"]*' | cut -d'"' -f4)

echo "Token: $TOKEN"
```

### Step 2: Create a project (needed for report)
```bash
PROJECT_ID=$(curl -s -X POST http://localhost:4000/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "projectName": "Test Project",
    "startedAt": "2024-01-15T00:00:00.000Z"
  }' | grep -o '"_id":"[^"]*' | cut -d'"' -f4)

echo "Project ID: $PROJECT_ID"
```

### Step 3: Create a report
```bash
REPORT_ID=$(curl -s -X POST http://localhost:4000/api/reports \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"reportName\": \"Monthly Calibration Report - January 2024\",
    \"projectId\": \"$PROJECT_ID\",
    \"calibrationDate\": \"2024-01-15T00:00:00.000Z\",
    \"calibrationDueDate\": \"2024-02-15T00:00:00.000Z\",
    \"status\": \"Completed\",
    \"reportLink\": \"https://example.com/reports/january-2024.pdf\"
  }" | grep -o '"_id":"[^"]*' | cut -d'"' -f4)

echo "Report ID: $REPORT_ID"
```

### Step 4: Get all reports
```bash
curl -X GET http://localhost:4000/api/reports \
  -H "Authorization: Bearer $TOKEN"
```

### Step 5: Get a specific report
```bash
curl -X GET http://localhost:4000/api/reports/$REPORT_ID \
  -H "Authorization: Bearer $TOKEN"
```

### Step 6: Update the report
```bash
curl -X PUT http://localhost:4000/api/reports/$REPORT_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "status": "Overdue",
    "reportLink": "https://example.com/reports/updated-report.pdf"
  }'
```

### Step 7: Delete the report
```bash
curl -X DELETE http://localhost:4000/api/reports/$REPORT_ID \
  -H "Authorization: Bearer $TOKEN"
```

---

## Field Reference

### Status Options
- `"Completed"` - Report is completed
- `"Pending"` - Report is pending (default)
- `"Overdue"` - Report is overdue

### Date Format
Dates should be in ISO 8601 format:
- `"2024-01-15T00:00:00.000Z"`
- `"2024-01-15T10:30:00.000Z"`

### Example Date Values
```json
{
  "calibrationDate": "2024-01-15T00:00:00.000Z",
  "calibrationDueDate": "2024-02-15T00:00:00.000Z"
}
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

1. **400 Bad Request** - Missing required fields or invalid data format
2. **401 Unauthorized** - Missing or invalid token
3. **404 Not Found** - Report not found or invalid ID format
4. **500 Internal Server Error** - Server error

---

## Notes

- All report routes require authentication via `Authorization: Bearer <token>` header
- The `createdBy` field is automatically set to the authenticated user's ID
- Reports are sorted by creation date (newest first) when retrieving all reports
- The `projectId` field is populated with project name in GET requests
- The `createdBy` field is populated with user details (name, email) in GET requests
- Date fields should be in ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)
- `projectId` must be a valid MongoDB ObjectId
- `reportLink` can be any valid URL string
- `status` defaults to `"Pending"` if not provided

---

## Integration with Other Endpoints

Reports are typically associated with projects. Here's how to use them together:

1. **Create a Project** (using `/api/projects`)
2. **Create Reports** for that project (using `/api/reports` with the project ID)
3. **Get Reports** filtered by project (you may need to filter on the frontend or add query parameters)

**Example: Creating a report for an existing project:**
```bash
# First, get your project ID from the projects endpoint
PROJECT_ID="your-project-id-here"

# Then create a report for that project
curl -X POST http://localhost:4000/api/reports \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d "{
    \"reportName\": \"Q1 2024 Calibration Report\",
    \"projectId\": \"$PROJECT_ID\",
    \"calibrationDate\": \"2024-01-01T00:00:00.000Z\",
    \"calibrationDueDate\": \"2024-04-01T00:00:00.000Z\",
    \"status\": \"Completed\"
  }"
```
