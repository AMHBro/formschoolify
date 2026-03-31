import { connectDb } from "@/lib/db";
import { Form } from "@/lib/models/Form";

export async function PATCH(_: Request, context: { params: Promise<{ formId: string }> }) {
  await connectDb();
  const { formId } = await context.params;

  const form = await Form.findById(formId);
  if (!form) {
    return Response.json({ error: "Form not found." }, { status: 404 });
  }

  form.isOpen = !form.isOpen;
  await form.save();

  return Response.json({
    form: {
      id: String(form._id),
      isOpen: form.isOpen,
    },
  });
}

