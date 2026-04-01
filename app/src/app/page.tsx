"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useMemo, useState } from "react";

type FieldType = "text" | "number" | "image" | "file";

type FormField = {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
};

type StudentSubmission = {
  id: string;
  formToken: string;
  studentName: string;
  answers: Record<string, string | { kind?: string; url?: string; name?: string; mimeType?: string }>;
  createdAt?: string;
  submittedAt: string;
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

const BRAND = {
  royalPurple: "#6f459b",
  darkPurple: "#391f5a",
  lavenderMist: "#f0e9f4",
};

const API_BASE = "/api";

function isUploadedValue(
  value: string | { kind?: string; url?: string; name?: string; mimeType?: string },
): value is { kind?: string; url?: string; name?: string; mimeType?: string } {
  return typeof value === "object" && value !== null;
}

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
  const initialTeacherId = typeof window !== "undefined" ? localStorage.getItem("teacherId") || "" : "";
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(Boolean(initialTeacherId));
  const [teacherId, setTeacherId] = useState(initialTeacherId);
  const [loginError, setLoginError] = useState("");
  const [activePanel, setActivePanel] = useState<"forms" | "builder" | "responses">(
    "forms",
  );

  const [title, setTitle] = useState("نموذج طلب مستندات التسجيل");
  const [description, setDescription] = useState("يرجى تعبئة البيانات ورفع المرفقات المطلوبة.");
  const [fields, setFields] = useState<FormField[]>([
    createDefaultField("text"),
    createDefaultField("image"),
  ]);
  const [forms, setForms] = useState<TeacherForm[]>([]);
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [selectedToken, setSelectedToken] = useState("");

  const loadForms = useCallback(async (currentTeacherId = teacherId) => {
    const res = await fetch(`${API_BASE}/forms/by-teacher/${currentTeacherId}`);
    const json = await res.json();
    if (!res.ok) {
      return;
    }
    setForms(json.forms);
    if (!selectedToken && json.forms.length > 0) {
      setSelectedToken(json.forms[0].token);
    }
  }, [teacherId, selectedToken]);

  const loadSubmissions = useCallback(async (token: string) => {
    const res = await fetch(`${API_BASE}/submissions/by-token/${token}`);
    const json = await res.json();
    if (!res.ok) {
      return;
    }
    const normalized = (json.submissions || []).map((item: StudentSubmission) => ({
      ...item,
      submittedAt: item.createdAt ? new Date(item.createdAt).toLocaleString() : "-",
    }));
    setSubmissions(normalized);
  }, []);

  useEffect(() => {
    if (!teacherId) {
      return;
    }
    void loadForms(teacherId);
  }, [teacherId, loadForms]);

  useEffect(() => {
    if (!selectedToken) {
      setSubmissions([]);
      return;
    }
    void loadSubmissions(selectedToken);
  }, [selectedToken, loadSubmissions]);

  const shareLink = useMemo(() => {
    if (!selectedToken) return "";
    if (typeof window === "undefined") return `/submit/${selectedToken}`;
    return `${window.location.origin}/submit/${selectedToken}`;
  }, [selectedToken]);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    (async () => {
      try {
        setLoginError("");
        const res = await fetch(`${API_BASE}/auth/teacher/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone, password }),
        });
        const json = await res.json();
        if (!res.ok) {
          setLoginError(json.error || "بيانات الدخول غير صحيحة.");
        } else {
          localStorage.setItem("teacherId", json.teacher.id);
          localStorage.setItem("teacherName", json.teacher.fullName);
          setTeacherId(json.teacher.id);
          setIsLoggedIn(true);
        }
      } catch {
        setLoginError("تعذر الاتصال بالخادم.");
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
    setPhone("");
    setPassword("");
    setForms([]);
    setSelectedToken("");
  }

  async function createForm() {
    if (!teacherId) return;
    const res = await fetch(`${API_BASE}/forms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        teacherId,
        title: title.trim() || "نموذج جديد",
        description: description.trim(),
        fields,
      }),
    });
    const json = await res.json();
    if (!res.ok) return;
    await loadForms();
    setSelectedToken(json.form.token);
    setActivePanel("forms");
  }

  async function toggleFormOpen(formId: string) {
    await fetch(`${API_BASE}/forms/${formId}/toggle-open`, {
      method: "PATCH",
    });
    await loadForms();
  }

  async function publishForm(formId: string, token: string, isOpen: boolean) {
    if (!isOpen) {
      await toggleFormOpen(formId);
    }
    setSelectedToken(token);
    setActivePanel("responses");
    if (typeof window !== "undefined") {
      const link = `${window.location.origin}/submit/${token}`;
      await navigator.clipboard.writeText(link);
    }
  }

  async function deleteForm(formId: string) {
    const ok = typeof window === "undefined" ? true : window.confirm("هل تريد حذف النموذج نهائيًا؟");
    if (!ok) return;
    await fetch(`${API_BASE}/forms/${formId}`, { method: "DELETE" });
    await loadForms();
    setSelectedToken("");
  }

  const selectedForm = forms.find((f) => f.token === selectedToken);
  const formSubmissions = submissions.filter((s) => s.formToken === selectedToken);

  function copyLink() {
    if (!shareLink) return;
    navigator.clipboard.writeText(shareLink);
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
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
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
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-3 text-zinc-900 sm:p-6" style={{ backgroundColor: BRAND.lavenderMist }}>
      <main className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.45fr_1fr]">
        <section className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: BRAND.darkPurple }}>
                لوحة المعلم
              </h1>
              <p className="mt-1 text-sm text-zinc-600">
                إنشاء نموذج بسيط + متابعة ردود الطلاب.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setActivePanel("forms")}
                className="rounded-lg px-3 py-2 text-sm text-white"
                style={{
                  backgroundColor:
                    activePanel === "forms" ? BRAND.royalPurple : BRAND.darkPurple,
                }}
              >
                نماذجي
              </button>
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

          {activePanel === "forms" ? (
            <div className="space-y-3">
              {forms.length === 0 ? (
                <p className="text-sm text-zinc-600">لا يوجد نماذج بعد. أنشئ نموذجًا جديدًا.</p>
              ) : (
                forms.map((f) => (
                  <div
                    key={f.id}
                    className="rounded-xl border p-4"
                    style={{ borderColor: "#e5dcef", backgroundColor: "#fcfaff" }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold">{f.title}</p>
                        <p className="text-xs text-zinc-500">{f.description || "-"}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedToken(f.token);
                            setActivePanel("responses");
                          }}
                          className="rounded-lg border px-3 py-1 text-xs"
                          style={{ borderColor: "#d7cae4", color: BRAND.darkPurple }}
                        >
                          الردود
                        </button>
                        <button
                          onClick={() => publishForm(f.id, f.token, f.isOpen)}
                          className="rounded-lg px-3 py-1 text-xs text-white"
                          style={{ backgroundColor: BRAND.royalPurple }}
                        >
                          نشر
                        </button>
                        <button
                          onClick={() => toggleFormOpen(f.id)}
                          className="rounded-lg px-3 py-1 text-xs text-white"
                          style={{ backgroundColor: f.isOpen ? "#8d8d9a" : BRAND.royalPurple }}
                        >
                          {f.isOpen ? "إغلاق الرابط" : "فتح الرابط"}
                        </button>
                        <button
                          onClick={() => deleteForm(f.id)}
                          className="rounded-lg border px-3 py-1 text-xs"
                          style={{ borderColor: "#f2cbd7", color: "#b22c5f" }}
                        >
                          حذف
                        </button>
                      </div>
                    </div>
                    <p className="mt-2 break-all text-xs text-zinc-600">
                      {typeof window !== "undefined" ? `${window.location.origin}/submit/${f.token}` : `/submit/${f.token}`}
                    </p>
                  </div>
                ))
              )}
            </div>
          ) : activePanel === "builder" ? (
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
                <button onClick={createForm} className="rounded-lg px-3 py-2 text-sm text-white" style={{ backgroundColor: BRAND.darkPurple }}>حفظ كنموذج</button>
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
                هنا تظهر ردود النموذج المحدد.
              </p>
              <div className="mt-3">
                <select
                  className="rounded-lg border px-3 py-2 text-sm"
                  style={{ borderColor: "#d7cae4" }}
                  value={selectedToken}
                  onChange={(e) => setSelectedToken(e.target.value)}
                >
                  <option value="">اختر النموذج</option>
                  {forms.map((f) => (
                    <option key={f.id} value={f.token}>
                      {f.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mt-4 space-y-3">
                {formSubmissions.map((item) => (
                  <article key={item.id} className="rounded-lg border p-3" style={{ borderColor: "#d7cae4", backgroundColor: "#fff" }}>
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold">{item.studentName}</p>
                      <p className="text-xs text-zinc-500">{item.submittedAt}</p>
                    </div>
                    <div className="grid gap-2">
                      {Object.entries(item.answers).map(([key, value]) => (
                        <div key={key} className="rounded-md bg-[#f8f4fc] p-2 text-sm">
                          <p className="mb-1 text-xs font-medium text-zinc-600">{key}</p>
                          {isUploadedValue(value) && value.url ? (
                            value.mimeType?.startsWith("image/") ? (
                              <a href={value.url} target="_blank" rel="noreferrer">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={value.url} alt={value.name || key} className="max-h-44 w-auto rounded-md border" />
                              </a>
                            ) : (
                              <a href={value.url} target="_blank" rel="noreferrer" className="text-[#6f459b] underline">
                                {value.name || "تحميل الملف"}
                              </a>
                            )
                          ) : (
                            <p>{String(value)}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
                {formSubmissions.length === 0 && (
                  <p className="rounded-lg border px-3 py-3 text-sm text-zinc-500" style={{ borderColor: "#d7cae4" }}>
                    لا توجد ردود لهذا النموذج بعد.
                  </p>
                )}
              </div>
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">رابط النموذج</h2>
            <p className="mt-2 text-sm text-zinc-600">
              هذا رابط النموذج المحدد للمشاركة مع الطلاب.
            </p>
            <p
              className="mt-3 break-all rounded-lg p-3 text-sm"
              style={{ backgroundColor: BRAND.lavenderMist, color: BRAND.darkPurple }}
            >
              {shareLink || "اختر نموذجًا من تبويب نماذجي"}
            </p>
            <button
              onClick={copyLink}
              disabled={!shareLink}
              className="mt-2 rounded-lg px-3 py-2 text-xs text-white disabled:opacity-50"
              style={{ backgroundColor: BRAND.royalPurple }}
            >
              نسخ الرابط
            </button>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">معاينة سريعة (طالب)</h2>
            <h3 className="mt-3 font-medium">{selectedForm?.title || title}</h3>
            <p className="mt-1 text-sm text-zinc-600">{selectedForm?.description || description}</p>
            <div className="mt-4 space-y-2">
              {(selectedForm?.fields || fields).map((field) => (
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
