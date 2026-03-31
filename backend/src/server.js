import "dotenv/config";
import cors from "cors";
import express from "express";
import { connectDb } from "./config/db.js";
import formsRouter from "./routes/forms.js";
import submissionsRouter from "./routes/submissions.js";
import authRouter from "./routes/auth.js";
import adminRouter from "./routes/admin.js";

const app = express();
const port = process.env.PORT || 4000;

app.use(cors({ origin: process.env.APP_URL || "*" }));
app.use(express.json());

app.get("/health", (_, res) => {
  res.json({ ok: true, message: "Backend is healthy." });
});

app.use("/api/forms", formsRouter);
app.use("/api/submissions", submissionsRouter);
app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);

async function start() {
  try {
    await connectDb(process.env.MONGODB_URI);
    app.listen(port, () => {
      console.log(`Server started on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

start();

