import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Trade, TradeResult, TradeType } from "@prisma/client";

function ResultBadge({ result }: { result: TradeResult }) {
  const styles = {
    WIN: "bg-green-500/15 text-green-400",
    LOSS: "bg-red-500/15 text-red-400",
    BE: "bg-yellow-500/15 text-yellow-400",
  };
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${styles[result]}`}>
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
  const wins = trades.filter((t: Trade) => t.result === "WIN").length;
  const losses = trades.filter((t: Trade) => t.result === "LOSS").length;
  const winRate = totalTrades > 0 ? Math.round((wins / totalTrades) * 100) : 0;
  const grouped = groupByDate(trades);

  return (
    <div className="px-4 pt-6 pb-24 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-black text-white">יומן מסחר</h1>
          <p className="text-zinc-500 text-sm mt-0.5">{totalTrades} עסקאות</p>
        </div>
        <Link
          href="/journal/new"
          className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-4 py-2 rounded-xl text-sm transition flex items-center gap-1.5"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          עסקה
        </Link>
      </div>

      {/* Stats */}
      {totalTrades > 0 && (
        <div className="grid grid-cols-4 gap-2 mb-5">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 text-center">
            <p className="text-xl font-black text-white">{totalTrades}</p>
            <p className="text-[10px] text-zinc-500 mt-0.5">עסקאות</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 text-center">
            <p className="text-xl font-black text-green-400">{winRate}%</p>
            <p className="text-[10px] text-zinc-500 mt-0.5">Win Rate</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 text-center">
            <p className="text-xl font-black text-green-400">{wins}</p>
            <p className="text-[10px] text-zinc-500 mt-0.5">WIN</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 text-center">
            <p className="text-xl font-black text-red-400">{losses}</p>
            <p className="text-[10px] text-zinc-500 mt-0.5">LOSS</p>
          </div>
        </div>
      )}

      {/* Weekly review shortcut */}
      <Link href="/journal/weekly" className="flex items-center justify-between bg-zinc-900 border border-zinc-800 hover:border-yellow-500/30 rounded-2xl px-4 py-3 mb-5 transition group">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-zinc-800 group-hover:bg-yellow-500/10 flex items-center justify-center transition">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#EAB308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <span className="text-white text-sm font-medium">סקירה שבועית</span>
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#52525b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </Link>

      {/* Empty state */}
      {totalTrades === 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#52525b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          </div>
          <p className="text-zinc-300 font-semibold text-sm">אין עסקאות עדיין</p>
          <p className="text-zinc-600 text-xs mt-1 mb-4">תעד את העסקה הראשונה שלך</p>
          <Link href="/journal/new" className="inline-block bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-6 py-2.5 rounded-xl text-sm transition">
            + תעד עסקה ראשונה
          </Link>
        </div>
      )}

      {/* Trades list */}
      {totalTrades > 0 && (
        <div className="space-y-5">
          {Object.entries(grouped).map(([date, dayTrades]) => {
            const dayWins = dayTrades.filter((t: Trade) => t.result === "WIN").length;
            const dayLosses = dayTrades.filter((t: Trade) => t.result === "LOSS").length;

            return (
              <div key={date}>
                <div className="flex items-center justify-between mb-2 px-1">
                  <p className="text-xs text-zinc-500 font-medium">{date}</p>
                  <p className={`text-xs font-bold ${dayWins > dayLosses ? "text-green-400" : dayLosses > dayWins ? "text-red-400" : "text-yellow-400"}`}>
                    {dayWins}W · {dayLosses}L
                  </p>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-800/50">
                  {dayTrades.map((trade: Trade) => (
                    <div key={trade.id} className="flex items-center justify-between px-4 py-3.5">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-semibold text-sm">{trade.asset || "—"}</span>
                          <span className="text-[10px] text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded font-mono">
                            {trade.type === TradeType.LIVE ? "LIVE" : "SIM"}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-600 mt-0.5">
                          {[trade.killzone, trade.entryTF, trade.process].filter(Boolean).join(" · ") || "—"}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <ResultBadge result={trade.result} />
                        {trade.rr && <span className="text-xs text-zinc-600">{trade.rr}R</span>}
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
