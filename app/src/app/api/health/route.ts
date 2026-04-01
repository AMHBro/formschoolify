import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { diagnoseSupabaseFailure } from "@/lib/supabaseDiagnostics";

/**
 * Public readiness check: confirms env + DB schema without exposing secrets.
 * Open GET /api/health on Vercel after setting env vars and running supabase-schema.sql.
 */
export async function GET() {
  const hasUrl = Boolean(process.env.SUPABASE_URL?.trim());
  const hasKey = Boolean(
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || process.env.SUPABASE_SECRET_KEY?.trim(),
  );

  if (!hasUrl || !hasKey) {
    return Response.json(
      {
        ok: false,
        env: {
          supabaseUrl: hasUrl,
          serviceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()),
          secretKey: Boolean(process.env.SUPABASE_SECRET_KEY?.trim()),
        },
        error:
          "Missing SUPABASE_URL or key. Add SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY) in Vercel → Settings → Environment Variables, then Redeploy.",
        hintAr:
          "من Supabase: Project Settings → API → انسخ Project URL و service_role (السري) وليس anon.",
      },
      { status: 503 },
    );
  }

  try {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.from("admins").select("id").limit(1);
    if (error) {
      const d = diagnoseSupabaseFailure(error);
      return Response.json(
        {
          ok: false,
          env: {
            supabaseUrl: true,
            serviceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()),
            secretKey: Boolean(process.env.SUPABASE_SECRET_KEY?.trim()),
          },
          issue: d.issue,
          error: d.message,
          ...(d.postgrestCode ? { postgrestCode: d.postgrestCode } : {}),
        },
        { status: d.httpStatus },
      );
    }

    return Response.json({
      ok: true,
      env: { supabaseUrl: true, serviceRoleKey: true },
      database: "admins_table_reachable",
    });
  } catch (err) {
    const d = diagnoseSupabaseFailure(err);
    return Response.json(
      {
        ok: false,
        env: {
          supabaseUrl: hasUrl,
          serviceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()),
          secretKey: Boolean(process.env.SUPABASE_SECRET_KEY?.trim()),
        },
        issue: d.issue,
        error: d.message,
        ...(d.postgrestCode ? { postgrestCode: d.postgrestCode } : {}),
      },
      { status: d.httpStatus },
    );
  }
}
