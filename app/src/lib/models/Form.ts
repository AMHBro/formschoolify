import { Schema, model, models } from "mongoose";

const FieldSchema = new Schema(
  {
    id: { type: String, required: true },
    label: { type: String, required: true },
    type: {
      type: String,
      enum: ["text", "number", "image", "file"],
      required: true,
    },
    required: { type: Boolean, default: true },
  },
  { _id: false },
);

const FormSchema = new Schema(
  {
    teacherId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    token: { type: String, required: true, unique: true, index: true },
    fields: { type: [FieldSchema], default: [] },
    isOpen: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Form = models.Form || model("Form", FormSchema);

