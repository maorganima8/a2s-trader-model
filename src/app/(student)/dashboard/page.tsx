import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

function getDaysRemaining(accessExpiresAt: Date | null): number | null {
  if (!accessExpiresAt) return null;
  const diff = accessExpiresAt.getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function getDaysSinceJoined(joinedAt: Date | null): number {
  if (!joinedAt) return 0;
  const diff = Date.now() - joinedAt.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

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

  const checklistDone = checklist
    ? [checklist.step1, checklist.step2, checklist.step3, checklist.step4, checklist.step5, checklist.step6].filter(Boolean).length
    : 0;

  const daysRemaining = getDaysRemaining(user.accessExpiresAt);
  const dayNumber = getDaysSinceJoined(user.joinedAt) + 1;
  const progressPct = Math.min(100, Math.round((dayNumber / 90) * 100));

  const recentTrades = await prisma.trade.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const totalTrades = await prisma.trade.count({ where: { userId: user.id } });
  const wins = await prisma.trade.count({ where: { userId: user.id, result: "WIN" } });
  const winRate = totalTrades > 0 ? Math.round((wins / totalTrades) * 100) : 0;

  return (
    <div className="px-4 pt-6 pb-24 max-w-lg mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-zinc-500 text-xs mb-0.5">יום {dayNumber} לתוכנית</p>
          <h1 className="text-2xl font-black text-white">שלום, {user.name.split(" ")[0]}</h1>
        </div>
        {daysRemaining !== null && (
          <div className="text-center bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2">
            <p className={`text-xl font-black ${daysRemaining <= 14 ? "text-red-400" : "text-yellow-400"}`}>{daysRemaining}</p>
            <p className="text-zinc-500 text-[10px]">ימים נותרו</p>
          </div>
        )}
      </div>

      {/* Program progress */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-white text-sm font-semibold">התקדמות בתוכנית</span>
          <span className="text-yellow-400 text-sm font-bold">{progressPct}%</span>
        </div>
        <div className="w-full bg-zinc-800 rounded-full h-1.5">
          <div className="bg-yellow-400 h-1.5 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
        </div>
        <p className="text-zinc-600 text-xs mt-2">יום {dayNumber} מתוך 90</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5 text-center">
          <p className="text-xl font-black text-white">{totalTrades}</p>
          <p className="text-zinc-500 text-[10px] mt-0.5">עסקאות</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5 text-center">
          <p className="text-xl font-black text-green-400">{winRate}%</p>
          <p className="text-zinc-500 text-[10px] mt-0.5">Win Rate</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5 text-center">
          <p className="text-xl font-black text-yellow-400">{checklistDone}/6</p>
          <p className="text-zinc-500 text-[10px] mt-0.5">צ'קליסט</p>
        </div>
      </div>

      {/* Checklist card */}
      <Link href="/checklist" className="block bg-zinc-900 border border-zinc-800 hover:border-yellow-500/40 rounded-2xl p-4 transition group">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${checklistDone === 6 ? "bg-yellow-500/20" : "bg-zinc-800"}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={checklistDone === 6 ? "#EAB308" : "#71717a"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11l3 3L22 4"/>
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
              </svg>
            </div>
            <span className="text-white font-semibold text-sm">צ'קליסט יומי</span>
          </div>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${checklistDone === 6 ? "bg-yellow-500/20 text-yellow-400" : "bg-zinc-800 text-zinc-400"}`}>
            {checklistDone}/6
          </span>
        </div>
        <div className="w-full bg-zinc-800 rounded-full h-1.5">
          <div className="bg-yellow-400 h-1.5 rounded-full transition-all" style={{ width: `${(checklistDone / 6) * 100}%` }} />
        </div>
        <p className="text-zinc-600 text-xs mt-2">
          {checklistDone === 0 && "לחץ להתחלת הצ'קליסט"}
          {checklistDone > 0 && checklistDone < 6 && `השלמת ${checklistDone} מתוך 6 שלבים`}
          {checklistDone === 6 && "הצ'קליסט הושלם היום"}
        </p>
      </Link>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/journal/new" className="bg-zinc-900 border border-zinc-800 hover:border-yellow-500/40 rounded-2xl p-4 transition group">
          <div className="w-9 h-9 rounded-xl bg-zinc-800 group-hover:bg-yellow-500/10 flex items-center justify-center mb-3 transition">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EAB308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </div>
          <p className="text-white text-sm font-semibold">תעד עסקה</p>
          <p className="text-zinc-600 text-xs mt-0.5">הוסף ליומן</p>
        </Link>
        <Link href="/journal/weekly" className="bg-zinc-900 border border-zinc-800 hover:border-yellow-500/40 rounded-2xl p-4 transition group">
          <div className="w-9 h-9 rounded-xl bg-zinc-800 group-hover:bg-yellow-500/10 flex items-center justify-center mb-3 transition">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EAB308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <p className="text-white text-sm font-semibold">סקירה שבועית</p>
          <p className="text-zinc-600 text-xs mt-0.5">סיכום שבועי</p>
        </Link>
      </div>

      {/* Recent trades */}
      {recentTrades.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="px-4 py-3.5 border-b border-zinc-800 flex items-center justify-between">
            <span className="text-white font-semibold text-sm">עסקאות אחרונות</span>
            <Link href="/journal" className="text-yellow-500 text-xs hover:text-yellow-400 transition">הצג הכל ←</Link>
          </div>
          <div className="divide-y divide-zinc-800/50">
            {recentTrades.map((trade) => (
              <div key={trade.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-white text-sm font-medium">{trade.asset || "—"}</p>
                  <p className="text-zinc-600 text-xs">{trade.killzone ?? "—"}</p>
                </div>
                <div className="text-left flex items-center gap-2">
                  {trade.rr && <span className="text-zinc-500 text-xs">{trade.rr}R</span>}
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                    trade.result === "WIN" ? "bg-green-500/15 text-green-400" :
                    trade.result === "LOSS" ? "bg-red-500/15 text-red-400" :
                    "bg-yellow-500/15 text-yellow-400"
                  }`}>
                    {trade.result === "WIN" ? "WIN" : trade.result === "LOSS" ? "LOSS" : "BE"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {recentTrades.length === 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center mx-auto mb-3">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#52525b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          </div>
          <p className="text-zinc-400 text-sm font-medium">אין עסקאות עדיין</p>
          <p className="text-zinc-600 text-xs mt-1">תעד את העסקה הראשונה שלך</p>
        </div>
      )}
    </div>
  );
}
