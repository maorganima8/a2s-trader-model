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

  // Students expiring soon
  const expiringSoon = students.filter((s) => {
    if (!s.accessExpiresAt) return false;
    const daysLeft = Math.ceil((s.accessExpiresAt.getTime() - Date.now()) / 86400000);
    return daysLeft > 0 && daysLeft <= 14;
  });

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">Dashboard</h1>
          <p className="text-zinc-400 text-sm mt-0.5">
            {today.toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
        <Link
          href="/admin/users/new"
          className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-4 py-2 rounded-xl text-sm transition"
        >
          + תלמיד חדש
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: "תלמידים פעילים", value: activeStudents.length, color: "text-white" },
          { label: "סחרו היום", value: tradedToday.size, color: "text-blue-400" },
          { label: "צ׳קליסט הושלם", value: checklistedToday.size, color: "text-yellow-400" },
          { label: "WIN/LOSS היום", value: `${todayWins}/${todayLosses}`, color: "text-green-400" },
        ].map((stat) => (
          <div key={stat.label} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
            <p className="text-zinc-500 text-xs mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Alerts */}
      {expiringSoon.length > 0 && (
        <div className="bg-red-950/30 border border-red-900/50 rounded-2xl p-4 mb-5">
          <p className="text-red-400 font-semibold text-sm mb-2">⚠ גישה פגה בקרוב</p>
          <div className="space-y-1">
            {expiringSoon.map((s) => {
              const days = Math.ceil((s.accessExpiresAt!.getTime() - Date.now()) / 86400000);
              return (
                <div key={s.id} className="flex justify-between text-sm">
                  <span className="text-white">{s.name}</span>
                  <span className="text-red-400">{days} ימים</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Students table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="font-semibold text-white">כל התלמידים ({activeStudents.length})</h2>
          <Link href="/admin/students" className="text-yellow-500 text-sm hover:text-yellow-400">
            הצג הכל ←
          </Link>
        </div>
        <div className="divide-y divide-zinc-800">
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
                className="flex items-center justify-between px-5 py-3.5 hover:bg-zinc-800/50 transition"
              >
                <div>
                  <p className="text-white text-sm font-medium">{student.name}</p>
                  <p className="text-zinc-500 text-xs">{student.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span title="צ׳קליסט" className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${checklist ? "bg-yellow-500/20 text-yellow-400" : "bg-zinc-800 text-zinc-600"}`}>✓</span>
                  <span title="סחר היום" className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${traded ? "bg-green-500/20 text-green-400" : "bg-zinc-800 text-zinc-600"}`}>📈</span>
                  <span title="סקירה שבועית" className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${reviewed ? "bg-blue-500/20 text-blue-400" : "bg-zinc-800 text-zinc-600"}`}>📋</span>
                  {daysLeft !== null && (
                    <span className={`text-xs px-2 py-0.5 rounded-md ${daysLeft <= 14 ? "text-red-400 bg-red-950/40" : "text-zinc-500 bg-zinc-800"}`}>
                      {daysLeft}י
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
          {activeStudents.length === 0 && (
            <div className="px-5 py-8 text-center text-zinc-500 text-sm">
              אין תלמידים פעילים עדיין
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
