import { connectDb } from "@/lib/db";
import { Form } from "@/lib/models/Form";

export async function GET(_: Request, context: { params: Promise<{ token: string }> }) {
  await connectDb();
  const { token } = await context.params;
  const form = await Form.findOne({ token: String(token) });

  if (!form || !form.isOpen) {
    return Response.json({ error: "Form not found." }, { status: 404 });
  }

  return Response.json({
    form: {
      id: String(form._id),
      teacherId: form.teacherId,
      title: form.title,
      description: form.description,
      token: form.token,
      fields: form.fields,
      isOpen: form.isOpen,
    },
  });
}

