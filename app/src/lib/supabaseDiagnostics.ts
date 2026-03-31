type SupabaseIssue =
  | "missing_env"
  | "invalid_key_or_url"
  | "schema_missing"
  | "unknown";

export type SupabaseDiagnostic = {
  issue: SupabaseIssue;
  /** Safe user-facing message (Arabic + English hint) */
  message: string;
  /** HTTP status to return from API routes when appropriate */
  httpStatus: number;
};

function compactMessage(s: string) {
  return s.replace(/\s+/g, " ").trim();
}

/**
 * Maps Supabase/PostgREST/network errors to actionable messages without leaking secrets.
 */
export function diagnoseSupabaseFailure(error: unknown): SupabaseDiagnostic {
  const msg = error instanceof Error ? error.message : String(error);
  const raw = compactMessage(msg);
  const lower = raw.toLowerCase();

  if (raw.includes("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")) {
    return {
      issue: "missing_env",
      message:
        "لم يُضبط الخادم: أضف SUPABASE_URL و SUPABASE_SERVICE_ROLE_KEY في متغيرات بيئة Vercel (أو .env.local محليًا) ثم أعد النشر. | Server misconfigured: add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, then redeploy.",
      httpStatus: 503,
    };
  }

  if (
    lower.includes("invalid api key") ||
    lower.includes("jwt") && lower.includes("invalid") ||
    lower.includes("invalid signature") ||
    (lower.includes("unauthorized") && lower.includes("api key"))
  ) {
    return {
      issue: "invalid_key_or_url",
      message:
        "مفتاح Supabase غير صالح: انسخ service_role السري من Project Settings → API (ليس anon). تأكد أن SUPABASE_URL لمشروعك نفسه. | Invalid Supabase key: use secret service_role from Project Settings → API (not anon), matching SUPABASE_URL.",
      httpStatus: 503,
    };
  }

  if (
    lower.includes("does not exist") ||
    lower.includes("schema cache") ||
    lower.includes("pgrst205")
  ) {
    return {
      issue: "schema_missing",
      message:
        "الجداول غير موجودة: نفّذ app/supabase-schema.sql في Supabase → SQL Editor ثم جرّب مجددًا. | Tables missing: run app/supabase-schema.sql in Supabase SQL Editor.",
      httpStatus: 503,
    };
  }

  return {
    issue: "unknown",
    message:
      "خطأ من Supabase. راجع سجلات Vercel واتصال المشروع. | Supabase error: check Vercel logs and project connection.",
    httpStatus: 500,
  };
}
