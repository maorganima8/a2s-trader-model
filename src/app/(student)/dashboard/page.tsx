import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

function getDaysRemaining(accessExpiresAt: Date | null): number | null {
  if (!accessExpiresAt) return null;
  return Math.max(0, Math.ceil((accessExpiresAt.getTime() - Date.now()) / 86400000));
}

function getDaysSinceJoined(joinedAt: Date | null): number {
  if (!joinedAt) return 0;
  return Math.floor((Date.now() - joinedAt.getTime()) / 86400000);
}

const STEP_LABELS = [
  "סקירת שבועי",
  "נזילות יומי",
  "זונות עניין 4H",
  "סדר זרימה 1H",
  "תהליך 15M",
  "אישורי כניסה",
];

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { studentProfile: true },
  });
  if (!user) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const checklist = await prisma.checklistEntry.findUnique({
    where: { userId_date: { userId: user.id, date: today } },
  });

  const checklistSteps = checklist
    ? [checklist.step1, checklist.step2, checklist.step3, checklist.step4, checklist.step5, checklist.step6]
    : Array(6).fill(false);
  const checklistDone = checklistSteps.filter(Boolean).length;
  const checklistPct = Math.round((checklistDone / 6) * 100);

  const daysRemaining = getDaysRemaining(user.accessExpiresAt);
  const dayNumber = getDaysSinceJoined(user.joinedAt) + 1;
  const progressPct = Math.min(100, Math.round((dayNumber / 90) * 100));

  const allTrades = await prisma.trade.findMany({
    where: { userId: user.id },
    orderBy: { entryTime: "desc" },
  });

  const totalTrades = allTrades.length;
  const wins = allTrades.filter((t) => t.result === "WIN").length;
  const losses = allTrades.filter((t) => t.result === "LOSS").length;
  const winRate = totalTrades > 0 ? Math.round((wins / totalTrades) * 100) : 0;
  const totalR = allTrades.reduce((sum, t) => sum + (t.rr ?? 0), 0);

  // Last 7 days activity
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (6 - i));
    return d;
  });

  const weekDayMap = last7.map((d) => {
    const dayTrades = allTrades.filter((t) => {
      const td = new Date(t.entryTime);
      td.setHours(0, 0, 0, 0);
      return td.getTime() === d.getTime();
    });
    return {
      date: d.getDate(),
      count: dayTrades.length,
      wins: dayTrades.filter((t) => t.result === "WIN").length,
      losses: dayTrades.filter((t) => t.result === "LOSS").length,
      isToday: d.getTime() === today.getTime(),
    };
  });

  const maxCount = Math.max(...weekDayMap.map((d) => d.count), 1);
  const firstName = user.name?.split(" ")[0] ?? "סוחר";

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md flex items-center justify-between px-6 lg:px-12 h-20 border-b border-outline-variant/10">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
            יום {dayNumber} לתוכנית
          </p>
          <h2 className="text-2xl font-black tracking-tighter text-on-surface">שלום, {firstName}</h2>
        </div>
        <Link href="/journal/new">
          <button className="hidden lg:flex items-center gap-2 bg-primary-container text-on-primary-container font-bold px-5 py-2.5 rounded-xl shadow hover:scale-[0.98] transition-all text-sm">
            <span className="material-symbols-outlined text-base">add</span>
            עסקה חדשה
          </button>
        </Link>
      </header>

      <div className="p-6 lg:p-12 pb-28 lg:pb-12 max-w-7xl mx-auto space-y-6">
        {/* Hero Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Stats Hero Card */}
          <div className="lg:col-span-8 bg-primary-container rounded-[2rem] p-8 lg:p-10 flex flex-col justify-between min-h-[260px] relative overflow-hidden shadow-sm">
            <div className="absolute -top-10 -start-10 w-64 h-64 bg-on-primary-container/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10">
              <span className="px-4 py-1 bg-on-primary-container/10 rounded-full text-xs font-bold uppercase tracking-widest text-on-primary-container mb-4 inline-block">
                ביצועי תוכנית
              </span>
              <h2 className="text-5xl font-black tracking-tighter text-on-primary-container">
                {totalR >= 0 ? "+" : ""}{totalR.toFixed(1)}R
              </h2>
              <p className="mt-2 text-on-primary-container/70 font-medium">סה&quot;כ יחידות סיכון מצטברות</p>
            </div>
            <div className="relative z-10 grid grid-cols-3 gap-6 mt-8 border-t border-on-primary-container/10 pt-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-on-primary-container/60 mb-1">Win Rate</p>
                <p className="text-3xl font-bold text-on-primary-container">{winRate}%</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-on-primary-container/60 mb-1">W / L</p>
                <p className="text-3xl font-bold text-on-primary-container">{wins}/{losses}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-on-primary-container/60 mb-1">עסקאות</p>
                <p className="text-3xl font-bold text-on-primary-container">{totalTrades}</p>
              </div>
            </div>
          </div>

          {/* Days Ring */}
          <div className="lg:col-span-4 bg-surface-container-lowest border border-outline-variant/15 rounded-[2rem] p-8 flex flex-col items-center justify-center text-center">
            <div className="relative w-44 h-44 mb-5">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 192 192">
                <circle cx="96" cy="96" r="80" fill="transparent" stroke="#e5e2e1" strokeWidth="12" />
                <circle
                  cx="96" cy="96" r="80"
                  fill="transparent"
                  stroke="#fbc02d"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray="502"
                  strokeDashoffset={Math.round(502 - (progressPct / 100) * 502)}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-black text-on-surface">
                  {daysRemaining !== null ? daysRemaining : dayNumber}
                </span>
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                  {daysRemaining !== null ? "ימים נותרו" : `יום`}
                </span>
              </div>
            </div>
            <h3 className="text-lg font-bold text-on-surface">התקדמות בתוכנית</h3>
            <p className="text-sm text-on-surface-variant mt-1">יום {dayNumber} מתוך 90 · {progressPct}%</p>
          </div>
        </section>

        {/* Secondary Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Checklist */}
          <div className="lg:col-span-4 bg-surface-container-low rounded-[1.5rem] p-8">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-extrabold tracking-tight text-on-surface">צ&apos;קליסט יומי</h3>
              <span
                className={`material-symbols-outlined ${checklistDone === 6 ? "text-primary" : "text-on-surface-variant"}`}
                style={{ fontVariationSettings: checklistDone === 6 ? "'FILL' 1" : "'FILL' 0" }}
              >
                verified
              </span>
            </div>
            <div className="mb-5">
              <div className="flex justify-between text-xs font-bold mb-2">
                <span className="text-on-surface-variant uppercase tracking-widest">התקדמות</span>
                <span className="text-on-surface">{checklistDone}/6</span>
              </div>
              <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
                <div className="h-full bg-primary-container rounded-full transition-all" style={{ width: `${checklistPct}%` }} />
              </div>
            </div>
            <ul className="space-y-2 mb-6">
              {STEP_LABELS.slice(0, 4).map((label, i) => {
                const done = checklistSteps[i] as boolean;
                return (
                  <li key={i} className={`flex items-center gap-3 bg-surface-container-lowest p-3.5 rounded-xl border ${done ? "border-primary-container/30" : "border-outline-variant/10"}`}>
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${done ? "bg-primary-container" : "border-2 border-outline-variant"}`}>
                      {done && (
                        <span className="material-symbols-outlined text-on-primary-container" style={{ fontSize: "14px", fontVariationSettings: "'FILL' 1" }}>check</span>
                      )}
                    </div>
                    <span className={`text-sm font-semibold ${done ? "text-on-surface-variant line-through" : "text-on-surface"}`}>{label}</span>
                  </li>
                );
              })}
            </ul>
            <Link href="/checklist">
              <div className="w-full py-3.5 bg-surface-container-high text-on-surface font-bold rounded-xl hover:bg-surface-container-highest transition-colors text-center text-sm">
                פתח צ&apos;קליסט מלא
              </div>
            </Link>
          </div>

          {/* Weekly Activity */}
          <div className="lg:col-span-8 bg-surface-container-lowest border border-outline-variant/15 rounded-[1.5rem] p-8">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-xl font-extrabold tracking-tight text-on-surface">פעילות שבועית</h3>
                <p className="text-sm text-on-surface-variant mt-0.5">7 ימים אחרונים</p>
              </div>
              <Link href="/journal" className="text-sm font-bold text-primary underline">יומן מלא</Link>
            </div>
            <div className="flex items-end justify-between gap-3" style={{ height: "180px" }}>
              {weekDayMap.map((day, i) => {
                const heightPct = day.count > 0 ? Math.max(15, Math.round((day.count / maxCount) * 100)) : 0;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                    <div className="text-[10px] font-bold text-on-surface-variant h-4">
                      {day.count > 0 ? `${day.wins}W${day.losses > 0 ? ` ${day.losses}L` : ""}` : ""}
                    </div>
                    <div className="w-full flex items-end flex-1">
                      <div
                        className={`w-full rounded-t-xl transition-all duration-500 ${
                          day.isToday
                            ? "bg-primary-container border-2 border-primary"
                            : day.count > 0
                            ? "bg-on-surface group-hover:bg-primary-container"
                            : "bg-surface-container-high"
                        }`}
                        style={{ height: day.count > 0 ? `${heightPct}%` : "6px" }}
                      />
                    </div>
                    <div className={`text-[10px] font-bold ${day.isToday ? "text-primary" : "text-on-surface-variant"}`}>
                      {day.date}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Recent trades */}
        {allTrades.length > 0 && (
          <section className="bg-surface-container-lowest rounded-[1.5rem] overflow-hidden border border-outline-variant/10">
            <div className="p-6 lg:p-8 border-b border-outline-variant/10 flex justify-between items-center">
              <h3 className="text-lg font-black tracking-tight text-on-surface">עסקאות אחרונות</h3>
              <Link href="/journal" className="text-sm font-bold text-primary underline">הצג הכל</Link>
            </div>
            <div className="divide-y divide-outline-variant/5">
              {allTrades.slice(0, 5).map((trade) => (
                <div key={trade.id} className="flex items-center justify-between px-6 lg:px-8 py-4 hover:bg-surface-container-low transition-colors">
                  <div>
                    <p className="font-bold text-on-surface">{trade.asset || "—"}</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      {[trade.killzone, trade.entryTF].filter(Boolean).join(" · ") || "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {trade.rr && <span className="text-sm text-on-surface-variant">{trade.rr}R</span>}
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                      trade.result === "WIN" ? "bg-green-100 text-green-700" :
                      trade.result === "LOSS" ? "bg-error-container text-error" :
                      "bg-surface-container text-on-surface-variant"
                    }`}>
                      {trade.result}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
