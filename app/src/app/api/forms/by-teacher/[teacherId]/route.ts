import { connectDb } from "@/lib/db";
import { Form } from "@/lib/models/Form";

export async function GET(_: Request, context: { params: Promise<{ teacherId: string }> }) {
  await connectDb();
  const { teacherId } = await context.params;
  const forms = await Form.find({ teacherId: String(teacherId) }).sort({ createdAt: -1 });

  return Response.json({
    forms: forms.map((f) => ({
      id: String(f._id),
      teacherId: f.teacherId,
      title: f.title,
      description: f.description,
      token: f.token,
      isOpen: f.isOpen,
      fields: f.fields,
      createdAt: f.createdAt,
    })),
  });
}

