"use client";

import { useEffect, useMemo, useState } from "react";

type FieldType = "text" | "number" | "image" | "file";

type FormField = {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
};

type StudentResponse = {
  id: string;
  studentName: string;
  submittedAt: string;
  status: "submitted" | "pending";
};

const BRAND = {
  royalPurple: "#6f459b",
  darkPurple: "#391f5a",
  lavenderMist: "#f0e9f4",
};

const API_BASE = "http://localhost:4000/api";

function createDefaultField(type: FieldType): FormField {
  return {
    id: crypto.randomUUID(),
    label:
      type === "text"
        ? "سؤال نصي"
        : type === "number"
          ? "سؤال رقمي"
          : type === "image"
            ? "رفع صورة"
            : "رفع ملف",
    type,
    required: true,
  };
}

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [activePanel, setActivePanel] = useState<"builder" | "responses">(
    "builder",
  );

  const [title, setTitle] = useState("نموذج طلب مستندات التسجيل");
  const [description, setDescription] = useState("يرجى تعبئة البيانات ورفع المرفقات المطلوبة.");
  const [fields, setFields] = useState<FormField[]>([
    createDefaultField("text"),
    createDefaultField("image"),
  ]);
  const [responses] = useState<StudentResponse[]>([
    {
      id: "1",
      studentName: "Ali Hassan",
      submittedAt: "2026-03-31 09:15",
      status: "submitted",
    },
    {
      id: "2",
      studentName: "Sara Ahmed",
      submittedAt: "-",
      status: "pending",
    },
  ]);
  const DEMO_PASSWORD = "123456";

  useEffect(() => {
    const teacherId = localStorage.getItem("teacherId");
    if (teacherId) setIsLoggedIn(true);
  }, []);

  const shareLink = useMemo(() => {
    const slug = title.trim().replace(/\s+/g, "-").toLowerCase();
    return `https://your-domain.com/form/${slug || "new-form"}`;
  }, [title]);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    (async () => {
      try {
        setLoginError("");
        const res = await fetch(`${API_BASE}/auth/teacher/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: email, password }),
        });
        const json = await res.json();
        if (!json.ok) {
          setLoginError(json.error?.message || "بيانات الدخول غير صحيحة.");
        } else {
          localStorage.setItem("teacherId", json.data.teacherId);
          localStorage.setItem("teacherName", json.data.fullName);
          setIsLoggedIn(true);
        }
      } catch {
        // Offline/demo fallback when backend is unavailable.
        if (email.trim().length > 0 && password === DEMO_PASSWORD) {
          localStorage.setItem("teacherId", "demo-teacher-id");
          localStorage.setItem("teacherName", `Teacher ${email.trim()}`);
          setIsLoggedIn(true);
          setLoginError("");
        } else {
          setLoginError("الخادم غير متاح. في وضع التجربة: أي رقم هاتف + 123456");
        }
      }
    })();
  }

  function addField(type: FieldType) {
    setFields((prev) => [...prev, createDefaultField(type)]);
  }

  function updateField(id: string, patch: Partial<FormField>) {
    setFields((prev) =>
      prev.map((field) => (field.id === id ? { ...field, ...patch } : field)),
    );
  }

  function removeField(id: string) {
    setFields((prev) => prev.filter((field) => field.id !== id));
  }

  function moveField(id: string, direction: "up" | "down") {
    setFields((prev) => {
      const index = prev.findIndex((f) => f.id === id);
      if (index === -1) return prev;
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= prev.length) return prev;
      const cloned = [...prev];
      [cloned[index], cloned[target]] = [cloned[target], cloned[index]];
      return cloned;
    });
  }

  function logout() {
    localStorage.removeItem("teacherId");
    localStorage.removeItem("teacherName");
    setIsLoggedIn(false);
    setEmail("");
    setPassword("");
  }

  if (!isLoggedIn) {
    return (
      <div
        className="flex min-h-screen items-center justify-center p-6"
        style={{ backgroundColor: BRAND.lavenderMist }}
      >
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold" style={{ color: BRAND.darkPurple }}>
            تسجيل دخول المعلم
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            أدخل بياناتك للدخول إلى منشئ النماذج.
          </p>
          <form className="mt-6 space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="mb-1 block text-sm font-medium">رقم الهاتف</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none"
                style={{ borderColor: "#d7cae4" }}
                placeholder="مثال: 0770000000"
                type="text"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">كلمة المرور</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none"
                style={{ borderColor: "#d7cae4" }}
                placeholder="******"
                type="password"
                required
              />
            </div>
            {loginError && <p className="text-sm text-red-600">{loginError}</p>}
            <button
              type="submit"
              className="w-full rounded-lg px-4 py-2 font-medium text-white"
              style={{ backgroundColor: BRAND.royalPurple }}
            >
              دخول
            </button>
          </form>
          <p className="mt-4 rounded-lg bg-zinc-100 p-3 text-xs text-zinc-600">
            Demo Login (بدون خادم): أي رقم هاتف + 123456
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 text-zinc-900" style={{ backgroundColor: BRAND.lavenderMist }}>
      <main className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.45fr_1fr]">
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: BRAND.darkPurple }}>
                لوحة المعلم
              </h1>
              <p className="mt-1 text-sm text-zinc-600">
                إنشاء نموذج بسيط + متابعة ردود الطلاب.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActivePanel("builder")}
                className="rounded-lg px-3 py-2 text-sm text-white"
                style={{
                  backgroundColor:
                    activePanel === "builder" ? BRAND.royalPurple : BRAND.darkPurple,
                }}
              >
                منشئ النموذج
              </button>
              <button
                onClick={() => setActivePanel("responses")}
                className="rounded-lg px-3 py-2 text-sm text-white"
                style={{
                  backgroundColor:
                    activePanel === "responses" ? BRAND.royalPurple : BRAND.darkPurple,
                }}
              >
                ردود الطلاب
              </button>
              <button
                onClick={logout}
                className="rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: "#d7cae4", color: BRAND.darkPurple }}
              >
                خروج
              </button>
            </div>
          </div>

          {activePanel === "builder" ? (
            <>
              <div className="space-y-4">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border px-4 py-3 text-lg font-semibold outline-none"
                  style={{ borderColor: "#d7cae4" }}
                  placeholder="عنوان النموذج"
                />
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-24 w-full rounded-lg border px-4 py-3 outline-none"
                  style={{ borderColor: "#d7cae4" }}
                  placeholder="وصف النموذج"
                />
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <button onClick={() => addField("text")} className="rounded-lg px-3 py-2 text-sm text-white" style={{ backgroundColor: BRAND.royalPurple }}>+ نص</button>
                <button onClick={() => addField("number")} className="rounded-lg px-3 py-2 text-sm text-white" style={{ backgroundColor: BRAND.royalPurple }}>+ رقم</button>
                <button onClick={() => addField("image")} className="rounded-lg px-3 py-2 text-sm text-white" style={{ backgroundColor: BRAND.royalPurple }}>+ صورة</button>
                <button onClick={() => addField("file")} className="rounded-lg px-3 py-2 text-sm text-white" style={{ backgroundColor: BRAND.royalPurple }}>+ ملف</button>
              </div>

              <div className="mt-5 space-y-3">
                {fields.map((field, index) => (
                  <div key={field.id} className="rounded-xl border p-4" style={{ borderColor: "#e5dcef", backgroundColor: "#fcfaff" }}>
                    <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto] sm:items-center">
                      <input
                        value={field.label}
                        onChange={(e) => updateField(field.id, { label: e.target.value })}
                        className="rounded-lg border px-3 py-2 outline-none"
                        style={{ borderColor: "#d7cae4" }}
                        placeholder="عنوان الحقل"
                      />
                      <select
                        value={field.type}
                        onChange={(e) => updateField(field.id, { type: e.target.value as FieldType })}
                        className="rounded-lg border px-3 py-2"
                        style={{ borderColor: "#d7cae4" }}
                      >
                        <option value="text">نص</option>
                        <option value="number">رقم</option>
                        <option value="image">صورة</option>
                        <option value="file">ملف</option>
                      </select>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) => updateField(field.id, { required: e.target.checked })}
                        />
                        مطلوب
                      </label>
                      <button
                        onClick={() => removeField(field.id)}
                        className="rounded-lg border px-3 py-2 text-sm"
                        style={{ borderColor: "#f2cbd7", color: "#b22c5f" }}
                      >
                        حذف
                      </button>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => moveField(field.id, "up")}
                        disabled={index === 0}
                        className="rounded-lg border px-3 py-1 text-xs disabled:opacity-40"
                        style={{ borderColor: "#d7cae4", color: BRAND.darkPurple }}
                      >
                        للأعلى
                      </button>
                      <button
                        onClick={() => moveField(field.id, "down")}
                        disabled={index === fields.length - 1}
                        className="rounded-lg border px-3 py-1 text-xs disabled:opacity-40"
                        style={{ borderColor: "#d7cae4", color: BRAND.darkPurple }}
                      >
                        للأسفل
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="rounded-xl border p-4" style={{ borderColor: "#e5dcef", backgroundColor: "#fcfaff" }}>
              <h2 className="text-lg font-semibold" style={{ color: BRAND.darkPurple }}>
                مكان ردود الطلاب
              </h2>
              <p className="mt-1 text-sm text-zinc-600">
                هنا تظهر كل الردود. لاحقًا ستتحدث تلقائيًا من قاعدة البيانات.
              </p>
              <div className="mt-4 overflow-hidden rounded-lg border" style={{ borderColor: "#d7cae4" }}>
                <table className="w-full text-sm">
                  <thead style={{ backgroundColor: BRAND.lavenderMist }}>
                    <tr>
                      <th className="px-3 py-2 text-right">الطالب</th>
                      <th className="px-3 py-2 text-right">وقت الإرسال</th>
                      <th className="px-3 py-2 text-right">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {responses.map((item) => (
                      <tr key={item.id} className="border-t" style={{ borderColor: "#eee4f6" }}>
                        <td className="px-3 py-2">{item.studentName}</td>
                        <td className="px-3 py-2">{item.submittedAt}</td>
                        <td className="px-3 py-2">
                          <span
                            className="rounded-full px-2 py-1 text-xs text-white"
                            style={{
                              backgroundColor:
                                item.status === "submitted"
                                  ? BRAND.royalPurple
                                  : "#8d8d9a",
                            }}
                          >
                            {item.status === "submitted" ? "تم الإرسال" : "بانتظار الإرسال"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">رابط النموذج</h2>
            <p className="mt-2 text-sm text-zinc-600">
              هذا هو الرابط الذي ترسله للطلاب.
            </p>
            <p
              className="mt-3 break-all rounded-lg p-3 text-sm"
              style={{ backgroundColor: BRAND.lavenderMist, color: BRAND.darkPurple }}
            >
              {shareLink}
            </p>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">معاينة سريعة (طالب)</h2>
            <h3 className="mt-3 font-medium">{title}</h3>
            <p className="mt-1 text-sm text-zinc-600">{description}</p>
            <div className="mt-4 space-y-2">
              {fields.map((field) => (
                <div
                  key={field.id}
                  className="rounded-lg p-3 text-sm"
                  style={{ backgroundColor: BRAND.lavenderMist }}
                >
                  <p className="font-medium">
                    {field.label} {field.required ? "*" : ""}
                  </p>
                  <p className="text-zinc-500">
                    النوع:{" "}
                    {field.type === "text"
                      ? "نص"
                      : field.type === "number"
                        ? "رقم"
                        : field.type === "image"
                          ? "صورة"
                          : "ملف"}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </main>
    </div>
  );
}
