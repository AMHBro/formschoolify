# Smart Form System (MVP)

Dynamic form builder for teachers, public submission form for students, and
automatic filename generation at upload time.

## Workspace structure

- `app/` Next.js frontend
- `backend/` Express + MongoDB API and upload processor
- `docs/` architecture and contracts
- `sql/` optional relational schema draft
- `prisma/` optional Prisma schema draft

## Run frontend

```bash
cd app
npm install
npm run dev
```

## Run backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

## Core capabilities implemented

- Teacher creates dynamic forms with variable fields
- Public token link for each form
- Student submits text answers and files
- Backend validates and renames uploaded files using answer-based pattern
- Submissions stored and queryable per form

