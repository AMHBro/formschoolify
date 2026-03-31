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

