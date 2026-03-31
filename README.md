# Smart Form System (MVP)

Dynamic form builder for teachers, public submission form for students, and
automatic filename generation at upload time.

## Workspace structure

- `app/` Next.js frontend
- `backend/` Express + MongoDB API and upload processor
- `docs/` architecture and contracts
- `sql/` optional relational schema draft
- `prisma/` optional Prisma schema draft

## Run app (Next.js + API + Mongo Atlas)

```bash
cd app
npm install
cp .env.example .env.local
# add your Mongo Atlas connection string in .env.local
npm run dev
```

## Core capabilities implemented

- Teacher creates dynamic forms with variable fields
- Public token link for each form
- Student submits answers through Next.js API routes
- Forms and submissions are persisted in MongoDB (Atlas-ready)
- Admin login and teacher management are persisted in MongoDB

