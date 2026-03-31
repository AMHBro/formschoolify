import { connectDb } from "@/lib/db";
import { Form } from "@/lib/models/Form";
import crypto from "crypto";

export async function POST(request: Request) {
  await connectDb();
  const { teacherId, title, description, fields } = await request.json();

  if (!teacherId || !title) {
    return Response.json({ error: "teacherId and title are required." }, { status: 400 });
  }

  const token = crypto.randomBytes(6).toString("hex");
  const form = await Form.create({
    teacherId: String(teacherId),
    title: String(title),
    description: String(description ?? ""),
    fields: Array.isArray(fields) ? fields : [],
    token,
    isOpen: true,
  });

  return Response.json(
    {
      form: {
        id: String(form._id),
        teacherId: form.teacherId,
        title: form.title,
        description: form.description,
        token: form.token,
        isOpen: form.isOpen,
        fields: form.fields,
        createdAt: form.createdAt,
      },
    },
    { status: 201 },
  );
}

