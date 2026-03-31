import { Schema, model, models } from "mongoose";

const TeacherSchema = new Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Teacher = models.Teacher || model("Teacher", TeacherSchema);

