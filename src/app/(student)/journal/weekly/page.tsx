"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function WeeklyReviewPage() {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [existing, setExisting] = useState<{ submittedAt: string | null } | null>(null);

  const weekStart = getWeekStart();

  useEffect(() => {
    fetch(`/api/weekly-review?weekStart=${weekStart.toISOString()}`)
      .then((r) => r.json())
      .then(({ review }) => {
        if (review) {
          setExisting(review);
          setContent(review.content ?? "");
        }
      });
  }, [weekStart]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    await fetch("/api/weekly-review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weekStart: weekStart.toISOString(), content }),
    });

    setSaving(false);
    setSaved(true);
    setTimeout(() => router.push("/journal"), 1500);
  }

  return (
    <div className="px-4 pt-6 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={() => router.back()} className="text-zinc-400 hover:text-white transition">←</button>
        <h1 className="text-xl font-bold text-white">סקירה שבועית</h1>
      </div>
      <p className="text-zinc-500 text-sm mb-6 mr-8">
        שבוע {weekStart.toLocaleDateString("he-IL", { day: "numeric", month: "long" })}
      </p>

      {existing?.submittedAt && (
        <div className="bg-green-950/30 border border-green-900/40 rounded-xl px-4 py-2.5 mb-4">
          <p className="text-green-400 text-sm">הסקירה הוגשה ✓</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={14}
          placeholder="סכם את שבוע המסחר — מה עבד, מה לא, מה תשפר..."
          className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-4 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-yellow-500 transition resize-none mb-4"
        />

        {saved ? (
          <div className="text-center text-green-400 font-medium">נשמר ✓</div>
        ) : (
          <button type="submit" disabled={saving || !content.trim()}
            className="w-full bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 disabled:opacity-40 text-black font-bold py-3 rounded-xl transition text-sm">
            {saving ? "שומר..." : "הגש סקירה"}
          </button>
        )}
      </form>
    </div>
  );
}

function getWeekStart(): Date {
  const d = new Date();
  const day = d.getDay(); // 0 = Sunday
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}
