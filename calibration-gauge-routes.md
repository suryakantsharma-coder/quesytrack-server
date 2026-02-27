# Calibration & Gauge Routes cURL Commands

This file contains cURL commands for testing all calibration and gauge endpoints.

**Base URL:** `http://localhost:4000` (or your configured PORT)

**Note:** All routes require authentication. You must include a valid JWT token in the `Authorization` header.

---

## Prerequisites

Before testing these routes, you need to:
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

# Calibration Routes

## Create Calibration

### POST /api/calibrations
Create a new calibration record with optional file attachments.

**Required Fields:**
- `calibrationId` (string, unique)
- `projectId` (ObjectId - must be a valid project ID)
- `calibrationDate` (Date - ISO 8601 format)
- `calibrationDueDate` (Date - ISO 8601 format)

**Optional Fields:**
- `gaugeId` (ObjectId - valid gauge ID)
- `calibratedBy` (string)
- `calibrationType` (enum: 'Internal', 'External', default: 'Internal')
- `traceability` (enum: 'NIST', 'ISO', 'NABL', 'None', default: 'NIST')
- `certificateNumber` (string)
- `reportLink` (string)
- `files` (multipart/form-data - up to 10 files, max 100MB total)

**With File Upload:**
```bash
curl -X POST http://localhost:4000/api/calibrations \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "calibrationId=CAL-2024-001" \
  -F "projectId=PROJECT_ID_HERE" \
  -F "gaugeId=GAUGE_ID_HERE" \
  -F "calibrationDate=2024-01-15T00:00:00.000Z" \
  -F "calibrationDueDate=2025-01-15T00:00:00.000Z" \
  -F "calibratedBy=John Doe" \
  -F "calibrationType=External" \
  -F "traceability=NABL" \
  -F "certificateNumber=CERT-12345" \
  -F "reportLink=https://example.com/report.pdf" \
  -F "files=@/path/to/certificate1.pdf" \
  -F "files=@/path/to/certificate2.pdf"
```

**Without Files (Minimal Request):**
```bash
curl -X POST http://localhost:4000/api/calibrations \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "calibrationId": "CAL-2024-001",
    "projectId": "PROJECT_ID_HERE",
    "calibrationDate": "2024-01-15T00:00:00.000Z",
    "calibrationDueDate": "2025-01-15T00:00:00.000Z"
  }'
```

**Expected Success Response (201):**
```json
{
  "success": true,
  "message": "Calibration created successfully",
  "data": {
    "calibration": {
      "_id": "...",
      "calibrationId": "CAL-2024-001",
      "projectId": "...",
      "gaugeId": "...",
      "calibrationDate": "2024-01-15T00:00:00.000Z",
      "calibrationDueDate": "2025-01-15T00:00:00.000Z",
      "calibratedBy": "John Doe",
      "calibrationType": "External",
      "traceability": "NABL",
      "certificateNumber": "CERT-12345",
      "reportLink": "https://example.com/report.pdf",
      "attachments": [
        {
          "fileName": "certificate1.pdf",
          "filePath": "uploads/1234567890-certificate1.pdf",
          "fileType": "application/pdf",
          "fileSize": 102400
        }
      ],
      "status": "Completed",
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
  "error": "Required calibration fields are missing"
}
```

---

## Get All Calibrations

### GET /api/calibrations
Retrieve all calibrations (sorted by creation date, newest first).

