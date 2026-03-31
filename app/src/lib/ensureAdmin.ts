import { Admin } from "@/lib/models/Admin";
import { sha256 } from "@/lib/hash";

export async function ensureDefaultAdmin() {
  const existing = await Admin.findOne({ username: "admin" });
  if (!existing) {
    await Admin.create({
      username: "admin",
      passwordHash: sha256("admin123"),
    });
  }
}

