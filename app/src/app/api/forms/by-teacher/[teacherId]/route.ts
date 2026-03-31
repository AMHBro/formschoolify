import { getSupabaseServerClient } from "@/lib/supabaseServer";

export async function GET(_: Request, context: { params: Promise<{ teacherId: string }> }) {
  const supabase = getSupabaseServerClient();
  const { teacherId } = await context.params;
  const { data: forms, error } = await supabase
    .from("forms")
    .select("id, teacher_id, title, description, token, is_open, fields_json, created_at")
    .eq("teacher_id", String(teacherId))
    .order("created_at", { ascending: false });
  if (error) {
    return Response.json({ error: "Database error." }, { status: 500 });
  }

  return Response.json({
    forms: (forms ?? []).map((f) => ({
      id: String(f.id),
      teacherId: f.teacher_id,
      title: f.title,
      description: f.description,
      token: f.token,
      isOpen: f.is_open,
      fields: f.fields_json,
      createdAt: f.created_at,
    })),
  });
}

