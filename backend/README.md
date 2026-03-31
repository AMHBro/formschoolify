# Smart Form Backend (Express + MongoDB)

This backend implements:

- Dynamic form creation for teachers
- Public token-based form retrieval for students
- File upload endpoint with automatic smart renaming
- Submission storage per student per form

## Run locally

1. Copy env:
   - `cp .env.example .env`
2. Install:
   - `npm install`
3. Start:
   - `npm run dev`

## Seed admin account

بعد تشغيل MongoDB ونجاح اتصال الـbackend:

```bash
node src/scripts/seedAdmin.js
```

سيقوم بإنشاء مدير افتراضي:
- username: `admin`
- password: `admin123`

## API endpoints

- `POST /api/forms`
  - Create form
- `GET /api/forms/:token/public`
  - Fetch public form by token
- `POST /api/submissions/:token`
  - Upload student answers and files
- `GET /api/submissions/form/:formId`
  - Teacher list of submissions

## Request payload examples

### Create form

```json
{
  "teacherId": "teacher-001",
  "title": "Registration Documents",
  "namingPattern": ["fullName", "section", "documentType"],
  "fields": [
    { "key": "fullName", "label": "Full Name", "type": "text", "required": true },
    { "key": "section", "label": "Section", "type": "text", "required": true },
    { "key": "idPhoto", "label": "ID Photo", "type": "image", "required": true }
  ]
}
```

### Submit form

Use `multipart/form-data`:

- `studentId`: `student-001`
- `answers`: JSON string, e.g. `{"fullName":"Ali Hassan","section":"A","documentType":"ID"}`
- file field key must match form field key, e.g. `idPhoto`

