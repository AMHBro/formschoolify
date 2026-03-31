import { getSupabaseServerClient } from "@/lib/supabaseServer";

export async function GET(_: Request, context: { params: Promise<{ token: string }> }) {
  const supabase = getSupabaseServerClient();
  const { token } = await context.params;
  const { data: form, error } = await supabase
    .from("forms")
    .select("id, teacher_id, title, description, token, fields_json, is_open")
    .eq("token", String(token))
    .maybeSingle();
  if (error) {
    return Response.json({ error: "Database error." }, { status: 500 });
  }

  if (!form || !form.is_open) {
    return Response.json({ error: "Form not found." }, { status: 404 });
  }

  return Response.json({
    form: {
      id: String(form.id),
      teacherId: form.teacher_id,
      title: form.title,
      description: form.description,
      token: form.token,
      fields: form.fields_json,
      isOpen: form.is_open,
    },
  });
}

