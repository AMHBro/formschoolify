import { connectDb } from "@/lib/db";
import { Teacher } from "@/lib/models/Teacher";

export async function PATCH(_: Request, context: { params: Promise<{ id: string }> }) {
  await connectDb();
  const { id } = await context.params;

  const teacher = await Teacher.findById(id);
  if (!teacher) {
    return Response.json({ error: "Teacher not found." }, { status: 404 });
  }

  teacher.isActive = !teacher.isActive;
  await teacher.save();

  return Response.json({
    teacher: {
      id: String(teacher._id),
      fullName: teacher.fullName,
      phone: teacher.phone,
      isActive: teacher.isActive,
    },
  });
}

