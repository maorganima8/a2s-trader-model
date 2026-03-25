"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", email: "", phone: "", market: "FOREX" });

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "שגיאה ביצירת המשתמש");
      return;
    }

    router.push("/admin/students");
    router.refresh();
  }

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-zinc-400 hover:text-white transition">←</button>
        <h1 className="text-2xl font-black text-white">תלמיד חדש</h1>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-zinc-400 text-sm block mb-1.5">שם מלא *</label>
            <input
              type="text" required value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-500 transition"
            />
          </div>
          <div>
            <label className="text-zinc-400 text-sm block mb-1.5">מייל *</label>
            <input
              type="email" required value={form.email}
              onChange={(e) => set("email", e.target.value)}
              dir="ltr"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-500 transition"
            />
          </div>
          <div>
            <label className="text-zinc-400 text-sm block mb-1.5">טלפון (WhatsApp)</label>
            <input
              type="tel" value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="05X-XXXXXXX"
              dir="ltr"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-500 transition"
            />
          </div>
          <div>
            <label className="text-zinc-400 text-sm block mb-1.5">שוק</label>
            <div className="grid grid-cols-2 gap-2">
              {(["FOREX", "FUTURES"] as const).map((m) => (
                <button key={m} type="button" onClick={() => set("market", m)}
                  className={`py-2.5 rounded-xl text-sm font-medium transition border ${
                    form.market === m
                      ? "bg-yellow-500/15 border-yellow-500 text-yellow-400"
                      : "bg-zinc-800 border-zinc-700 text-zinc-400"
                  }`}>
                  {m === "FOREX" ? "פורקס" : "חוזים עתידיים"}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <button
            type="submit" disabled={loading}
            className="w-full bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 disabled:opacity-50 text-black font-bold py-3 rounded-xl transition text-sm mt-2"
          >
            {loading ? "יוצר..." : "צור תלמיד ושלח הזמנה"}
          </button>
        </form>
      </div>
    </div>
  );
}
