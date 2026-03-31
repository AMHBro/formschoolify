import { connectDb } from "@/lib/db";
import { ensureDefaultAdmin } from "@/lib/ensureAdmin";
import { sha256 } from "@/lib/hash";
import { Admin } from "@/lib/models/Admin";

export async function POST(request: Request) {
  await connectDb();
  await ensureDefaultAdmin();

  const { username, password } = await request.json();
  if (!username || !password) {
    return Response.json({ error: "Username and password are required." }, { status: 400 });
  }

  const admin = await Admin.findOne({ username: String(username) });
  if (!admin || admin.passwordHash !== sha256(String(password))) {
    return Response.json({ error: "Invalid credentials." }, { status: 401 });
  }

  return Response.json({
    admin: {
      id: String(admin._id),
      username: admin.username,
    },
  });
}

