"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", email: "", phone: "", market: "FOREX" });
  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied] = useState(false);

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

    const data = await res.json();
    const link = `${window.location.origin}/setup?token=${data.user.id}`;
    setInviteLink(link);
  }

  async function copyLink() {
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (inviteLink) {
    return (
      <div className="max-w-lg">
        <h1 className="text-2xl font-black text-white mb-6">תלמיד נוצר!</h1>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-3 bg-green-950/30 border border-green-900/40 rounded-xl px-4 py-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <p className="text-green-400 text-sm font-medium">החשבון נוצר בהצלחה</p>
          </div>

          <div>
            <p className="text-zinc-400 text-sm mb-2">שלח את הקישור הזה לתלמיד כדי שיגדיר סיסמה:</p>
            <div className="bg-zinc-800 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
              <p className="text-yellow-400 text-xs truncate" dir="ltr">{inviteLink}</p>
              <button
                onClick={copyLink}
                className="flex-shrink-0 bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-3 py-1.5 rounded-lg text-xs transition"
              >
                {copied ? "✓ הועתק" : "העתק"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              onClick={() => { setInviteLink(""); setForm({ name: "", email: "", phone: "", market: "FOREX" }); }}
              className="py-2.5 rounded-xl text-sm font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition"
            >
              + תלמיד נוסף
            </button>
            <button
              onClick={() => router.push("/admin/students")}
              className="py-2.5 rounded-xl text-sm font-bold bg-yellow-500 text-black hover:bg-yellow-400 transition"
            >
              לרשימת תלמידים
            </button>
          </div>
        </div>
      </div>
    );
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
            {loading ? "יוצר..." : "צור תלמיד"}
          </button>
        </form>
      </div>
    </div>
  );
}
