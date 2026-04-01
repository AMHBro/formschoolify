-- FormSchoolify: full database setup for Supabase
-- 1) Open Supabase → SQL Editor → New query
-- 2) Paste this entire file → Run
-- 3) "Success. No rows returned" on some statements is normal (DDL / upserts)
--
-- Password hashes match the app (SHA-256 hex of UTF-8 password), via pgcrypto digest().
-- Default logins after seed (change in production):
--   Admin:    username admin     / password admin123
--   Teacher:  phone 0500000000   / password admin123

create extension if not exists pgcrypto;

-- --- Schema (same as supabase-schema.sql) ---

create table if not exists admins (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists teachers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null unique,
  password_hash text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists forms (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references teachers(id) on delete cascade,
  title text not null,
  description text not null default '',
  token text not null unique,
  fields_json jsonb not null default '[]'::jsonb,
  is_open boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_forms_teacher_id on forms(teacher_id);
create index if not exists idx_forms_token on forms(token);

create table if not exists submissions (
  id uuid primary key default gen_random_uuid(),
  form_token text not null references forms(token) on delete cascade,
  student_name text not null,
  answers_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_submissions_form_token on submissions(form_token);

-- --- Storage (uploads from /api/submissions) ---

insert into storage.buckets (id, name, public)
values ('student-uploads', 'student-uploads', true)
on conflict (id) do update set public = excluded.public;

-- --- Optional seed (safe to re-run) ---

insert into admins (username, password_hash)
values ('admin', encode(digest('admin123', 'sha256'), 'hex'))
on conflict (username) do update set password_hash = excluded.password_hash;

insert into teachers (full_name, phone, password_hash, is_active)
values (
  'معلم تجريبي',
  '0500000000',
  encode(digest('admin123', 'sha256'), 'hex'),
  true
)
on conflict (phone) do update
  set password_hash = excluded.password_hash,
      is_active = excluded.is_active,
      full_name = excluded.full_name;
