"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";

function SetupForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("הסיסמאות לא תואמות");
      return;
    }
    if (password.length < 6) {
      setError("הסיסמה חייבת להכיל לפחות 6 תווים");
      return;
    }
    setLoading(true);
    setError("");

    const res = await fetch("/api/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });

    setLoading(false);

    if (!res.ok) {
      setError("קישור לא תקין או פג תוקף");
      return;
    }

    setDone(true);
    setTimeout(() => router.push("/login"), 2500);
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-yellow-500/8 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-sm relative z-10">
        <div className="flex flex-col items-center mb-8">
          <Image src="/logo.png" alt="A2S" width={72} height={72} className="mb-4" />
          <h1 className="text-2xl font-black text-white">ברוך הבא ל-A2S</h1>
          <p className="text-zinc-400 text-sm mt-1">הגדר סיסמה להתחלת התוכנית</p>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6">
          <div className="w-12 h-1 bg-gradient-to-r from-yellow-600 to-yellow-400 rounded-full mx-auto mb-6" />

          {done ? (
            <div className="text-center py-4">
              <p className="text-3xl mb-2">✅</p>
              <p className="text-green-400 font-semibold">הסיסמה הוגדרה בהצלחה!</p>
              <p className="text-zinc-500 text-sm mt-1">מעביר לדף הכניסה...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-zinc-400 text-sm block mb-1.5">סיסמה חדשה</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="לפחות 6 תווים"
                  dir="ltr"
                  className="w-full bg-zinc-800/60 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/40 transition"
                />
              </div>
              <div>
                <label className="text-zinc-400 text-sm block mb-1.5">אימות סיסמה</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  placeholder="הכנס שוב"
                  dir="ltr"
                  className="w-full bg-zinc-800/60 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/40 transition"
                />
              </div>
              {error && (
                <p className="text-red-400 text-sm text-center">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 disabled:opacity-50 text-black font-bold py-3 rounded-xl transition-all shadow-[0_4px_20px_rgba(234,179,8,0.2)] text-sm mt-2"
              >
                {loading ? "שומר..." : "כניסה לתוכנית"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SetupPage() {
  return (
    <Suspense>
      <SetupForm />
    </Suspense>
  );
}
