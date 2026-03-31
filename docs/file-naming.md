# File Naming and Validation Rules

## Canonical naming format

Use this format when storing student uploads:

`{StudentName}_{FieldLabel}_{YYYYMMDD}_{shortId}.{ext}`

Example:

`Ali_Hassan_ID_Card_20260331_a8f3.jpg`

## Rules

1. Sanitize `StudentName` and `FieldLabel`:
   - trim spaces
   - convert spaces to `_`
   - remove non-alphanumeric characters except `_` and `-`
2. Date must be UTC in `YYYYMMDD`.
3. Add short unique suffix (`shortId`) to prevent collisions.
4. Keep original name in DB (`original_file_name`) for audit.
5. Store MIME type and size in DB.

## Validation by field type

- `image`: allow `image/jpeg`, `image/png`, optionally `image/webp`
- `pdf`: allow `application/pdf` only
- `file`: allow configurable list from `validation_rules_json`
- `text`: no file accepted

Reject mismatched MIME types even if file extension seems correct.

## Backend pseudo flow

1. Receive multipart payload.
2. Resolve `student` and `field` metadata from DB.
3. Validate file type against field configuration.
4. Generate canonical stored filename.
5. Upload file to cloud storage.
6. Save returned URL and file metadata to `submission_values`.

