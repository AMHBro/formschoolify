# Smart Form System (MVP)

Dynamic form builder for teachers, public submission form for students, and
automatic filename generation at upload time.

## Workspace structure

- `app/` Next.js frontend
- `backend/` Express + MongoDB API and upload processor
- `docs/` architecture and contracts
- `sql/` optional relational schema draft
- `prisma/` optional Prisma schema draft

## Run app (Next.js + API + Supabase)

```bash
cd app
npm install
cp .env.example .env.local
# add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
npm run dev
```

## Supabase setup

1. Open Supabase SQL Editor.
2. Run `app/supabase-schema.sql`.
3. Use the project URL and service role key in `.env.local` and Vercel env vars.

## Core capabilities implemented

- Teacher creates dynamic forms with variable fields
- Public token link for each form
- Student submits answers through Next.js API routes
- Forms and submissions are persisted in Supabase Postgres
- Admin login and teacher management are persisted in Supabase Postgres

