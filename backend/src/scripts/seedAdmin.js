import "dotenv/config";
import { connectDb } from "../config/db.js";
import crypto from "crypto";
import { Admin } from "../models/Admin.js";

function hashPassword(raw) {
  return crypto.createHash("sha256").update(String(raw)).digest("hex");
}

async function main() {
  await connectDb(process.env.MONGODB_URI);

  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "admin123";

  const existing = await Admin.findOne({ username }).lean();
  if (existing) {
    console.log(`[seedAdmin] Admin "${username}" already exists.`);
    process.exit(0);
  }

  await Admin.create({
    username,
    passwordHash: hashPassword(password),
  });

  console.log(`[seedAdmin] Created admin "${username}".`);
  process.exit(0);
}

main().catch((err) => {
  console.error("[seedAdmin] Failed:", err?.message || err);
  process.exit(1);
});

