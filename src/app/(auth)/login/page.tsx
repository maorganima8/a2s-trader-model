"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError("מייל או סיסמה שגויים");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 relative overflow-hidden">

      {/* Background glow effects */}
      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-yellow-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-yellow-600/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">

        {/* Logo + Brand */}
        <div className="flex flex-col items-center mb-10">
          <div className="mb-4">
            <Image
              src="/logo.png"
              alt="A2S Logo"
              width={96}
              height={96}
              className="drop-shadow-[0_0_20px_rgba(234,179,8,0.4)]"
            />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            A2S
          </h1>
          <p className="text-yellow-500 text-sm font-medium tracking-widest uppercase mt-1">
            Trader Platform
          </p>
        </div>

        {/* Card */}
        <div className="bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 rounded-3xl p-8 shadow-2xl">

          {/* Gold top line */}
          <div className="w-16 h-1 bg-gradient-to-r from-yellow-600 to-yellow-400 rounded-full mx-auto mb-7" />

          <h2 className="text-white text-xl font-bold text-center mb-6">כניסה למערכת</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-zinc-400 text-sm mb-1.5 font-medium">כתובת מייל</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
                dir="ltr"
                className="w-full bg-zinc-800/60 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/50 transition text-sm"
              />
            </div>

            <div>
              <label className="block text-zinc-400 text-sm mb-1.5 font-medium">סיסמה</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                dir="ltr"
                className="w-full bg-zinc-800/60 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/50 transition text-sm"
              />
            </div>

            {error && (
              <div className="bg-red-950/50 border border-red-800 rounded-xl px-4 py-2.5 text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 disabled:opacity-50 text-black font-bold py-3 rounded-xl transition-all duration-200 shadow-[0_4px_20px_rgba(234,179,8,0.25)] hover:shadow-[0_4px_30px_rgba(234,179,8,0.4)] text-sm tracking-wide mt-2"
            >
              {loading ? "מתחבר..." : "כניסה"}
            </button>
          </form>
        </div>

        <p className="text-center text-zinc-600 text-xs mt-6">
          © {new Date().getFullYear()} Addiction 2 Success. All rights reserved.
        </p>
      </div>
    </div>
  );
}
