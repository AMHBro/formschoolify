import { Router } from "express";
import multer from "multer";
import { Form } from "../models/Form.js";
import { Submission } from "../models/Submission.js";
import { buildSmartFilename } from "../utils/fileNaming.js";
import { validateUploadByFieldType } from "../utils/validation.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/:token", upload.any(), async (req, res) => {
  try {
    const form = await Form.findOne({ publicToken: req.params.token });
    if (!form) {
      return res.status(404).json({
        ok: false,
        error: { code: "FORM_NOT_FOUND", message: "Form not found." },
      });
    }

    const studentId = req.body.studentId;
    const answers = req.body.answers ? JSON.parse(req.body.answers) : {};

    if (!studentId) {
      return res.status(400).json({
        ok: false,
        error: { code: "INVALID_PAYLOAD", message: "studentId is required." },
      });
    }

    const files = [];
    for (const file of req.files || []) {
      const fieldDef = form.fields.find((f) => f.key === file.fieldname);
      if (!fieldDef) {
        return res.status(400).json({
          ok: false,
          error: {
            code: "FIELD_NOT_FOUND",
            message: `Unknown field: ${file.fieldname}`,
          },
        });
      }

      if (!validateUploadByFieldType(fieldDef.type, file.mimetype)) {
        return res.status(400).json({
          ok: false,
          error: {
            code: "FILE_TYPE_MISMATCH",
            message: `Invalid type for field ${fieldDef.label}`,
          },
        });
      }

      const storedName = buildSmartFilename({
        namingPattern: form.namingPattern,
        answers,
        fallbackFieldLabel: fieldDef.label,
        originalName: file.originalname,
      });

      // Placeholder storage URL; replace with S3/Firebase upload result.
      const url = `https://storage.example.com/${form._id}/${storedName}`;

      files.push({
        fieldKey: fieldDef.key,
        originalName: file.originalname,
        storedName,
        mimeType: file.mimetype,
        url,
      });
    }

    const submission = await Submission.findOneAndUpdate(
      { formId: form._id, studentId },
      { formId: form._id, studentId, answers, files },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    return res.status(201).json({ ok: true, data: submission });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: { code: "INTERNAL_ERROR", message: error.message },
    });
  }
});

router.get("/form/:formId", async (req, res) => {
  try {
    const submissions = await Submission.find({ formId: req.params.formId }).lean();
    return res.json({ ok: true, data: submissions });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: { code: "INTERNAL_ERROR", message: error.message },
    });
  }
});

export default router;

