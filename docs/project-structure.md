# Suggested Next.js Structure

```txt
src/
  app/
    (auth)/
      login/page.tsx
    teacher/
      requests/page.tsx
      requests/new/page.tsx
      requests/[requestId]/page.tsx
    submit/[shareToken]/page.tsx
    api/
      auth/login/route.ts
      teacher/requests/route.ts
      teacher/requests/[requestId]/submissions/route.ts
      teacher/requests/[requestId]/export/route.ts
      public/requests/[shareToken]/route.ts
      student/requests/[requestId]/submissions/route.ts
  components/
    forms/RequestBuilderForm.tsx
    forms/StudentSubmissionForm.tsx
    teacher/SubmissionsTable.tsx
    common/FilePreview.tsx
  lib/
    db.ts
    auth.ts
    validation.ts
    fileNaming.ts
    storage.ts
  types/
    domain.ts
```

## Core modules

- `fileNaming.ts`: sanitize and generate canonical stored filename
- `storage.ts`: upload helper for S3/Cloudinary and URL return
- `validation.ts`: per-field runtime validation using zod
- `RequestBuilderForm.tsx`: dynamic field add/remove/reorder
- `StudentSubmissionForm.tsx`: render fields from API response