```bash
curl -X GET http://localhost:4000/api/calibrations \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Success Response (200):**
```json
{
  "success": true,
  "message": "Calibrations retrieved successfully",
  "data": {
    "calibrations": [
      {
        "_id": "...",
        "calibrationId": "CAL-2024-001",
        "projectId": {
          "_id": "...",
          "projectName": "Website Redesign"
        },
        "gaugeId": {
          "_id": "...",
          "gaugeName": "Pressure Gauge 1"
        },
        "calibrationDate": "2024-01-15T00:00:00.000Z",
        "calibrationDueDate": "2025-01-15T00:00:00.000Z",
        "calibratedBy": "John Doe",
        "calibrationType": "External",
        "traceability": "NABL",
        "certificateNumber": "CERT-12345",
        "reportLink": "https://example.com/report.pdf",
        "attachments": [...],
        "status": "Completed",
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

---

## Get Calibration by ID

### GET /api/calibrations/:id
Retrieve a single calibration by its ID.

```bash
curl -X GET http://localhost:4000/api/calibrations/CALIBRATION_ID_HERE \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Example:**
```bash
curl -X GET http://localhost:4000/api/calibrations/65a1b2c3d4e5f6789012345 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Success Response (200):**
```json
{
  "success": true,
  "message": "Calibration retrieved successfully",
  "data": {
    "calibration": {
      "_id": "65a1b2c3d4e5f6789012345",
      "calibrationId": "CAL-2024-001",
      "projectId": {
        "_id": "...",
        "projectName": "Website Redesign"
      },
      "gaugeId": {
        "_id": "...",
        "gaugeName": "Pressure Gauge 1"
      },
      "calibrationDate": "2024-01-15T00:00:00.000Z",
      "calibrationDueDate": "2025-01-15T00:00:00.000Z",
      "attachments": [...],
      "createdAt": "...",
      "updatedAt": "..."
    }
  }
}
```

**Error Response (404) - Calibration not found:**
```json
{
  "success": false,
  "error": "Calibration not found"
}
```

---

## Update Calibration

### PUT /api/calibrations/:id
Update an existing calibration. You can update any field(s) and optionally add more files.

**Note:** New files are appended to existing attachments, not replaced.

```bash
curl -X PUT http://localhost:4000/api/calibrations/CALIBRATION_ID_HERE \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "calibrationType=Internal" \
  -F "traceability=ISO" \
  -F "certificateNumber=CERT-67890" \
  -F "files=@/path/to/new-certificate.pdf"
```

**Update without files (JSON):**
```bash
curl -X PUT http://localhost:4000/api/calibrations/CALIBRATION_ID_HERE \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "calibrationType": "Internal",
    "traceability": "ISO",
    "certificateNumber": "CERT-67890"
  }'
```

**Expected Success Response (200):**
```json
{
  "success": true,
  "message": "Calibration updated successfully",
  "data": {
    "calibration": {
      "_id": "65a1b2c3d4e5f6789012345",
      "calibrationId": "CAL-2024-001",
      "calibrationType": "Internal",
      "traceability": "ISO",
      "certificateNumber": "CERT-67890",
      "attachments": [...],
      "updatedAt": "..."
    }
  }
}
```

**Error Response (404) - Calibration not found:**
```json
{
  "success": false,
  "error": "Calibration not found"
}
```

---

## Delete Calibration

### DELETE /api/calibrations/:id
Delete a calibration by its ID.

```bash
curl -X DELETE http://localhost:4000/api/calibrations/CALIBRATION_ID_HERE \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Example:**
```bash
curl -X DELETE http://localhost:4000/api/calibrations/65a1b2c3d4e5f6789012345 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Success Response (200):**
```json
{
  "success": true,
  "message": "Calibration deleted successfully"
}
```

**Error Response (404) - Calibration not found:**
```json
{
  "success": false,
  "error": "Calibration not found"
}
```

---

# Gauge Routes

## Create Gauge

### POST /api/gauges
Create a new gauge with optional image uploads.

**Required Fields:**
- `gaugeName` (string)
- `gaugeType` (enum: 'Pressure', 'Temperature', 'Flow', 'Vacuum', 'Electrical', 'Mechanical', 'Other')

**Optional Fields:**
- `gaugeModel` (string)
- `manufacturer` (string)
- `location` (string)
- `traceability` (enum: 'NIST', 'ISO', 'NABL', 'None', default: 'NIST')
- `nominalSize` (string)
- `status` (enum: 'Active', 'Inactive', 'Under Calibration', 'Retired', default: 'Active')
- `projectId` (ObjectId - valid project ID)
- `images` (multipart/form-data - up to 10 images)

**With Image Upload:**
```bash
curl -X POST http://localhost:4000/api/gauges \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "gaugeName=Pressure Gauge 1" \
  -F "gaugeType=Pressure" \
  -F "gaugeModel=PG-100" \
  -F "manufacturer=ABC Instruments" \
  -F "location=Lab A" \
  -F "traceability=NIST" \
  -F "nominalSize=100 PSI" \
  -F "status=Active" \
  -F "projectId=PROJECT_ID_HERE" \
  -F "images=@/path/to/gauge-image1.jpg" \
  -F "images=@/path/to/gauge-image2.jpg"
```

**Without Images (Minimal Request):**
```bash
curl -X POST http://localhost:4000/api/gauges \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "gaugeName": "Pressure Gauge 1",
    "gaugeType": "Pressure"
  }'
```

**Expected Success Response (201):**
```json
{
  "success": true,
  "message": "Gauge created successfully",
  "data": {
    "gauge": {
      "_id": "...",
      "gaugeName": "Pressure Gauge 1",
      "gaugeType": "Pressure",
      "gaugeModel": "PG-100",
      "manufacturer": "ABC Instruments",
      "location": "Lab A",
      "traceability": "NIST",
      "nominalSize": "100 PSI",
      "status": "Active",
      "image": "uploads/1234567890-gauge-image1.jpg",
      "projectId": "...",
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
  "error": "Gauge name and type are required"
}
```

---

## Get All Gauges

### GET /api/gauges
Retrieve all gauges.

```bash
curl -X GET http://localhost:4000/api/gauges \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Success Response (200):**
```json
{
  "success": true,
  "message": "Gauges retrieved successfully",
  "data": {
    "gauges": [
      {
        "_id": "...",
        "gaugeName": "Pressure Gauge 1",
        "gaugeType": "Pressure",
        "gaugeModel": "PG-100",
        "manufacturer": "ABC Instruments",
        "location": "Lab A",
        "traceability": "NIST",
        "nominalSize": "100 PSI",
        "status": "Active",
        "image": "uploads/1234567890-gauge-image1.jpg",
        "projectId": {
          "_id": "...",
          "projectName": "Website Redesign"
        },
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

---

## Get Gauge by ID

### GET /api/gauges/:id
Retrieve a single gauge by its ID.

```bash
curl -X GET http://localhost:4000/api/gauges/GAUGE_ID_HERE \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Example:**
```bash
curl -X GET http://localhost:4000/api/gauges/65a1b2c3d4e5f6789012345 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Success Response (200):**
```json
{
  "success": true,
  "message": "Gauge retrieved successfully",
  "data": {
    "gauge": {
      "_id": "65a1b2c3d4e5f6789012345",
      "gaugeName": "Pressure Gauge 1",
      "gaugeType": "Pressure",
      "gaugeModel": "PG-100",
      "manufacturer": "ABC Instruments",
      "location": "Lab A",
      "traceability": "NIST",
      "nominalSize": "100 PSI",
      "status": "Active",
      "image": "uploads/1234567890-gauge-image1.jpg",
      "projectId": {
        "_id": "...",
        "projectName": "Website Redesign"
      },
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

**Error Response (404) - Gauge not found:**
```json
{
  "success": false,
  "error": "Gauge not found"
}
```

---

## Update Gauge

### PUT /api/gauges/:id
Update an existing gauge. You can update any field(s) and optionally update the image.

```bash
curl -X PUT http://localhost:4000/api/gauges/GAUGE_ID_HERE \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "status=Under Calibration" \
  -F "location=Lab B" \
  -F "images=@/path/to/new-gauge-image.jpg"
```

**Update without image (JSON):**
```bash
curl -X PUT http://localhost:4000/api/gauges/GAUGE_ID_HERE \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "Under Calibration",
    "location": "Lab B",
    "traceability": "ISO"
  }'
```

**Expected Success Response (200):**
```json
{
  "success": true,
  "message": "Gauge updated successfully",
  "data": {
    "gauge": {
      "_id": "65a1b2c3d4e5f6789012345",
      "gaugeName": "Pressure Gauge 1",
      "status": "Under Calibration",
      "location": "Lab B",
      "traceability": "ISO",
      "image": "uploads/1234567890-new-gauge-image.jpg",
      "updatedAt": "..."
    }
  }
}
```

**Error Response (404) - Gauge not found:**
```json
{
  "success": false,
  "error": "Gauge not found"
}
```

---

## Delete Gauge

### DELETE /api/gauges/:id
Delete a gauge by its ID.

```bash
curl -X DELETE http://localhost:4000/api/gauges/GAUGE_ID_HERE \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Example:**
```bash
curl -X DELETE http://localhost:4000/api/gauges/65a1b2c3d4e5f6789012345 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Success Response (200):**
```json
{
  "success": true,
  "message": "Gauge deleted successfully"
}
```

**Error Response (404) - Gauge not found:**
```json
{
  "success": false,
  "error": "Gauge not found"
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

### Step 2: Create a project (needed for gauge/calibration)
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

### Step 3: Create a gauge
```bash
GAUGE_ID=$(curl -s -X POST http://localhost:4000/api/gauges \
  -H "Authorization: Bearer $TOKEN" \
  -F "gaugeName=Test Gauge" \
  -F "gaugeType=Pressure" \
  -F "projectId=$PROJECT_ID" \
  -F "status=Active" | grep -o '"_id":"[^"]*' | cut -d'"' -f4)

echo "Gauge ID: $GAUGE_ID"
```

### Step 4: Create a calibration
```bash
curl -X POST http://localhost:4000/api/calibrations \
  -H "Authorization: Bearer $TOKEN" \
  -F "calibrationId=CAL-TEST-001" \
  -F "projectId=$PROJECT_ID" \
  -F "gaugeId=$GAUGE_ID" \
  -F "calibrationDate=2024-01-15T00:00:00.000Z" \
  -F "calibrationDueDate=2025-01-15T00:00:00.000Z" \
  -F "calibrationType=External" \
  -F "traceability=NABL"
```

### Step 5: Get all gauges
```bash
curl -X GET http://localhost:4000/api/gauges \
  -H "Authorization: Bearer $TOKEN"
```

### Step 6: Get all calibrations
```bash
curl -X GET http://localhost:4000/api/calibrations \
  -H "Authorization: Bearer $TOKEN"
```

---

## Field Reference

### Calibration Fields

**calibrationType Options:**
- `"Internal"` (default)
- `"External"`

**traceability Options:**
- `"NIST"` (default)
- `"ISO"`
- `"NABL"`
- `"None"`

**status Options:**
- `"Completed"` (default)
- `"Pending"`
- `"Overdue"`

### Gauge Fields

**gaugeType Options:**
- `"Pressure"`
- `"Temperature"`
- `"Flow"`
- `"Vacuum"`
- `"Electrical"`
- `"Mechanical"`
- `"Other"`

**traceability Options:**
- `"NIST"` (default)
- `"ISO"`
- `"NABL"`
- `"None"`

**status Options:**
- `"Active"` (default)
- `"Inactive"`
- `"Under Calibration"`
- `"Retired"`

### Date Format
Dates should be in ISO 8601 format:
- `"2024-01-15T00:00:00.000Z"`
- `"2024-01-15T10:30:00.000Z"`

---

## File Upload Notes

### Calibration Files
- Field name: `files`
- Maximum: 10 files per request
- Maximum size: 100MB total (configured in multer)
- Files are stored in `uploads/` directory
- File information is stored in the `attachments` array

### Gauge Images
- Field name: `images`
- Maximum: 10 images per request
- Images are stored in `uploads/` directory
- Only the first image path is stored in the `image` field

### File Upload Tips
1. Use `-F` flag for multipart/form-data (file uploads)
2. Use `-H "Content-Type: application/json"` with `-d` for JSON-only requests
3. File paths should be absolute or relative to your current directory
4. Example: `-F "files=@./documents/certificate.pdf"`

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
3. **404 Not Found** - Resource not found or invalid ID format
4. **500 Internal Server Error** - Server error

---

## Notes

- All routes require authentication via `Authorization: Bearer <token>` header
- The `createdBy` field is automatically set to the authenticated user's ID
- Calibrations are sorted by creation date (newest first) when retrieving all
- File uploads use multipart/form-data format
- When updating calibrations, new files are appended to existing attachments
- When updating gauges, new images replace the existing image
- Date fields should be in ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)
- `calibrationId` must be unique across all calibrations
- `projectId` and `gaugeId` must be valid MongoDB ObjectIds
