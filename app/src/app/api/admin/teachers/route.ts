import { sha256 } from "@/lib/hash";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

export async function GET() {
  const supabase = getSupabaseServerClient();
  const { data: teachers, error } = await supabase
    .from("teachers")
    .select("id, full_name, phone, is_active, created_at")
    .order("created_at", { ascending: false });
  if (error) {
    return Response.json({ error: "Database error." }, { status: 500 });
  }

  const { data: formsCountRows, error: formsCountError } = await supabase
    .from("forms")
    .select("teacher_id");
  if (formsCountError) {
    return Response.json({ error: "Database error." }, { status: 500 });
  }

  const countByTeacher = new Map<string, number>();
  for (const row of formsCountRows ?? []) {
    const teacherId = String(row.teacher_id);
    countByTeacher.set(teacherId, (countByTeacher.get(teacherId) ?? 0) + 1);
  }

  return Response.json({
    teachers: (teachers ?? []).map((t) => ({
      id: String(t.id),
      fullName: t.full_name,
      phone: t.phone,
      isActive: t.is_active,
      formCount: countByTeacher.get(String(t.id)) ?? 0,
    })),
  });
}

export async function POST(request: Request) {
  const supabase = getSupabaseServerClient();
  const { fullName, phone, password } = await request.json();

  if (!fullName || !phone || !password) {
    return Response.json({ error: "fullName, phone and password are required." }, { status: 400 });
  }

  const { data: exists, error: existsError } = await supabase
    .from("teachers")
    .select("id")
    .eq("phone", String(phone))
    .maybeSingle();
  if (existsError) {
    return Response.json({ error: "Database error." }, { status: 500 });
  }
  if (exists) {
    return Response.json({ error: "Phone already exists." }, { status: 409 });
  }

  const { data: created, error: createError } = await supabase
    .from("teachers")
    .insert({
      full_name: String(fullName),
      phone: String(phone),
      password_hash: sha256(String(password)),
      is_active: true,
    })
    .select("id, full_name, phone, is_active")
    .single();

  if (createError || !created) {
    return Response.json({ error: "Failed to create teacher." }, { status: 500 });
  }

  return Response.json(
    {
      teacher: {
        id: String(created.id),
        fullName: created.full_name,
        phone: created.phone,
        isActive: created.is_active,
      },
    },
    { status: 201 },
  );
}

