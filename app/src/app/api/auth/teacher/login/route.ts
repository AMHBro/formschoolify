import { connectDb } from "@/lib/db";
import { sha256 } from "@/lib/hash";
import { Teacher } from "@/lib/models/Teacher";

export async function POST(request: Request) {
  await connectDb();
  const { phone, password } = await request.json();

  if (!phone || !password) {
    return Response.json({ error: "Phone and password are required." }, { status: 400 });
  }

  const teacher = await Teacher.findOne({ phone: String(phone) });
  if (!teacher || teacher.passwordHash !== sha256(String(password))) {
    return Response.json({ error: "Invalid credentials." }, { status: 401 });
  }

  if (!teacher.isActive) {
    return Response.json({ error: "Teacher account is inactive." }, { status: 403 });
  }

  return Response.json({
    teacher: {
      id: String(teacher._id),
      fullName: teacher.fullName,
      phone: teacher.phone,
    },
  });
}

