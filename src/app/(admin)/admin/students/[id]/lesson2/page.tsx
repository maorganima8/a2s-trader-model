"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

const PROCESSES = ["MMXM", "PO3", "ERL_IRL"] as const;
const TIMEFRAMES = ["1M", "2M", "3M", "5M", "15M", "30M", "1H", "4H", "Daily"];
const DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי"];

export default function Lesson2Page() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    market: "FOREX",
    barriers: "",
    positionDuration: "",
    tradesPerDay: "",
    limitReaction: "",
    biggestFear: "",
    tradeType: "",
    processKnowledge: [] as string[],
    preferredTF: "",
    tradingHours: "",
    tradingDays: [] as string[],
    pdArray: "",
    process: "",
    riskLevel1: "",
    riskLevel2: "",
    smt: false,
  });

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/students/${id}/profile`)
      .then((r) => r.json())
      .then(({ profile }) => {
        if (profile) {
          setForm((prev) => ({
            ...prev,
            market: profile.market ?? "FOREX",
            barriers: profile.barriers ?? "",
            positionDuration: profile.positionDuration ?? "",
            tradesPerDay: profile.tradesPerDay?.toString() ?? "",
            limitReaction: profile.limitReaction ?? "",
            biggestFear: profile.biggestFear ?? "",
            tradeType: profile.tradeType ?? "",
            processKnowledge: profile.processKnowledge ?? [],
            preferredTF: profile.preferredTF ?? "",
            tradingHours: profile.tradingHours ?? "",
            tradingDays: profile.tradingDays ?? [],
            pdArray: profile.pdArray ?? "",
            process: profile.process ?? "",
            riskLevel1: profile.riskLevel1?.toString() ?? "",
            riskLevel2: profile.riskLevel2?.toString() ?? "",
            smt: profile.smt ?? false,
          }));
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  function set(field: string, value: string | boolean | string[]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleArray(field: "processKnowledge" | "tradingDays", val: string) {
    setForm((prev) => {
      const arr = prev[field];
      return { ...prev, [field]: arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val] };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    await fetch(`/api/admin/students/${id}/profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        tradesPerDay: form.tradesPerDay ? parseInt(form.tradesPerDay) : null,
        riskLevel1: form.riskLevel1 ? parseFloat(form.riskLevel1) : null,
        riskLevel2: form.riskLevel2 ? parseFloat(form.riskLevel2) : null,
        hasPersonalModel: true,
      }),
    });

    setSaving(false);
    router.push(`/admin/students/${id}`);
  }

  if (loading) return <div className="text-zinc-400 text-sm p-6">טוען...</div>;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-zinc-400 hover:text-white transition">←</button>
        <h1 className="text-2xl font-black text-white">שאלון שיעור 2</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Market */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <h2 className="text-yellow-500 text-xs font-bold uppercase tracking-widest mb-4">בסיס</h2>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {(["FOREX", "FUTURES"] as const).map((m) => (
              <button key={m} type="button" onClick={() => set("market", m)}
                className={`py-2.5 rounded-xl text-sm font-medium border transition ${form.market === m ? "bg-yellow-500/15 border-yellow-500 text-yellow-400" : "bg-zinc-800 border-zinc-700 text-zinc-400"}`}>
                {m === "FOREX" ? "פורקס" : "חוזים עתידיים"}
              </button>
            ))}
          </div>

          <label className="text-zinc-400 text-sm block mb-1.5">מה מונע ממך לסחור נכון?</label>
          <textarea value={form.barriers} onChange={(e) => set("barriers", e.target.value)} rows={2}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-500 transition resize-none mb-3" />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-zinc-400 text-sm block mb-1.5">משך פוזיציה מועדף</label>
              <input value={form.positionDuration} onChange={(e) => set("positionDuration", e.target.value)}
                placeholder="Scalp / Intraday / Swing"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-500 transition" />
            </div>
            <div>
              <label className="text-zinc-400 text-sm block mb-1.5">עסקאות ביום</label>
              <input type="number" min="1" max="10" value={form.tradesPerDay} onChange={(e) => set("tradesPerDay", e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-500 transition" dir="ltr" />
            </div>
          </div>
        </div>

        {/* Mental */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <h2 className="text-yellow-500 text-xs font-bold uppercase tracking-widest mb-4">מנטל</h2>
          <div className="space-y-3">
            <div>
              <label className="text-zinc-400 text-sm block mb-1.5">מה קורה כשעסקה בגבול?</label>
              <input value={form.limitReaction} onChange={(e) => set("limitReaction", e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-500 transition" />
            </div>
            <div>
              <label className="text-zinc-400 text-sm block mb-1.5">הפחד הגדול לפני כניסה</label>
              <input value={form.biggestFear} onChange={(e) => set("biggestFear", e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-500 transition" />
            </div>
          </div>
        </div>

        {/* Mentor-only */}
        <div className="bg-zinc-900 border border-yellow-900/40 rounded-2xl p-5">
          <h2 className="text-yellow-500 text-xs font-bold uppercase tracking-widest mb-4">הגדרות מנטור</h2>

          <div className="mb-4">
            <label className="text-zinc-400 text-sm block mb-2">תהליך</label>
            <div className="flex gap-2">
              {PROCESSES.map((p) => (
                <button key={p} type="button" onClick={() => set("process", form.process === p ? "" : p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${form.process === p ? "bg-yellow-500/20 border-yellow-500 text-yellow-400" : "bg-zinc-800 border-zinc-700 text-zinc-400"}`}>
                  {p === "ERL_IRL" ? "ERL→IRL" : p}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="text-zinc-400 text-sm block mb-2">טיים פריים</label>
            <div className="flex flex-wrap gap-1.5">
              {TIMEFRAMES.map((tf) => (
                <button key={tf} type="button" onClick={() => set("preferredTF", form.preferredTF === tf ? "" : tf)}
                  className={`px-2.5 py-1 rounded-lg text-xs border transition ${form.preferredTF === tf ? "bg-yellow-500/20 border-yellow-500 text-yellow-400" : "bg-zinc-800 border-zinc-700 text-zinc-400"}`}>
                  {tf}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="text-zinc-400 text-sm block mb-2">ימי מסחר</label>
            <div className="flex flex-wrap gap-1.5">
              {DAYS.map((d) => (
                <button key={d} type="button" onClick={() => toggleArray("tradingDays", d)}
                  className={`px-3 py-1.5 rounded-lg text-xs border transition ${form.tradingDays.includes(d) ? "bg-yellow-500/20 border-yellow-500 text-yellow-400" : "bg-zinc-800 border-zinc-700 text-zinc-400"}`}>
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="text-zinc-400 text-sm block mb-1.5">שעות מסחר</label>
            <input value={form.tradingHours} onChange={(e) => set("tradingHours", e.target.value)}
              placeholder="07:00-09:00"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-500 transition" dir="ltr" />
          </div>

          <div className="mb-4">
            <label className="text-zinc-400 text-sm block mb-1.5">Pd-Array</label>
            <input value={form.pdArray} onChange={(e) => set("pdArray", e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-500 transition" />
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-zinc-400 text-sm block mb-1.5">סיכון ראשון (%)</label>
              <input type="number" step="0.1" value={form.riskLevel1} onChange={(e) => set("riskLevel1", e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-500 transition" dir="ltr" />
            </div>
            <div>
              <label className="text-zinc-400 text-sm block mb-1.5">סיכון שלב הבא (%)</label>
              <input type="number" step="0.1" value={form.riskLevel2} onChange={(e) => set("riskLevel2", e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-500 transition" dir="ltr" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button type="button" onClick={() => set("smt", !form.smt)}
              className={`w-12 h-6 rounded-full transition relative ${form.smt ? "bg-yellow-500" : "bg-zinc-700"}`}>
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${form.smt ? "right-0.5" : "left-0.5"}`} />
            </button>
            <label className="text-zinc-300 text-sm">SMT פעיל</label>
          </div>
        </div>

        <button type="submit" disabled={saving}
          className="w-full bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 disabled:opacity-50 text-black font-bold py-3.5 rounded-xl transition text-sm">
          {saving ? "שומר..." : "שמור ובנה מודל אישי"}
        </button>
      </form>
    </div>
  );
}
