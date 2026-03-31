import { getSupabaseServerClient } from "@/lib/supabaseServer";

export async function GET(_: Request, context: { params: Promise<{ token: string }> }) {
  const supabase = getSupabaseServerClient();
  const { token } = await context.params;

  const { data: submissions, error } = await supabase
    .from("submissions")
    .select("id, form_token, student_name, answers_json, created_at")
    .eq("form_token", String(token))
    .order("created_at", { ascending: false });
  if (error) {
    return Response.json({ error: "Database error." }, { status: 500 });
  }

  return Response.json({
    submissions: (submissions ?? []).map((s) => ({
      id: String(s.id),
      formToken: s.form_token,
      studentName: s.student_name,
      answers: s.answers_json,
      createdAt: s.created_at,
    })),
  });
}

