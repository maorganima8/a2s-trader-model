import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [students, todayChecklists, todayTrades, weeklyReviews] = await Promise.all([
    prisma.user.findMany({
      where: { role: "STUDENT" },
      include: { studentProfile: true },
      orderBy: { joinedAt: "desc" },
    }),
    prisma.checklistEntry.findMany({
      where: { date: today },
      include: { user: { select: { name: true } } },
    }),
    prisma.trade.findMany({
      where: { entryTime: { gte: today } },
      include: { user: { select: { name: true } } },
    }),
    prisma.weeklyReview.findMany({
      where: {
        weekStart: { gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000) },
        submittedAt: { not: null },
      },
    }),
  ]);

  const activeStudents = students.filter(
    (s) => !s.accessExpiresAt || s.accessExpiresAt > new Date()
  );

  const tradedToday = new Set(todayTrades.map((t) => t.userId));
  const checklistedToday = new Set(
    todayChecklists.filter((c) => c.step1 && c.step2 && c.step3 && c.step4 && c.step5 && c.step6).map((c) => c.userId)
  );
  const reviewedThisWeek = new Set(weeklyReviews.map((r) => r.userId));

  const todayWins = todayTrades.filter((t) => t.result === "WIN").length;
  const todayLosses = todayTrades.filter((t) => t.result === "LOSS").length;

  const expiringSoon = students.filter((s) => {
    if (!s.accessExpiresAt) return false;
    const daysLeft = Math.ceil((s.accessExpiresAt.getTime() - Date.now()) / 86400000);
    return daysLeft > 0 && daysLeft <= 14;
  });

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">דשבורד</h1>
          <p className="text-zinc-500 text-sm mt-0.5">
            {today.toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
        <Link
          href="/admin/users/new"
          className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-4 py-2 rounded-xl text-sm transition flex items-center gap-1.5"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          תלמיד חדש
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          {
            label: "תלמידים פעילים", value: activeStudents.length, color: "text-white",
            icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
          },
          {
            label: "סחרו היום", value: tradedToday.size, color: "text-blue-400",
            icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
          },
          {
            label: "צ'קליסט הושלם", value: checklistedToday.size, color: "text-yellow-400",
            icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
          },
          {
            label: "WIN/LOSS היום", value: `${todayWins}/${todayLosses}`, color: "text-green-400",
            icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
          },
        ].map((stat) => (
          <div key={stat.label} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <div className="text-zinc-600 mb-3">{stat.icon}</div>
            <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
            <p className="text-zinc-500 text-xs mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Expiring soon alert */}
      {expiringSoon.length > 0 && (
        <div className="bg-red-950/20 border border-red-900/40 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <p className="text-red-400 font-semibold text-sm">גישה פגה בקרוב</p>
          </div>
          <div className="space-y-1.5">
            {expiringSoon.map((s) => {
              const days = Math.ceil((s.accessExpiresAt!.getTime() - Date.now()) / 86400000);
              return (
                <div key={s.id} className="flex justify-between text-sm">
                  <span className="text-zinc-300">{s.name}</span>
                  <span className="text-red-400 font-medium">{days} ימים</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Students table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="font-semibold text-white text-sm">תלמידים פעילים <span className="text-zinc-500 font-normal">({activeStudents.length})</span></h2>
          <Link href="/admin/students" className="text-yellow-500 text-xs hover:text-yellow-400 transition flex items-center gap-1">
            הצג הכל
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </Link>
        </div>

        {activeStudents.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-zinc-500 text-sm">אין תלמידים פעילים עדיין</p>
            <Link href="/admin/users/new" className="inline-block mt-3 text-yellow-500 text-sm hover:text-yellow-400">+ הוסף תלמיד</Link>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/50">
            {activeStudents.slice(0, 8).map((student) => {
              const traded = tradedToday.has(student.id);
              const checklist = checklistedToday.has(student.id);
              const reviewed = reviewedThisWeek.has(student.id);
              const daysLeft = student.accessExpiresAt
                ? Math.ceil((student.accessExpiresAt.getTime() - Date.now()) / 86400000)
                : null;

              return (
                <Link
                  key={student.id}
                  href={`/admin/students/${student.id}`}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-zinc-800/30 transition"
                >
                  <div>
                    <p className="text-white text-sm font-medium">{student.name}</p>
                    <p className="text-zinc-600 text-xs">{student.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span title="צ'קליסט" className={`w-6 h-6 rounded-lg flex items-center justify-center ${checklist ? "bg-yellow-500/15 text-yellow-400" : "bg-zinc-800 text-zinc-700"}`}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </span>
                    <span title="סחר היום" className={`w-6 h-6 rounded-lg flex items-center justify-center ${traded ? "bg-blue-500/15 text-blue-400" : "bg-zinc-800 text-zinc-700"}`}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                    </span>
                    <span title="סקירה שבועית" className={`w-6 h-6 rounded-lg flex items-center justify-center ${reviewed ? "bg-green-500/15 text-green-400" : "bg-zinc-800 text-zinc-700"}`}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    </span>
                    {daysLeft !== null && (
                      <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${daysLeft <= 14 ? "text-red-400 bg-red-950/30" : "text-zinc-600 bg-zinc-800"}`}>
                        {daysLeft}י
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
