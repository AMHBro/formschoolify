import { connectDb } from "@/lib/db";
import { sha256 } from "@/lib/hash";
import { Form } from "@/lib/models/Form";
import { Teacher } from "@/lib/models/Teacher";

export async function GET() {
  await connectDb();
  const teachers = await Teacher.find().sort({ createdAt: -1 });

  const withCounts = await Promise.all(
    teachers.map(async (t) => ({
      id: String(t._id),
      fullName: t.fullName,
      phone: t.phone,
      isActive: t.isActive,
      formCount: await Form.countDocuments({ teacherId: String(t._id) }),
    })),
  );

  return Response.json({
    teachers: withCounts,
  });
}

export async function POST(request: Request) {
  await connectDb();
  const { fullName, phone, password } = await request.json();

  if (!fullName || !phone || !password) {
    return Response.json({ error: "fullName, phone and password are required." }, { status: 400 });
  }

  const exists = await Teacher.findOne({ phone: String(phone) });
  if (exists) {
    return Response.json({ error: "Phone already exists." }, { status: 409 });
  }

  const created = await Teacher.create({
    fullName: String(fullName),
    phone: String(phone),
    passwordHash: sha256(String(password)),
    isActive: true,
  });

  return Response.json(
    {
      teacher: {
        id: String(created._id),
        fullName: created.fullName,
        phone: created.phone,
        isActive: created.isActive,
      },
    },
    { status: 201 },
  );
}

