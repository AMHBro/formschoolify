import { Schema, model, models } from "mongoose";

const SubmissionSchema = new Schema(
  {
    formToken: { type: String, required: true, index: true },
    studentName: { type: String, required: true },
    answers: { type: Object, default: {} },
  },
  { timestamps: true },
);

export const Submission = models.Submission || model("Submission", SubmissionSchema);

