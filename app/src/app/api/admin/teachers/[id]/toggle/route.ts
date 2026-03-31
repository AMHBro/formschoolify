import { getSupabaseServerClient } from "@/lib/supabaseServer";

export async function PATCH(_: Request, context: { params: Promise<{ id: string }> }) {
  const supabase = getSupabaseServerClient();
  const { id } = await context.params;

  const { data: teacher, error } = await supabase
    .from("teachers")
    .select("id, full_name, phone, is_active")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return Response.json({ error: "Database error." }, { status: 500 });
  }
  if (!teacher) {
    return Response.json({ error: "Teacher not found." }, { status: 404 });
  }

  const { data: updated, error: updateError } = await supabase
    .from("teachers")
    .update({ is_active: !teacher.is_active })
    .eq("id", id)
    .select("id, full_name, phone, is_active")
    .single();

  if (updateError || !updated) {
    return Response.json({ error: "Failed to update teacher." }, { status: 500 });
  }

  return Response.json({
    teacher: {
      id: String(updated.id),
      fullName: updated.full_name,
      phone: updated.phone,
      isActive: updated.is_active,
    },
  });
}

