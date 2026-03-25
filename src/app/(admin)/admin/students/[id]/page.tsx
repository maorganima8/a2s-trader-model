import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function StudentDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const student = await prisma.user.findUnique({
    where: { id: params.id, role: "STUDENT" },
    include: {
      studentProfile: true,
      trades: { orderBy: { entryTime: "desc" }, take: 5 },
      checklists: { orderBy: { date: "desc" }, take: 7 },
      weeklyReviews: { orderBy: { weekStart: "desc" }, take: 4 },
      mistakes: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });

  if (!student) notFound();

  const daysLeft = student.accessExpiresAt
    ? Math.ceil((student.accessExpiresAt.getTime() - Date.now()) / 86400000)
    : null;
  const dayNumber = student.joinedAt
    ? Math.floor((Date.now() - student.joinedAt.getTime()) / 86400000) + 1
    : null;

  const totalTrades = await prisma.trade.count({ where: { userId: student.id } });
  const wins = await prisma.trade.count({ where: { userId: student.id, result: "WIN" } });
  const winRate = totalTrades > 0 ? Math.round((wins / totalTrades) * 100) : 0;

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/students" className="text-zinc-400 hover:text-white transition text-lg">←</Link>
        <div className="flex-1">
          <h1 className="text-2xl font-black text-white">{student.name}</h1>
          <p className="text-zinc-400 text-sm">{student.email} · {student.phone ?? "—"}</p>
        </div>
        <Link
          href={`/admin/students/${student.id}/lesson2`}
          className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-4 py-2 rounded-xl text-sm transition"
        >
          שיעור 2
        </Link>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: "יום בתוכנית", value: dayNumber ?? "—" },
          { label: "ימים נותרו", value: daysLeft ?? "—", warn: daysLeft !== null && daysLeft <= 14 },
          { label: "עסקאות", value: totalTrades },
          { label: "Win Rate", value: `${winRate}%` },
        ].map((s) => (
          <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 text-center">
            <p className={`text-xl font-black ${"warn" in s && s.warn ? "text-red-400" : "text-white"}`}>{s.value}</p>
            <p className="text-zinc-500 text-xs mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Recent trades */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl mb-4">
        <div className="px-4 py-3 border-b border-zinc-800 flex justify-between items-center">
          <h2 className="font-semibold text-white text-sm">עסקאות אחרונות</h2>
          <span className="text-zinc-500 text-xs">{totalTrades} סה״כ</span>
        </div>
        {student.trades.length === 0 ? (
          <p className="text-zinc-500 text-sm text-center py-6">אין עסקאות</p>
        ) : (
          <div className="divide-y divide-zinc-800">
            {student.trades.map((t) => (
              <div key={t.id} className="px-4 py-3 flex justify-between items-center">
                <div>
                  <span className="text-white text-sm">{t.asset}</span>
                  <span className="text-zinc-500 text-xs mr-2">{t.killzone ?? ""}</span>
                </div>
                <span className={`text-xs font-bold ${t.result === "WIN" ? "text-green-400" : t.result === "LOSS" ? "text-red-400" : "text-yellow-400"}`}>
                  {t.result}{t.rr ? ` · ${t.rr}R` : ""}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mistakes */}
      {student.mistakes.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl mb-4">
          <div className="px-4 py-3 border-b border-zinc-800">
            <h2 className="font-semibold text-white text-sm">טעויות חוזרות</h2>
          </div>
          <div className="divide-y divide-zinc-800">
            {student.mistakes.map((m) => (
              <div key={m.id} className="px-4 py-3">
                <p className="text-zinc-300 text-sm">{m.description}</p>
                <p className="text-zinc-600 text-xs mt-0.5">
                  {new Date(m.createdAt).toLocaleDateString("he-IL")}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Profile summary */}
      {student.studentProfile && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <h2 className="font-semibold text-white text-sm mb-3">פרופיל</h2>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            {student.studentProfile.market && <div><span className="text-zinc-500">שוק: </span><span className="text-white">{student.studentProfile.market}</span></div>}
            {student.studentProfile.process && <div><span className="text-zinc-500">תהליך: </span><span className="text-white">{student.studentProfile.process}</span></div>}
            {student.studentProfile.preferredTF && <div><span className="text-zinc-500">TF: </span><span className="text-white">{student.studentProfile.preferredTF}</span></div>}
            {student.studentProfile.riskLevel1 && <div><span className="text-zinc-500">סיכון: </span><span className="text-white">{student.studentProfile.riskLevel1}%</span></div>}
          </div>
        </div>
      )}
    </div>
  );
}
