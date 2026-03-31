import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { diagnoseSupabaseFailure } from "@/lib/supabaseDiagnostics";

/**
 * Public readiness check: confirms env + DB schema without exposing secrets.
 * Open GET /api/health on Vercel after setting env vars and running supabase-schema.sql.
 */
export async function GET() {
  const hasUrl = Boolean(process.env.SUPABASE_URL?.trim());
  const hasKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());

  if (!hasUrl || !hasKey) {
    return Response.json(
      {
        ok: false,
        env: { supabaseUrl: hasUrl, serviceRoleKey: hasKey },
        error:
          "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Add them in Vercel → Settings → Environment Variables, then Redeploy.",
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
          env: { supabaseUrl: true, serviceRoleKey: true },
          issue: d.issue,
          error: d.message,
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
        env: { supabaseUrl: hasUrl, serviceRoleKey: hasKey },
        issue: d.issue,
        error: d.message,
      },
      { status: d.httpStatus },
    );
  }
}
