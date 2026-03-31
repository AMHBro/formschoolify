import mongoose from "mongoose";

const FieldSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
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

const FormSchema = new mongoose.Schema(
  {
    teacherId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    publicToken: { type: String, required: true, unique: true, index: true },
    fields: { type: [FieldSchema], default: [] },
    namingPattern: { type: [String], default: ["fullName", "documentType"] },
    isOpen: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Form = mongoose.model("Form", FormSchema);

