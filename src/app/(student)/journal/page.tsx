import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Trade, TradeResult, TradeType } from "@prisma/client";

function ResultBadge({ result }: { result: TradeResult }) {
  const styles = {
    WIN: "bg-green-500/20 text-green-400 border-green-800",
    LOSS: "bg-red-500/20 text-red-400 border-red-800",
    BE: "bg-yellow-500/20 text-yellow-400 border-yellow-800",
  };
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${styles[result]}`}>
      {result}
    </span>
  );
}

function groupByDate(trades: Trade[]) {
  const groups: Record<string, Trade[]> = {};
  trades.forEach((t) => {
    const key = new Date(t.entryTime).toLocaleDateString("he-IL", {
      day: "numeric", month: "long", year: "numeric",
    });
    if (!groups[key]) groups[key] = [];
    groups[key].push(t);
  });
  return groups;
}

export default async function JournalPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const trades = await prisma.trade.findMany({
    where: { userId: session.user.id },
    orderBy: { entryTime: "desc" },
  });

  const totalTrades = trades.length;
  const wins = trades.filter((t) => t.result === "WIN").length;
  const losses = trades.filter((t) => t.result === "LOSS").length;
  const winRate = totalTrades > 0 ? Math.round((wins / totalTrades) * 100) : 0;
  const grouped = groupByDate(trades);

  return (
    <div className="px-4 pt-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-white">יומן מסחר</h1>
        <Link
          href="/journal/new"
          className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-4 py-2 rounded-xl text-sm transition"
        >
          + עסקה
        </Link>
      </div>

      {/* Stats */}
      {totalTrades > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-5">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 text-center">
            <p className="text-2xl font-black text-white">{totalTrades}</p>
            <p className="text-xs text-zinc-500 mt-0.5">עסקאות</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 text-center">
            <p className="text-2xl font-black text-green-400">{winRate}%</p>
            <p className="text-xs text-zinc-500 mt-0.5">Win Rate</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 text-center">
            <p className="text-2xl font-black text-white">{wins}<span className="text-zinc-600 text-sm">/{losses}</span></p>
            <p className="text-xs text-zinc-500 mt-0.5">W/L</p>
          </div>
        </div>
      )}

      {/* Trades list */}
      {totalTrades === 0 ? (
        <div className="text-center py-20">
          <p className="text-4xl mb-3">📓</p>
          <p className="text-zinc-400 text-sm">עדיין לא תיעדת עסקאות</p>
          <Link
            href="/journal/new"
            className="inline-block mt-4 bg-yellow-500 text-black font-bold px-6 py-2.5 rounded-xl text-sm"
          >
            תעד עסקה ראשונה
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).map(([date, dayTrades]) => {
            const dayWins = dayTrades.filter((t) => t.result === "WIN").length;
            const dayLosses = dayTrades.filter((t) => t.result === "LOSS").length;
            const dayColor = dayWins > dayLosses ? "text-green-400" : dayLosses > dayWins ? "text-red-400" : "text-yellow-400";

            return (
              <div key={date}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-zinc-500 font-medium">{date}</p>
                  <p className={`text-xs font-bold ${dayColor}`}>
                    {dayWins}W · {dayLosses}L
                  </p>
                </div>
                <div className="space-y-2">
                  {dayTrades.map((trade) => (
                    <div
                      key={trade.id}
                      className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-semibold text-sm">{trade.asset}</span>
                            <span className="text-xs text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded">
                              {trade.type === TradeType.LIVE ? "לייב" : "בדיעבד"}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-500 mt-0.5">
                            {trade.killzone ?? "—"}
                            {trade.entryTF ? ` · ${trade.entryTF}` : ""}
                            {trade.process ? ` · ${trade.process}` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <ResultBadge result={trade.result} />
                        {trade.rr && (
                          <span className="text-xs text-zinc-500">{trade.rr}R</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
