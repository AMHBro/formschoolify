type SupabaseIssue =
  | "missing_env"
  | "invalid_key_or_url"
  | "schema_missing"
  | "rls_or_permission"
  | "jwt_auth"
  | "storage"
  | "network"
  | "unknown";

export type SupabaseDiagnostic = {
  issue: SupabaseIssue;
  /** Safe user-facing message (Arabic + English hint) */
  message: string;
  /** HTTP status to return from API routes when appropriate */
  httpStatus: number;
  /** PostgREST / Postgres error code when present (safe to expose) */
  postgrestCode?: string;
};

function compactMessage(s: string) {
  return s.replace(/\s+/g, " ").trim();
}

function asRecord(e: unknown): Record<string, unknown> | null {
  if (e && typeof e === "object") return e as Record<string, unknown>;
  return null;
}

/**
 * Flattens Supabase PostgREST errors (message + details + hint) and optional `code`.
 */
export function flattenSupabaseError(error: unknown): { text: string; code?: string } {
  const r = asRecord(error);
  if (r) {
    const code = typeof r.code === "string" ? r.code : undefined;
    const parts = [
      typeof r.message === "string" ? r.message : "",
      typeof r.details === "string" ? r.details : "",
      typeof r.hint === "string" ? r.hint : "",
    ].filter(Boolean);
    if (parts.length) {
      return { text: compactMessage(parts.join(" ")), code };
    }
  }
  if (error instanceof Error && error.message) {
    return { text: compactMessage(error.message) };
  }
  return { text: compactMessage(String(error)) };
}

/**
 * Maps Supabase/PostgREST/network errors to actionable messages without leaking secrets.
 */
export function diagnoseSupabaseFailure(error: unknown): SupabaseDiagnostic {
  const { text: raw, code } = flattenSupabaseError(error);
  const lower = raw.toLowerCase();
  const codeUpper = code?.toUpperCase() ?? "";

  const baseUnknown = (
    msg: string,
    issue: SupabaseIssue = "unknown",
    httpStatus = 500,
  ): SupabaseDiagnostic => ({
    issue,
    message: code
      ? `${msg} | PostgREST/DB code: ${code}`
      : msg,
    httpStatus,
    postgrestCode: code,
  });

  if (
    raw.includes("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set") ||
    raw.includes("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY) must be set")
  ) {
    return {
      issue: "missing_env",
      message:
        "لم يُضبط الخادم: أضف SUPABASE_URL مع SUPABASE_SERVICE_ROLE_KEY (أو SUPABASE_SECRET_KEY) في متغيرات بيئة Vercel ثم أعد النشر. | Server misconfigured: add SUPABASE_URL with SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY), then redeploy.",
      httpStatus: 503,
    };
  }

  const jwtHint =
    (lower.includes("jwt") && (lower.includes("invalid") || lower.includes("expired") || lower.includes("malformed"))) ||
    codeUpper === "PGRST301" ||
    codeUpper === "PGRST302";

  if (jwtHint) {
    return {
      issue: "jwt_auth",
      message:
        "مشكلة JWT/المفتاح: انسخ مفتاح service_role الحالي من Supabase → Settings → API (قد يكون المفتاح منتهيًا أو ليس لمشروعك). | JWT/key issue: paste a fresh service_role key from Project Settings → API (key may be revoked or from another project).",
      httpStatus: 503,
      postgrestCode: code,
    };
  }

  const invalidKey =
    lower.includes("invalid api key") ||
    (lower.includes("unauthorized") && lower.includes("api key")) ||
    lower.includes("double check your supabase") ||
    lower.includes("invalid signature");

  if (invalidKey) {
    return {
      issue: "invalid_key_or_url",
      message:
        "مفتاح Supabase غير صالح: انسخ service_role السري من Project Settings → API (ليس anon). تأكد أن SUPABASE_URL لمشروعك نفسه. | Invalid Supabase key: use secret service_role from Project Settings → API (not anon), matching SUPABASE_URL.",
      httpStatus: 503,
      postgrestCode: code,
    };
  }

  const schemaMissing =
    lower.includes("does not exist") ||
    lower.includes("schema cache") ||
    lower.includes("pgrst205") ||
    codeUpper === "42P01" ||
    codeUpper === "PGRST204" ||
    (lower.includes("relation") && lower.includes("not exist"));

  if (schemaMissing) {
    return {
      issue: "schema_missing",
      message:
        "الجداول أو الأعمدة غير متوافقة: نفّذ app/supabase-schema.sql في Supabase → SQL Editor ثم جرّب مجددًا. | Tables/columns mismatch: run app/supabase-schema.sql in Supabase SQL Editor.",
      httpStatus: 503,
      postgrestCode: code,
    };
  }

  const rls =
    lower.includes("permission denied") ||
    lower.includes("row-level security") ||
    lower.includes("row level security") ||
    lower.includes("violates row-level security") ||
    (lower.includes("policy") && lower.includes("violat")) ||
    codeUpper === "42501";

  if (rls) {
    return {
      issue: "rls_or_permission",
      message:
        "رفض الوصول (RLS/صلاحيات): للخادم استخدم SUPABASE_SERVICE_ROLE_KEY (service_role) وليس anon؛ أو راجع سياسات RLS على الجداول في Supabase. | Access denied: server must use SUPABASE_SERVICE_ROLE_KEY (not anon), or review RLS policies on tables.",
      httpStatus: 503,
      postgrestCode: code,
    };
  }

  const storage =
    lower.includes("bucket") ||
    lower.includes("storage") && (lower.includes("not found") || lower.includes("object") || lower.includes("policy"));

  if (storage) {
    return {
      issue: "storage",
      message:
        "مشكلة Storage: أنشئ دلوًا عامًا باسم student-uploads من Storage → New bucket (أو راجع الصلاحيات). | Storage issue: create a public bucket named student-uploads (Storage → New bucket) or check policies.",
      httpStatus: 503,
      postgrestCode: code,
    };
  }

  const network =
    lower.includes("fetch failed") ||
    lower.includes("failed to fetch") ||
    lower.includes("network") && lower.includes("error") ||
    lower.includes("econnrefused") ||
    lower.includes("enotfound") ||
    lower.includes("getaddrinfo") ||
    lower.includes("socket hang up") ||
    lower.includes("connect timeout") ||
    lower.includes("certificate") ||
    lower.includes("ssl");

  if (network) {
    return {
      issue: "network",
      message:
        "تعذر الاتصال بخادم Supabase (شبكة/DNS/SSL). تحقق من SUPABASE_URL وأن مشروع Supabase يعمل. | Cannot reach Supabase (network/DNS/SSL). Verify SUPABASE_URL and that the Supabase project is active.",
      httpStatus: 503,
      postgrestCode: code,
    };
  }

  return baseUnknown(
    "خطأ من Supabase. راجع سجلات Vercel (ستجد تفاصيل الخطأ بجانب console.error) وجرّب GET /api/health. | Supabase error: check Vercel function logs for the logged error details; try GET /api/health on the same deployment.",
  );
}
