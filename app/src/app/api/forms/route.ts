import crypto from "crypto";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

export async function POST(request: Request) {
  const supabase = getSupabaseServerClient();
  const { teacherId, title, description, fields } = await request.json();

  if (!teacherId || !title) {
    return Response.json({ error: "teacherId and title are required." }, { status: 400 });
  }

  const token = crypto.randomBytes(6).toString("hex");
  const { data: form, error } = await supabase
    .from("forms")
    .insert({
      teacher_id: String(teacherId),
      title: String(title),
      description: String(description ?? ""),
      fields_json: Array.isArray(fields) ? fields : [],
      token,
      is_open: true,
    })
    .select("id, teacher_id, title, description, token, is_open, fields_json, created_at")
    .single();

  if (error || !form) {
    return Response.json({ error: "Failed to create form." }, { status: 500 });
  }

  return Response.json(
    {
      form: {
        id: String(form.id),
        teacherId: form.teacher_id,
        title: form.title,
        description: form.description,
        token: form.token,
        isOpen: form.is_open,
        fields: form.fields_json,
        createdAt: form.created_at,
      },
    },
    { status: 201 },
  );
}

