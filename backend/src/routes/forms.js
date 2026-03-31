import { Router } from "express";
import crypto from "crypto";
import { Form } from "../models/Form.js";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { teacherId, title, fields, namingPattern } = req.body;

    if (!teacherId || !title || !Array.isArray(fields)) {
      return res.status(400).json({
        ok: false,
        error: { code: "INVALID_PAYLOAD", message: "Missing required fields." },
      });
    }

    const publicToken = crypto.randomBytes(12).toString("hex");

    const form = await Form.create({
      teacherId,
      title,
      fields,
      namingPattern: Array.isArray(namingPattern) ? namingPattern : undefined,
      publicToken,
    });

    return res.status(201).json({ ok: true, data: form });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: { code: "INTERNAL_ERROR", message: error.message },
    });
  }
});

// List forms for a teacher
router.get("/by-teacher/:teacherId", async (req, res) => {
  try {
    const forms = await Form.find({ teacherId: req.params.teacherId })
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ ok: true, data: forms });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: { code: "INTERNAL_ERROR", message: error.message },
    });
  }
});

// Toggle open / close form link
router.patch("/:formId/toggle-open", async (req, res) => {
  try {
    const form = await Form.findById(req.params.formId);
    if (!form) {
      return res.status(404).json({
        ok: false,
        error: { code: "FORM_NOT_FOUND", message: "Form not found." },
      });
    }
    form.isOpen = !form.isOpen;
    await form.save();
    return res.json({ ok: true, data: form });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: { code: "INTERNAL_ERROR", message: error.message },
    });
  }
});

router.get("/:token/public", async (req, res) => {
  try {
    const form = await Form.findOne({ publicToken: req.params.token }).lean();
    if (!form) {
      return res.status(404).json({
        ok: false,
        error: { code: "FORM_NOT_FOUND", message: "Form not found." },
      });
    }

    if (!form.isOpen) {
      return res.status(403).json({
        ok: false,
        error: { code: "FORM_CLOSED", message: "Form is closed by the teacher." },
      });
    }

    return res.json({
      ok: true,
      data: {
        id: form._id,
        title: form.title,
        fields: form.fields,
      },
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: { code: "INTERNAL_ERROR", message: error.message },
    });
  }
});

export default router;

