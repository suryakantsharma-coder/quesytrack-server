# Calibration Update API – Attachments (cURL)

**Base URL:** `http://localhost:4000`

**Endpoint:** `PUT /api/calibrations/:id`  
All requests require authentication: `Authorization: Bearer <token>`.

You can:
- **Add** new attachments (send files in multipart).
- **Replace** existing attachments (send `attachments` in the body as JSON array).
- **Replace and add** in one request (send `attachments` + new files).

---

## 1. Update calibration (fields only, no attachments change)

```bash
export TOKEN="your-jwt-token"
export CAL_ID="your-calibration-mongodb-id"

curl -s -X PUT "http://localhost:4000/api/calibrations/$CAL_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "calibrationDate": "2025-03-01",
    "calibrationDueDate": "2025-03-15",
    "status": "completed",
    "calibratedBy": "John Doe"
  }'
```

---

## 2. Add new attachment(s) only (keep all previous)

Send **multipart/form-data** with field name `files`. New files are **appended** to existing attachments.

```bash
curl -s -X PUT "http://localhost:4000/api/calibrations/$CAL_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -F "files=@/path/to/report1.pdf" \
  -F "files=@/path/to/certificate.pdf"
```

Single file:

```bash
curl -s -X PUT "http://localhost:4000/api/calibrations/$CAL_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -F "files=@./report.pdf"
```

---

## 3. Remove all attachments (replace with empty list)

Send `attachments` as an empty array. Use **JSON** body (no new files).

```bash
curl -s -X PUT "http://localhost:4000/api/calibrations/$CAL_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"attachments":[]}'
```

---

## 4. Replace attachments with a new list (no new uploads)

Send the exact list of attachments you want to keep. Each item: `fileName`, `filePath`, `fileType`, `fileSize`.  
Use this to **remove some** by sending only the ones you want to keep.

```bash
curl -s -X PUT "http://localhost:4000/api/calibrations/$CAL_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "attachments": [
      {
        "fileName": "existing-report.pdf",
        "filePath": "uploads/1234567890-existing-report.pdf",
        "fileType": "application/pdf",
        "fileSize": 10240
      }
    ]
  }'
```

To remove all and set a new list from existing data (e.g. after deleting one from the list):

```bash
curl -s -X PUT "http://localhost:4000/api/calibrations/$CAL_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"attachments":[{"fileName":"kept.pdf","filePath":"uploads/1-kept.pdf","fileType":"application/pdf","fileSize":5000}]}'
```

---

## 5. Replace previous attachments and add new file(s) in one request

Send **multipart/form-data** with:
- `attachments`: JSON string of the new base list (can be `[]` to remove all previous).
- `files`: new file(s) to append.

Result: `attachments` replaces the current list, then new uploads are appended.

**Remove all old attachments and upload one new file:**
```bash
curl -s -X PUT "http://localhost:4000/api/calibrations/$CAL_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -F 'attachments=[]' \
  -F "files=@/path/to/new-report.pdf"
```

**Keep one existing attachment and add one new file:**
```bash
curl -s -X PUT "http://localhost:4000/api/calibrations/$CAL_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -F 'attachments=[{"fileName":"old.pdf","filePath":"uploads/1-old.pdf","fileType":"application/pdf","fileSize":1000}]' \
  -F "files=@/path/to/new-report.pdf"
```

---

## 6. Other fields with multipart (replace attachments + update fields)

You can send both `attachments` and other calibration fields in the same multipart request.

```bash
curl -s -X PUT "http://localhost:4000/api/calibrations/$CAL_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -F 'attachments=[]' \
  -F "files=@./new-report.pdf" \
  -F "status=completed" \
  -F "calibratedBy=Jane Doe"
```

Note: With multipart, non-file fields are strings. The server parses `attachments` as JSON when it is a string.

---

## Response (success)

```json
{
  "success": true,
  "message": "Calibration updated successfully",
  "data": {
    "calibration": {
      "_id": "...",
      "calibrationId": "C-001",
      "attachments": [
        {
          "fileName": "report.pdf",
          "filePath": "uploads/1769...-report.pdf",
          "fileType": "application/pdf",
          "fileSize": 12345
        }
      ],
      ...
    }
  }
}
```

---

## Summary

| Goal | How |
|------|-----|
| Add new file(s) only | `PUT` with multipart, field `files` (no `attachments` in body). |
| Remove all attachments | `PUT` with JSON body `{"attachments":[]}`. |
| Keep only some attachments | `PUT` with JSON body `{"attachments":[{...},{...}]}` (list to keep). |
| Replace all and add new file(s) | `PUT` with multipart: `attachments=[]` or `attachments=[...]` + `files=@...`. |
