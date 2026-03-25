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

  const totalTrades = recentTrades.length;
  const wins = recentTrades.filter((t) => t.result === "WIN").length;

  return (
    <div className="px-4 pt-8 pb-28 max-w-lg mx-auto space-y-5">

      {/* Greeting */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium mb-0.5" style={{ color: 'var(--md-on-surface-variant)' }}>
            יום {dayNumber} לתוכנית
          </p>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--md-on-surface)' }}>
            שלום, {user.name.split(" ")[0]}
          </h1>
        </div>
        {daysRemaining !== null && (
          <div
            className="text-center rounded-2xl px-4 py-2.5"
            style={{ backgroundColor: daysRemaining <= 14 ? '#4a0000' : 'var(--md-surface-container)', color: daysRemaining <= 14 ? '#ffb4ab' : 'var(--md-on-surface)' }}
          >
            <p className="text-2xl font-bold leading-none">{daysRemaining}</p>
            <p className="text-xs mt-0.5 opacity-70">ימים נותרו</p>
          </div>
        )}
      </div>

      {/* Program progress — M3 filled card */}
      <div className="rounded-3xl p-5" style={{ backgroundColor: 'var(--md-surface-container)' }}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium" style={{ color: 'var(--md-on-surface)' }}>התקדמות בתוכנית</span>
          <span className="text-sm font-bold" style={{ color: 'var(--md-primary)' }}>{progressPct}%</span>
        </div>
        <p className="text-xs mb-3" style={{ color: 'var(--md-on-surface-variant)' }}>יום {dayNumber} מתוך 90</p>
        <div className="w-full rounded-full h-2" style={{ backgroundColor: 'var(--md-surface-highest)' }}>
          <div
            className="h-2 rounded-full transition-all"
            style={{ width: `${progressPct}%`, backgroundColor: 'var(--md-primary)' }}
          />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "עסקאות", value: totalTrades, color: 'var(--md-on-surface)' },
          { label: "WIN Rate", value: totalTrades > 0 ? `${Math.round((wins / totalTrades) * 100)}%` : "—", color: 'var(--md-success)' },
          { label: "צ'קליסט", value: `${checklistDone}/6`, color: checklistDone === 6 ? 'var(--md-primary)' : 'var(--md-on-surface)' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl p-4 text-center" style={{ backgroundColor: 'var(--md-surface-container)' }}>
            <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--md-on-surface-variant)' }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Checklist card — M3 outlined card */}
      <Link href="/checklist">
        <div
          className="rounded-3xl p-5 transition-all active:scale-[0.98]"
          style={{ backgroundColor: 'var(--md-surface-container)', border: checklistDone === 6 ? '1px solid var(--md-primary)' : '1px solid var(--md-outline-variant)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: checklistDone === 6 ? 'var(--md-primary-container)' : 'var(--md-surface-high)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={checklistDone === 6 ? 'var(--md-primary)' : 'var(--md-on-surface-variant)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 11l3 3L22 4"/>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                </svg>
              </div>
              <div>
                <p className="font-semibold text-sm" style={{ color: 'var(--md-on-surface)' }}>צ'קליסט יומי</p>
                <p className="text-xs" style={{ color: 'var(--md-on-surface-variant)' }}>
                  {checklistDone === 0 ? "לא התחלת עדיין" : checklistDone === 6 ? "הושלם!" : `${checklistDone} מתוך 6`}
                </p>
              </div>
            </div>
            <span className="text-sm font-bold" style={{ color: 'var(--md-primary)' }}>{checklistDone}/6</span>
          </div>
          <div className="w-full rounded-full h-1.5" style={{ backgroundColor: 'var(--md-surface-highest)' }}>
            <div className="h-1.5 rounded-full transition-all" style={{ width: `${(checklistDone / 6) * 100}%`, backgroundColor: 'var(--md-primary)' }} />
          </div>
        </div>
      </Link>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/journal/new">
          <div className="rounded-3xl p-5 transition-all active:scale-[0.98]" style={{ backgroundColor: 'var(--md-surface-container)' }}>
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: 'var(--md-primary-container)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--md-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </div>
            <p className="font-semibold text-sm" style={{ color: 'var(--md-on-surface)' }}>תעד עסקה</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--md-on-surface-variant)' }}>הוסף ליומן</p>
          </div>
        </Link>
        <Link href="/journal/weekly">
          <div className="rounded-3xl p-5 transition-all active:scale-[0.98]" style={{ backgroundColor: 'var(--md-surface-container)' }}>
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: 'var(--md-surface-high)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--md-on-surface-variant)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <p className="font-semibold text-sm" style={{ color: 'var(--md-on-surface)' }}>סקירה שבועית</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--md-on-surface-variant)' }}>סיכום שבועי</p>
          </div>
        </Link>
      </div>

      {/* Recent trades */}
      {recentTrades.length > 0 ? (
        <div className="rounded-3xl overflow-hidden" style={{ backgroundColor: 'var(--md-surface-container)' }}>
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--md-outline-variant)' }}>
            <span className="font-semibold text-sm" style={{ color: 'var(--md-on-surface)' }}>עסקאות אחרונות</span>
            <Link href="/journal" className="text-xs font-medium" style={{ color: 'var(--md-primary)' }}>הצג הכל</Link>
          </div>
          {recentTrades.map((trade, i) => (
            <div
              key={trade.id}
              className="flex items-center justify-between px-5 py-3.5"
              style={{ borderBottom: i < recentTrades.length - 1 ? '1px solid var(--md-outline-variant)' : 'none' }}
            >
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--md-on-surface)' }}>{trade.asset || "—"}</p>
                <p className="text-xs" style={{ color: 'var(--md-on-surface-variant)' }}>{trade.killzone ?? "—"}</p>
              </div>
              <div className="flex items-center gap-2">
                {trade.rr && <span className="text-xs" style={{ color: 'var(--md-on-surface-variant)' }}>{trade.rr}R</span>}
                <span
                  className="text-xs font-bold px-2.5 py-1 rounded-full"
                  style={{
                    backgroundColor: trade.result === "WIN" ? 'rgba(109,213,140,0.15)' : trade.result === "LOSS" ? 'rgba(255,180,171,0.15)' : 'var(--md-primary-container)',
                    color: trade.result === "WIN" ? 'var(--md-success)' : trade.result === "LOSS" ? 'var(--md-error)' : 'var(--md-primary)',
                  }}
                >
                  {trade.result}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl p-10 text-center" style={{ backgroundColor: 'var(--md-surface-container)' }}>
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: 'var(--md-surface-high)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--md-on-surface-variant)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          </div>
          <p className="font-medium text-sm" style={{ color: 'var(--md-on-surface)' }}>אין עסקאות עדיין</p>
          <p className="text-xs mt-1" style={{ color: 'var(--md-on-surface-variant)' }}>תעד את העסקה הראשונה שלך</p>
        </div>
      )}
    </div>
  );
}
