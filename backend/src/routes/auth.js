import { Router } from "express";
import crypto from "crypto";
import { Admin } from "../models/Admin.js";
import { Teacher } from "../models/Teacher.js";

const router = Router();

function hashPassword(raw) {
  return crypto.createHash("sha256").update(String(raw)).digest("hex");
}

// Admin login (username + password)
router.post("/admin/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res
        .status(400)
        .json({ ok: false, error: { code: "INVALID_PAYLOAD", message: "username and password are required." } });
    }

    const admin = await Admin.findOne({ username }).lean();
    if (!admin || admin.passwordHash !== hashPassword(password)) {
      return res
        .status(401)
        .json({ ok: false, error: { code: "INVALID_CREDENTIALS", message: "Invalid admin credentials." } });
    }

    return res.json({
      ok: true,
      data: {
        adminId: admin._id,
        username: admin.username,
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ ok: false, error: { code: "INTERNAL_ERROR", message: error.message } });
  }
});

// Teacher login (phone + password)
router.post("/teacher/login", async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) {
      return res
        .status(400)
        .json({ ok: false, error: { code: "INVALID_PAYLOAD", message: "phone and password are required." } });
    }

    const teacher = await Teacher.findOne({ phone }).lean();
    if (!teacher || teacher.passwordHash !== hashPassword(password)) {
      return res
        .status(401)
        .json({ ok: false, error: { code: "INVALID_CREDENTIALS", message: "Invalid teacher credentials." } });
    }

    if (!teacher.isActive) {
      return res
        .status(403)
        .json({ ok: false, error: { code: "TEACHER_DISABLED", message: "Teacher is disabled." } });
    }

    return res.json({
      ok: true,
      data: {
        teacherId: teacher._id,
        fullName: teacher.fullName,
        phone: teacher.phone,
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ ok: false, error: { code: "INTERNAL_ERROR", message: error.message } });
  }
});

export { hashPassword };
export default router;

