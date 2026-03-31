import { getSupabaseServerClient } from "@/lib/supabaseServer";

export async function POST(request: Request) {
  const supabase = getSupabaseServerClient();
  const { formToken, studentName, answers } = await request.json();

  if (!formToken || !studentName) {
    return Response.json({ error: "formToken and studentName are required." }, { status: 400 });
  }

  const { data: form, error: formError } = await supabase
    .from("forms")
    .select("token, is_open")
    .eq("token", String(formToken))
    .maybeSingle();
  if (formError) {
    return Response.json({ error: "Database error." }, { status: 500 });
  }
  if (!form || !form.is_open) {
    return Response.json({ error: "Form is unavailable." }, { status: 404 });
  }

  const { data: submission, error: insertError } = await supabase
    .from("submissions")
    .insert({
      form_token: String(formToken),
      student_name: String(studentName),
      answers_json: typeof answers === "object" && answers ? answers : {},
    })
    .select("id, form_token, student_name, answers_json, created_at")
    .single();
  if (insertError || !submission) {
    return Response.json({ error: "Failed to create submission." }, { status: 500 });
  }

  return Response.json(
    {
      submission: {
        id: String(submission.id),
        formToken: submission.form_token,
        studentName: submission.student_name,
        answers: submission.answers_json,
        createdAt: submission.created_at,
      },
    },
    { status: 201 },
  );
}

