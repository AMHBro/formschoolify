"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type FormField = {
  id: string;
  label: string;
  type: "text" | "number" | "image" | "file";
  required: boolean;
};

type TeacherForm = {
  id: string;
  teacherId: string;
  title: string;
  description: string;
  fields: FormField[];
  token: string;
  isOpen: boolean;
  createdAt: string;
};

const API_BASE = "/api";

export default function SubmitByTokenPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token || "";
  const [studentName, setStudentName] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<Record<string, File[]>>({});
  const [message, setMessage] = useState("");
  const [form, setForm] = useState<TeacherForm | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/forms/token/${token}`);
        const json = await res.json();
        if (!res.ok) {
          setForm(null);
        } else {
          setForm(json.form);
        }
      } catch {
        setForm(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  async function submit() {
    if (!form) return;
    if (!form.isOpen) {
      setMessage("هذا النموذج مغلق من قبل الأستاذ.");
      return;
    }
    if (!studentName.trim()) {
      setMessage("يرجى كتابة اسم الطالب.");
      return;
    }
    const missing = form.fields.find((f) => {
      if (!f.required) return false;
      if (f.type === "image" || f.type === "file") {
        return !files[f.id]?.length;
      }
      return !answers[f.id]?.trim();
    });
    if (missing) {
      setMessage(`الحقل مطلوب: ${missing.label}`);
      return;
    }
    const textAnswers = Object.fromEntries(
      Object.entries(answers).filter(([_, value]) => value.trim().length > 0),
    );
    const payload = new FormData();
    payload.set("formToken", form.token);
    payload.set("studentName", studentName.trim());
    payload.set("answers", JSON.stringify(textAnswers));
    for (const field of form.fields) {
      const selected = files[field.id];
      if (selected?.length) {
        for (const f of selected) {
          payload.append(`file_${field.id}`, f);
        }
      }
    }
    const res = await fetch(`${API_BASE}/submissions`, {
      method: "POST",
      body: payload,
    });
    if (!res.ok) {
      setMessage("تعذر إرسال الإجابات.");
      return;
    }
    setMessage("تم إرسال الإجابات بنجاح.");
    setStudentName("");
    setAnswers({});
    setFiles((prev) => {
      const next = { ...prev };
      for (const field of form.fields) {
        if (field.type === "image" || field.type === "file") {
          next[field.id] = [];
        }
      }
      return next;
    });
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f0e9f4] p-6">
        <div className="rounded-xl bg-white p-6 text-sm text-zinc-700 shadow-sm">جارٍ التحميل...</div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f0e9f4] p-6">
        <div className="rounded-xl bg-white p-6 text-sm text-zinc-700 shadow-sm">
          النموذج غير موجود.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0e9f4] p-4 text-[#2e1f45] sm:p-6" style={{ colorScheme: "light" }}>
      <main className="mx-auto max-w-2xl rounded-2xl bg-white p-4 shadow-sm sm:p-6">
        <h1 className="text-2xl font-bold text-[#391f5a]">{form.title}</h1>
        <p className="mt-1 text-sm text-zinc-600">{form.description}</p>
        {!form.isOpen && (
          <p className="mt-3 rounded-lg bg-red-50 p-2 text-sm text-red-600">
            هذا الرابط مغلق من قبل الأستاذ.
          </p>
        )}
        <div className="mt-5 space-y-3">
          <input
            className="w-full rounded-lg border bg-white px-3 py-2 text-[#2e1f45] placeholder:text-zinc-400"
            style={{ borderColor: "#d7cae4" }}
            placeholder="اسم الطالب"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
          />
          {form.fields.map((f) => (
            <div key={f.id}>
              <label className="mb-1 block text-sm font-medium">
                {f.label} {f.required ? "*" : ""}
              </label>
              {f.type === "image" || f.type === "file" ? (
                <div className="space-y-2">
                  <input
                    className="w-full rounded-lg border bg-white px-3 py-2 text-sm text-[#2e1f45] file:mr-3 file:rounded-md file:border-0 file:bg-[#6f459b] file:px-3 file:py-1 file:text-white"
                    style={{ borderColor: "#d7cae4" }}
                    type="file"
                    multiple
                    accept={f.type === "image" ? "image/*" : "*"}
                    onChange={(e) => {
                      const list = e.target.files ? Array.from(e.target.files) : [];
                      setFiles((prev) => ({ ...prev, [f.id]: list }));
                    }}
                  />
                  <p className="text-xs text-zinc-500">
                    {f.type === "image"
                      ? "يمكنك اختيار أكثر من صورة في المرة الواحدة (Ctrl أو السحب لتحديد متعدد)."
                      : "يمكنك اختيار أكثر من ملف في المرة الواحدة."}
                  </p>
                  {files[f.id]?.length ? (
                    <ul className="list-inside list-disc text-xs text-zinc-600">
                      {files[f.id].map((file) => (
                        <li key={`${file.name}-${file.size}-${file.lastModified}`}>{file.name}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ) : (
                <input
                  className="w-full rounded-lg border bg-white px-3 py-2 text-[#2e1f45]"
                  style={{ borderColor: "#d7cae4" }}
                  type={f.type === "number" ? "number" : "text"}
                  value={answers[f.id] || ""}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [f.id]: e.target.value }))}
                />
              )}
            </div>
          ))}
        </div>
        {message && <p className="mt-3 text-sm text-[#391f5a]">{message}</p>}
        <button
          onClick={submit}
          disabled={!form.isOpen}
          className="mt-4 rounded-lg bg-[#6f459b] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          إرسال
        </button>
      </main>
    </div>
  );
}

