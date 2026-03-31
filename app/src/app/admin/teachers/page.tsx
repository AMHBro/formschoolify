"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const API_BASE = "http://localhost:4000/api";

type TeacherRow = {
  id: string;
  fullName: string;
  phone: string;
  isActive: boolean;
  formCount: number;
};

const OFFLINE_TEACHERS_KEY = "offlineTeachers";

export default function AdminTeachersPage() {
  const router = useRouter();
  const [teachers, setTeachers] = useState<TeacherRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const adminId = localStorage.getItem("adminId");
    if (!adminId) {
      router.replace("/admin/login");
      return;
    }
    loadTeachers();
  }, []);

  async function loadTeachers() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/admin/teachers`);
      const json = await res.json();
      if (!json.ok) {
        setError(json.error?.message || "فشل تحميل الأساتذة.");
      } else {
        setTeachers(json.data);
      }
    } catch {
      const offlineTeachers = localStorage.getItem(OFFLINE_TEACHERS_KEY);
      setTeachers(offlineTeachers ? JSON.parse(offlineTeachers) : []);
      setError("وضع تجريبي: لا يوجد اتصال بالخادم.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddTeacher(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch(`${API_BASE}/admin/teachers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, phone, password }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error?.message || "تعذر إضافة الأستاذ.");
      } else {
        setFullName("");
        setPhone("");
        setPassword("");
        loadTeachers();
      }
    } catch {
      const offlineTeachers = localStorage.getItem(OFFLINE_TEACHERS_KEY);
      const parsed: TeacherRow[] = offlineTeachers ? JSON.parse(offlineTeachers) : [];
      const exists = parsed.some((t) => t.phone === phone);
      if (exists) {
        setError("هذا الرقم موجود مسبقًا (وضع تجريبي).");
        return;
      }
      const row: TeacherRow = {
        id: crypto.randomUUID(),
        fullName,
        phone,
        isActive: true,
        formCount: 0,
      };
      const next = [row, ...parsed];
      localStorage.setItem(OFFLINE_TEACHERS_KEY, JSON.stringify(next));
      setTeachers(next);
      setFullName("");
      setPhone("");
      setPassword("");
      setError("تم الحفظ محليًا (وضع تجريبي).");
    }
  }

  async function toggleTeacher(id: string) {
    setError("");
    try {
      const res = await fetch(`${API_BASE}/admin/teachers/${id}/toggle`, {
        method: "PATCH",
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error?.message || "تعذر تحديث حالة الأستاذ.");
      } else {
        loadTeachers();
      }
    } catch {
      const next = teachers.map((t) =>
        t.id === id ? { ...t, isActive: !t.isActive } : t,
      );
      setTeachers(next);
      localStorage.setItem(OFFLINE_TEACHERS_KEY, JSON.stringify(next));
      setError("تم تحديث الحالة محليًا (وضع تجريبي).");
    }
  }

  function logout() {
    localStorage.removeItem("adminId");
    localStorage.removeItem("adminUsername");
    router.replace("/admin/login");
  }

  return (
    <div className="min-h-screen bg-[#f0e9f4] p-6 text-zinc-900">
      <main className="mx-auto max-w-5xl space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#391f5a]">إدارة الأساتذة</h1>
            <p className="text-sm text-zinc-600">
              أضف أساتذة جدد وتابع عدد النماذج الخاصة بكل أستاذ.
            </p>
          </div>
          <button
            onClick={logout}
            className="rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: "#d7cae4", color: "#391f5a" }}
          >
            خروج
          </button>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">قائمة الأساتذة</h2>
            {loading ? (
              <p className="mt-3 text-sm text-zinc-600">جارٍ التحميل...</p>
            ) : teachers.length === 0 ? (
              <p className="mt-3 text-sm text-zinc-600">لا يوجد أساتذة بعد.</p>
            ) : (
              <div className="mt-3 overflow-hidden rounded-lg border" style={{ borderColor: "#d7cae4" }}>
                <table className="w-full text-sm">
                  <thead className="bg-[#f0e9f4]">
                    <tr>
                      <th className="px-3 py-2 text-right">الاسم</th>
                      <th className="px-3 py-2 text-right">رقم الهاتف</th>
                      <th className="px-3 py-2 text-right">النماذج</th>
                      <th className="px-3 py-2 text-right">الحالة</th>
                      <th className="px-3 py-2 text-right">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teachers.map((t) => (
                      <tr key={t.id} className="border-t" style={{ borderColor: "#eee4f6" }}>
                        <td className="px-3 py-2">{t.fullName}</td>
                        <td className="px-3 py-2">{t.phone}</td>
                        <td className="px-3 py-2">{t.formCount}</td>
                        <td className="px-3 py-2">
                          <span
                            className="rounded-full px-2 py-1 text-xs text-white"
                            style={{
                              backgroundColor: t.isActive ? "#6f459b" : "#8d8d9a",
                            }}
                          >
                            {t.isActive ? "مفعل" : "موقوف"}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <button
                            onClick={() => toggleTeacher(t.id)}
                            className="rounded-lg border px-3 py-1 text-xs"
                            style={{ borderColor: "#d7cae4", color: "#391f5a" }}
                          >
                            تبديل الحالة
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">إضافة أستاذ جديد</h2>
            <form className="mt-4 space-y-3" onSubmit={handleAddTeacher}>
              <div>
                <label className="mb-1 block text-sm font-medium">الاسم الكامل</label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 outline-none"
                  style={{ borderColor: "#d7cae4" }}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">رقم الهاتف</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 outline-none"
                  style={{ borderColor: "#d7cae4" }}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">كلمة المرور</label>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  className="w-full rounded-lg border px-3 py-2 outline-none"
                  style={{ borderColor: "#d7cae4" }}
                  required
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                className="w-full rounded-lg px-4 py-2 text-sm font-medium text-white"
                style={{ backgroundColor: "#6f459b" }}
              >
                حفظ الأستاذ
              </button>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}

