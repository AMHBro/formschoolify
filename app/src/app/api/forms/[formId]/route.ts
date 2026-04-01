import { getSupabaseServerClient } from "@/lib/supabaseServer";

export async function DELETE(_: Request, context: { params: Promise<{ formId: string }> }) {
  const supabase = getSupabaseServerClient();
  const { formId } = await context.params;

  const { error } = await supabase.from("forms").delete().eq("id", String(formId));
  if (error) {
    return Response.json({ error: "Failed to delete form." }, { status: 500 });
  }

  return Response.json({ ok: true });
}
