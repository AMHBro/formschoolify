-- PostgreSQL schema for dynamic teacher requests and student submissions

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL CHECK (role IN ('teacher', 'student')),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  deadline TIMESTAMPTZ,
  share_token TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE request_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  field_type TEXT NOT NULL CHECK (field_type IN ('text', 'image', 'pdf', 'file')),
  is_required BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL,
  validation_rules_json JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('draft', 'submitted')),
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (request_id, student_id)
);

CREATE TABLE submission_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  field_id UUID NOT NULL REFERENCES request_fields(id) ON DELETE CASCADE,
  text_value TEXT,
  file_url TEXT,
  original_file_name TEXT,
  stored_file_name TEXT,
  mime_type TEXT,
  file_size BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (submission_id, field_id),
  CHECK (
    (text_value IS NOT NULL AND file_url IS NULL)
    OR
    (text_value IS NULL AND file_url IS NOT NULL)
  )
);

CREATE INDEX idx_requests_teacher_id ON requests(teacher_id);
CREATE INDEX idx_request_fields_request_id ON request_fields(request_id);
CREATE INDEX idx_submissions_request_id ON submissions(request_id);
CREATE INDEX idx_submissions_student_id ON submissions(student_id);
CREATE INDEX idx_submission_values_submission_id ON submission_values(submission_id);

