import { ensureDefaultAdmin } from "@/lib/ensureAdmin";
import { sha256 } from "@/lib/hash";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

export async function POST(request: Request) {
  try {
    await ensureDefaultAdmin();
    const supabase = getSupabaseServerClient();

    const { username, password } = await request.json();
    if (!username || !password) {
      return Response.json({ error: "Username and password are required." }, { status: 400 });
    }

    const { data: admin, error } = await supabase
      .from("admins")
      .select("id, username, password_hash")
      .eq("username", String(username))
      .maybeSingle();
    if (error) {
      throw error;
    }

    if (!admin || admin.password_hash !== sha256(String(password))) {
      return Response.json({ error: "Invalid credentials." }, { status: 401 });
    }

    return Response.json({
      admin: {
        id: String(admin.id),
        username: admin.username,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    return Response.json(
      {
        error:
          "Server configuration error. Verify SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY and schema.",
      },
      { status: 500 },
    );
  }
}

