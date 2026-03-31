import { connectDb } from "@/lib/db";
import { Submission } from "@/lib/models/Submission";

export async function GET(_: Request, context: { params: Promise<{ token: string }> }) {
  await connectDb();
  const { token } = await context.params;

  const submissions = await Submission.find({ formToken: String(token) }).sort({ createdAt: -1 });
  return Response.json({
    submissions: submissions.map((s) => ({
      id: String(s._id),
      formToken: s.formToken,
      studentName: s.studentName,
      answers: s.answers,
      createdAt: s.createdAt,
    })),
  });
}

