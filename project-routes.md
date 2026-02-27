# Project Routes cURL Commands

This file contains cURL commands for testing all project endpoints.

**Base URL:** `http://localhost:4000` (or your configured PORT)

**Note:** All project routes require authentication. You must include a valid JWT token in the `Authorization` header.

---

## Prerequisites

Before testing project routes, you need to:
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

## Create Project

### POST /api/projects
Create a new project.

**Required Fields:**
- `projectName` (string)
- `startedAt` (Date - ISO 8601 format)

**Optional Fields:**
- `projectDescription` (string)
- `overdue` (number, default: 0)
- `progress` (enum: 'Not Started', 'In Progress', 'Completed', 'On Hold', default: 'Not Started')
- `status` (enum: 'Active', 'Inactive', 'Completed', default: 'Active')

```bash
curl -X POST http://localhost:4000/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "projectName": "Website Redesign",
    "projectDescription": "Complete redesign of company website",
    "overdue": 0,
    "progress": "In Progress",
    "status": "Active",
    "startedAt": "2024-01-15T00:00:00.000Z"
  }'
```

**Minimal Request (required fields only):**
```bash
curl -X POST http://localhost:4000/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "projectName": "New Project",
    "startedAt": "2024-01-15T00:00:00.000Z"
  }'
```

**Expected Success Response (201):**
```json
{
  "success": true,
  "message": "Project created successfully",
  "data": {
    "project": {
      "_id": "...",
      "projectName": "Website Redesign",
      "projectDescription": "Complete redesign of company website",
      "overdue": 0,
      "progress": "In Progress",
      "status": "Active",
      "startedAt": "2024-01-15T00:00:00.000Z",
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
  "error": "Project name and start date are required"
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

## Get All Projects

### GET /api/projects
Retrieve all projects (sorted by creation date, newest first).

```bash
curl -X GET http://localhost:4000/api/projects \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Success Response (200):**
```json
{
  "success": true,
  "message": "Projects retrieved successfully",
  "data": {
    "projects": [
      {
        "_id": "...",
        "projectName": "Website Redesign",
        "projectDescription": "Complete redesign of company website",
        "overdue": 0,
        "progress": "In Progress",
        "status": "Active",
        "startedAt": "2024-01-15T00:00:00.000Z",
        "createdBy": {
          "_id": "...",
          "name": "John Doe",
          "email": "john@example.com",
          "role": "Admin"
        },
        "createdAt": "...",
        "updatedAt": "..."
      }
    ]
  }
}
```

**Empty Response (200) - No projects:**
```json
{
  "success": true,
  "message": "Projects retrieved successfully",
  "data": {
    "projects": []
  }
}
```

---

## Get Project by ID

### GET /api/projects/:id
Retrieve a single project by its ID.

```bash
curl -X GET http://localhost:4000/api/projects/PROJECT_ID_HERE \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Example:**
```bash
curl -X GET http://localhost:4000/api/projects/65a1b2c3d4e5f6789012345 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Success Response (200):**
```json
{
  "success": true,
  "message": "Project retrieved successfully",
  "data": {
    "project": {
      "_id": "65a1b2c3d4e5f6789012345",
      "projectName": "Website Redesign",
      "projectDescription": "Complete redesign of company website",
      "overdue": 0,
      "progress": "In Progress",
      "status": "Active",
      "startedAt": "2024-01-15T00:00:00.000Z",
      "createdBy": {
        "_id": "...",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "Admin"
      },
      "createdAt": "...",
      "updatedAt": "..."
    }
  }
}
```

**Error Response (404) - Project not found:**
```json
{
  "success": false,
  "error": "Project not found"
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

## Update Project

### PUT /api/projects/:id
Update an existing project. You can update any field(s).

```bash
curl -X PUT http://localhost:4000/api/projects/PROJECT_ID_HERE \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "projectName": "Updated Project Name",
    "progress": "Completed",
    "status": "Completed",
    "overdue": 5
  }'
```

**Example:**
```bash
curl -X PUT http://localhost:4000/api/projects/65a1b2c3d4e5f6789012345 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "progress": "Completed",
    "status": "Completed"
  }'
```

**Expected Success Response (200):**
```json
{
  "success": true,
  "message": "Project updated successfully",
  "data": {
    "project": {
      "_id": "65a1b2c3d4e5f6789012345",
      "projectName": "Updated Project Name",
      "projectDescription": "Complete redesign of company website",
      "overdue": 5,
      "progress": "Completed",
      "status": "Completed",
      "startedAt": "2024-01-15T00:00:00.000Z",
      "createdBy": "...",
      "createdAt": "...",
      "updatedAt": "..."
    }
  }
}
```

**Error Response (404) - Project not found:**
```json
{
  "success": false,
  "error": "Project not found"
}
```

---

## Delete Project

### DELETE /api/projects/:id
Delete a project by its ID.

```bash
curl -X DELETE http://localhost:4000/api/projects/PROJECT_ID_HERE \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Example:**
```bash
curl -X DELETE http://localhost:4000/api/projects/65a1b2c3d4e5f6789012345 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Success Response (200):**
```json
{
  "success": true,
  "message": "Project deleted successfully"
}
```

**Error Response (404) - Project not found:**
```json
{
  "success": false,
  "error": "Project not found"
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

### Step 2: Create a new project
```bash
curl -X POST http://localhost:4000/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "projectName": "My New Project",
    "projectDescription": "Project description here",
    "startedAt": "2024-01-15T00:00:00.000Z",
    "progress": "Not Started",
    "status": "Active"
  }'
```

### Step 3: Get all projects
```bash
curl -X GET http://localhost:4000/api/projects \
  -H "Authorization: Bearer $TOKEN"
```

### Step 4: Get a specific project (replace PROJECT_ID)
```bash
curl -X GET http://localhost:4000/api/projects/PROJECT_ID \
  -H "Authorization: Bearer $TOKEN"
```

### Step 5: Update the project
```bash
curl -X PUT http://localhost:4000/api/projects/PROJECT_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "progress": "In Progress",
    "overdue": 2
  }'
```

### Step 6: Delete the project
```bash
curl -X DELETE http://localhost:4000/api/projects/PROJECT_ID \
  -H "Authorization: Bearer $TOKEN"
```

---

## Field Reference

### Progress Options
- `"Not Started"` (default)
- `"In Progress"`
- `"Completed"`
- `"On Hold"`

### Status Options
- `"Active"` (default)
- `"Inactive"`
- `"Completed"`

### Date Format
Dates should be in ISO 8601 format:
- `"2024-01-15T00:00:00.000Z"`
- `"2024-01-15T10:30:00.000Z"`

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
3. **404 Not Found** - Project not found or invalid ID format
4. **500 Internal Server Error** - Server error

---

## Notes

- All project routes require authentication via `Authorization: Bearer <token>` header
- The `createdBy` field is automatically set to the authenticated user's ID
- Projects are sorted by creation date (newest first) when retrieving all projects
- The `createdBy` field is populated with user details (name, email, role) in GET requests
- Date fields should be in ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)
- The `overdue` field must be a non-negative number
