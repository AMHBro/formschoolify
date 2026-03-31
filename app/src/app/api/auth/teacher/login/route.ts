import { sha256 } from "@/lib/hash";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

export async function POST(request: Request) {
  const supabase = getSupabaseServerClient();
  const { phone, password } = await request.json();

  if (!phone || !password) {
    return Response.json({ error: "Phone and password are required." }, { status: 400 });
  }

  const { data: teacher, error } = await supabase
    .from("teachers")
    .select("id, full_name, phone, password_hash, is_active")
    .eq("phone", String(phone))
    .maybeSingle();
  if (error) {
    return Response.json({ error: "Database error." }, { status: 500 });
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
}

