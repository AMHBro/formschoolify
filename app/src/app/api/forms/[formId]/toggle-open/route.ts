import { getSupabaseServerClient } from "@/lib/supabaseServer";

export async function PATCH(_: Request, context: { params: Promise<{ formId: string }> }) {
  const supabase = getSupabaseServerClient();
  const { formId } = await context.params;

  const { data: form, error } = await supabase
    .from("forms")
    .select("id, is_open")
    .eq("id", formId)
    .maybeSingle();
  if (error) {
    return Response.json({ error: "Database error." }, { status: 500 });
  }
  if (!form) {
    return Response.json({ error: "Form not found." }, { status: 404 });
  }

  const { data: updated, error: updateError } = await supabase
    .from("forms")
    .update({ is_open: !form.is_open })
    .eq("id", formId)
    .select("id, is_open")
    .single();
  if (updateError || !updated) {
    return Response.json({ error: "Failed to update form." }, { status: 500 });
  }

  return Response.json({
    form: {
      id: String(updated.id),
      isOpen: updated.is_open,
    },
  });
}

