import { sha256 } from "@/lib/hash";
import { diagnoseSupabaseFailure, flattenSupabaseError } from "@/lib/supabaseDiagnostics";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

export async function POST(request: Request) {
  try {
    let body: { phone?: unknown; password?: unknown };
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const { phone, password } = body;
    if (!phone || !password) {
      return Response.json({ error: "Phone and password are required." }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    const { data: teacher, error } = await supabase
      .from("teachers")
      .select("id, full_name, phone, password_hash, is_active")
      .eq("phone", String(phone))
      .limit(1)
      .maybeSingle();
    if (error) {
      throw error;
    }

    if (!teacher || teacher.password_hash !== sha256(String(password))) {
      return Response.json({ error: "Invalid credentials." }, { status: 401 });
    }

    if (!teacher.is_active) {
      return Response.json({ error: "Teacher account is inactive." }, { status: 403 });
    }

    return Response.json({
      teacher: {
        id: String(teacher.id),
        fullName: teacher.full_name,
        phone: teacher.phone,
      },
    });
  } catch (error) {
    console.error("Teacher login error:", flattenSupabaseError(error), error);
    const d = diagnoseSupabaseFailure(error);
    return Response.json(
      {
        error: d.message,
        issue: d.issue,
        ...(d.postgrestCode ? { postgrestCode: d.postgrestCode } : {}),
      },
      { status: d.httpStatus },
    );
  }
}

