import { Router } from "express";
import { Teacher } from "../models/Teacher.js";
import { Form } from "../models/Form.js";
import { hashPassword } from "./auth.js";

const router = Router();

// Create teacher (admin only – auth skipped for MVP)
router.post("/teachers", async (req, res) => {
  try {
    const { fullName, phone, password } = req.body;
    if (!fullName || !phone || !password) {
      return res
        .status(400)
        .json({ ok: false, error: { code: "INVALID_PAYLOAD", message: "fullName, phone, and password are required." } });
    }

    const existing = await Teacher.findOne({ phone }).lean();
    if (existing) {
      return res
        .status(409)
        .json({ ok: false, error: { code: "PHONE_EXISTS", message: "Phone is already registered for another teacher." } });
    }

    const teacher = await Teacher.create({
      fullName,
      phone,
      passwordHash: hashPassword(password),
    });

    return res.status(201).json({ ok: true, data: teacher });
  } catch (error) {
    return res
      .status(500)
      .json({ ok: false, error: { code: "INTERNAL_ERROR", message: error.message } });
  }
});

// List teachers with basic stats
router.get("/teachers", async (_req, res) => {
  try {
    const teachers = await Teacher.find().lean();
    const teacherIds = teachers.map((t) => t._id);
    const forms = await Form.aggregate([
      { $match: { teacherId: { $in: teacherIds.map(String) } } },
      { $group: { _id: "$teacherId", formCount: { $sum: 1 } } },
    ]);
    const formCountByTeacher = new Map(forms.map((f) => [f._id, f.formCount]));

    const data = teachers.map((t) => ({
      id: t._id,
      fullName: t.fullName,
      phone: t.phone,
      isActive: t.isActive,
      formCount: formCountByTeacher.get(String(t._id)) || 0,
    }));

    return res.json({ ok: true, data });
  } catch (error) {
    return res
      .status(500)
      .json({ ok: false, error: { code: "INTERNAL_ERROR", message: error.message } });
  }
});

// Toggle teacher active flag
router.patch("/teachers/:id/toggle", async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      return res
        .status(404)
        .json({ ok: false, error: { code: "TEACHER_NOT_FOUND", message: "Teacher not found." } });
    }
    teacher.isActive = !teacher.isActive;
    await teacher.save();
    return res.json({ ok: true, data: teacher });
  } catch (error) {
    return res
      .status(500)
      .json({ ok: false, error: { code: "INTERNAL_ERROR", message: error.message } });
  }
});

export default router;

