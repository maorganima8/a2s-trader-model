"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const KILLZONES = ["London Open", "NY Open", "NY PM", "Asian", "London Close"];
const TIMEFRAMES = ["1M", "2M", "3M", "5M", "15M", "30M", "1H", "4H"];
const PROCESSES = ["MMXM", "PO3", "ERL→IRL", "IRL→ERL"];

export default function NewTradePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<"WIN" | "LOSS" | "BE" | "">("");

  const [form, setForm] = useState({
    type: "LIVE",
    entryTime: "",
    exitTime: "",
    asset: "",
    killzone: "",
    tradingViewUrl: "",
    process: "",
    setupType: "",
    entryTF: "",
    rr: "",
    notes: "",
    rating: "",
    proudScore: "",
    whatWasGood: "",
    mistake: "",
  });

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!result) return;
    setLoading(true);

    const res = await fetch("/api/trades", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, result }),
    });

    setLoading(false);
    if (res.ok) router.push("/journal");
  }

  return (
    <div className="px-4 pt-6 pb-8 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-zinc-400 hover:text-white transition">
          ←
        </button>
        <h1 className="text-xl font-bold text-white">תיעוד עסקה</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Type */}
        <div className="grid grid-cols-2 gap-2">
          {(["LIVE", "BACKTEST"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => set("type", t)}
              className={`py-3 rounded-xl font-semibold text-sm transition border ${
                form.type === t
                  ? "bg-yellow-500 border-yellow-500 text-black"
                  : "bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500"
              }`}
            >
              {t === "LIVE" ? "לייב" : "בדיעבד"}
            </button>
          ))}
        </div>

        {/* Times */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">זמן כניסה *</label>
            <input
              type="datetime-local"
              required
              value={form.entryTime}
              onChange={(e) => set("entryTime", e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-500 transition"
              dir="ltr"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">זמן יציאה</label>
            <input
              type="datetime-local"
              value={form.exitTime}
              onChange={(e) => set("exitTime", e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-500 transition"
              dir="ltr"
            />
          </div>
        </div>

        {/* Asset */}
        <div>
          <label className="text-xs text-zinc-400 mb-1 block">נכס *</label>
          <input
            type="text"
            required
            placeholder="EURUSD, ES, NQ..."
            value={form.asset}
            onChange={(e) => set("asset", e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-yellow-500 transition"
            dir="ltr"
          />
        </div>

        {/* Killzone */}
        <div>
          <label className="text-xs text-zinc-400 mb-1.5 block">קילזון</label>
          <div className="flex flex-wrap gap-2">
            {KILLZONES.map((kz) => (
              <button
                key={kz}
                type="button"
                onClick={() => set("killzone", form.killzone === kz ? "" : kz)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
                  form.killzone === kz
                    ? "bg-yellow-500/20 border-yellow-500 text-yellow-400"
                    : "bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500"
                }`}
              >
                {kz}
              </button>
            ))}
          </div>
        </div>

        {/* Process + Entry TF */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-zinc-400 mb-1.5 block">תהליך</label>
            <div className="flex flex-col gap-1.5">
              {PROCESSES.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => set("process", form.process === p ? "" : p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
                    form.process === p
                      ? "bg-yellow-500/20 border-yellow-500 text-yellow-400"
                      : "bg-zinc-900 border-zinc-700 text-zinc-400"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-zinc-400 mb-1.5 block">טיים פריים כניסה</label>
            <div className="flex flex-wrap gap-1.5">
              {TIMEFRAMES.map((tf) => (
                <button
                  key={tf}
                  type="button"
                  onClick={() => set("entryTF", form.entryTF === tf ? "" : tf)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition border ${
                    form.entryTF === tf
                      ? "bg-yellow-500/20 border-yellow-500 text-yellow-400"
                      : "bg-zinc-900 border-zinc-700 text-zinc-400"
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* TradingView URL */}
        <div>
          <label className="text-xs text-zinc-400 mb-1 block">קישור TradingView</label>
          <input
            type="url"
            placeholder="https://www.tradingview.com/..."
            value={form.tradingViewUrl}
            onChange={(e) => set("tradingViewUrl", e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-yellow-500 transition"
            dir="ltr"
          />
        </div>

        {/* R:R */}
        <div>
          <label className="text-xs text-zinc-400 mb-1 block">R:R</label>
          <input
            type="number"
            step="0.1"
            min="0"
            placeholder="2.5"
            value={form.rr}
            onChange={(e) => set("rr", e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-yellow-500 transition"
            dir="ltr"
          />
        </div>

        {/* Result */}
        <div>
          <label className="text-xs text-zinc-400 mb-1.5 block">תוצאה *</label>
          <div className="grid grid-cols-3 gap-2">
            {(["WIN", "LOSS", "BE"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setResult(r)}
                className={`py-3 rounded-xl font-bold text-sm transition border ${
                  result === r
                    ? r === "WIN"
                      ? "bg-green-500/20 border-green-500 text-green-400"
                      : r === "LOSS"
                      ? "bg-red-500/20 border-red-500 text-red-400"
                      : "bg-yellow-500/20 border-yellow-500 text-yellow-400"
                    : "bg-zinc-900 border-zinc-700 text-zinc-400"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Win extras */}
        {result === "WIN" && (
          <div className="space-y-3 bg-green-950/20 border border-green-900/40 rounded-2xl p-4">
            <p className="text-green-400 text-sm font-semibold">פרטי עסקה מנצחת</p>
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">דירוג העסקה (1-10)</label>
              <input
                type="range" min="1" max="10" value={form.rating || "5"}
                onChange={(e) => set("rating", e.target.value)}
                className="w-full accent-yellow-500"
              />
              <p className="text-yellow-400 text-center text-lg font-bold">{form.rating || "5"}</p>
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">כמה אתה גאה? (1-10)</label>
              <input
                type="range" min="1" max="10" value={form.proudScore || "5"}
                onChange={(e) => set("proudScore", e.target.value)}
                className="w-full accent-yellow-500"
              />
              <p className="text-yellow-400 text-center text-lg font-bold">{form.proudScore || "5"}</p>
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">מה היה טוב בעסקה?</label>
              <textarea
                value={form.whatWasGood}
                onChange={(e) => set("whatWasGood", e.target.value)}
                rows={2}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-green-500 transition resize-none"
              />
            </div>
          </div>
        )}

        {/* Loss extras */}
        {result === "LOSS" && (
          <div className="space-y-3 bg-red-950/20 border border-red-900/40 rounded-2xl p-4">
            <p className="text-red-400 text-sm font-semibold">מה הטעות?</p>
            <textarea
              value={form.mistake}
              onChange={(e) => set("mistake", e.target.value)}
              rows={3}
              placeholder="תאר את הטעות שגרמה להפסד..."
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-red-500 transition resize-none"
            />
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="text-xs text-zinc-400 mb-1 block">הערות</label>
          <textarea
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            rows={2}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-500 transition resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !result}
          className="w-full bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 disabled:opacity-40 text-black font-bold py-3.5 rounded-xl transition-all shadow-[0_4px_20px_rgba(234,179,8,0.2)] text-sm"
        >
          {loading ? "שומר..." : "שמור עסקה"}
        </button>
      </form>
    </div>
  );
}
