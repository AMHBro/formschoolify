# API Contract (MVP)

Base prefix: `/api`

## Auth

- `POST /auth/login`
  - body: `{ email, password }`
  - returns: `{ token, user }`

## Teacher APIs

- `POST /teacher/requests`
  - create request with dynamic fields
  - body:
    - `title`, `description`, `deadline`
    - `fields[]`: `{ label, fieldType, isRequired, sortOrder, validationRules }`
  - returns: created request + `shareToken`

- `GET /teacher/requests`
  - list requests owned by teacher

- `GET /teacher/requests/:requestId/submissions`
  - list all student submissions with status and values

- `GET /teacher/requests/:requestId/export.csv`
  - returns CSV containing student info, field values, and file links

## Student APIs

- `GET /public/requests/:shareToken`
  - fetch request metadata and fields for rendering form

- `POST /student/requests/:requestId/submissions`
  - submit text values and file uploads
  - multipart form-data:
    - `studentId`
    - `values[fieldId]=text`
    - `files[fieldId]=binary`
  - server validates per field type and renames uploaded files

## Response pattern

Use a consistent response shape:

- success: `{ ok: true, data }`
- error: `{ ok: false, error: { code, message } }`

## Suggested error codes

- `UNAUTHORIZED`
- `FORBIDDEN`
- `REQUEST_NOT_FOUND`
- `FIELD_VALIDATION_FAILED`
- `FILE_TYPE_MISMATCH`
- `DEADLINE_EXPIRED`
- `INTERNAL_SERVER_ERROR`

