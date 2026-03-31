import { connectDb } from "@/lib/db";
import { Form } from "@/lib/models/Form";
import { Submission } from "@/lib/models/Submission";

export async function POST(request: Request) {
  await connectDb();
  const { formToken, studentName, answers } = await request.json();

  if (!formToken || !studentName) {
    return Response.json({ error: "formToken and studentName are required." }, { status: 400 });
  }

  const form = await Form.findOne({ token: String(formToken) });
  if (!form || !form.isOpen) {
    return Response.json({ error: "Form is unavailable." }, { status: 404 });
  }

  const submission = await Submission.create({
    formToken: String(formToken),
    studentName: String(studentName),
    answers: typeof answers === "object" && answers ? answers : {},
  });

  return Response.json(
    {
      submission: {
        id: String(submission._id),
        formToken: submission.formToken,
        studentName: submission.studentName,
        answers: submission.answers,
        createdAt: submission.createdAt,
      },
    },
    { status: 201 },
  );
}

