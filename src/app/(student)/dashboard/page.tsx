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

  const recentTrades = await prisma.trade.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  return (
    <div className="px-4 pt-6 space-y-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">שלום, {user.name.split(" ")[0]}</h1>
          <p className="text-gray-400 text-sm">יום {dayNumber} לתוכנית</p>
        </div>
        {daysRemaining !== null && (
          <div className="text-left">
            <p className="text-xs text-gray-500">נותרו</p>
            <p className={`text-lg font-bold ${daysRemaining <= 14 ? "text-red-400" : "text-green-400"}`}>
              {daysRemaining} ימים
            </p>
          </div>
        )}
      </div>

      {/* Checklist card */}
      <Link href="/checklist" className="block bg-gray-900 rounded-2xl p-4 border border-gray-800 hover:border-blue-600 transition">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-white">צ׳קליסט היום</h2>
          <span className="text-sm text-gray-400">{checklistDone}/6</span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all"
            style={{ width: `${(checklistDone / 6) * 100}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {checklistDone === 0 && "עוד לא התחלת את הצ׳קליסט"}
          {checklistDone > 0 && checklistDone < 6 && `השלמת ${checklistDone} מתוך 6 שלבים`}
          {checklistDone === 6 && "הצ׳קליסט הושלם!"}
        </p>
      </Link>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/journal/new" className="bg-gray-900 rounded-2xl p-4 border border-gray-800 hover:border-green-600 transition text-center">
          <p className="text-2xl mb-1">📝</p>
          <p className="text-sm font-medium text-white">תעד עסקה</p>
        </Link>
        <Link href="/journal" className="bg-gray-900 rounded-2xl p-4 border border-gray-800 hover:border-purple-600 transition text-center">
          <p className="text-2xl mb-1">📓</p>
          <p className="text-sm font-medium text-white">יומן מסחר</p>
        </Link>
      </div>

      {/* Recent trades */}
      {recentTrades.length > 0 && (
        <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
          <h2 className="font-semibold text-white mb-3">עסקאות אחרונות</h2>
          <div className="space-y-2">
            {recentTrades.map((trade) => (
              <div key={trade.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white">{trade.asset}</p>
                  <p className="text-xs text-gray-500">{trade.killzone ?? "—"}</p>
                </div>
                <div className="text-right">
                  <span
                    className={`text-sm font-semibold ${
                      trade.result === "WIN"
                        ? "text-green-400"
                        : trade.result === "LOSS"
                        ? "text-red-400"
                        : "text-yellow-400"
                    }`}
                  >
                    {trade.result === "WIN" ? "WIN" : trade.result === "LOSS" ? "LOSS" : "BE"}
                  </span>
                  {trade.rr && (
                    <p className="text-xs text-gray-500">{trade.rr}R</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
