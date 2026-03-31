import mongoose from "mongoose";

const UploadedFileSchema = new mongoose.Schema(
  {
    fieldKey: { type: String, required: true },
    originalName: { type: String, required: true },
    storedName: { type: String, required: true },
    mimeType: { type: String, required: true },
    url: { type: String, required: true },
  },
  { _id: false },
);

const SubmissionSchema = new mongoose.Schema(
  {
    formId: { type: mongoose.Schema.Types.ObjectId, ref: "Form", required: true },
    studentId: { type: String, required: true, index: true },
    answers: { type: mongoose.Schema.Types.Mixed, default: {} },
    files: { type: [UploadedFileSchema], default: [] },
  },
  { timestamps: true },
);

SubmissionSchema.index({ formId: 1, studentId: 1 }, { unique: true });

export const Submission = mongoose.model("Submission", SubmissionSchema);

