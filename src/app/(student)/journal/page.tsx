import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Trade, TradeResult, TradeType } from "@prisma/client";

function ResultBadge({ result }: { result: TradeResult }) {
  const styles: Record<TradeResult, string> = {
    WIN: "bg-green-100 text-green-700",
    LOSS: "bg-error-container text-error",
    BE: "bg-surface-container text-on-surface-variant",
  };
  return (
    <span className={`text-xs font-bold px-3 py-1 rounded-full ${styles[result]}`}>
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
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md flex items-center justify-between px-6 lg:px-12 h-20 border-b border-outline-variant/10">
        <div>
          <h2 className="text-2xl font-black tracking-tighter text-on-surface">יומן מסחר</h2>
          <p className="text-xs text-on-surface-variant font-medium mt-0.5">{totalTrades} עסקאות</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/journal/weekly">
            <button className="hidden lg:flex items-center gap-2 text-sm font-bold text-on-surface-variant px-4 py-2 rounded-xl border border-outline-variant/20 hover:bg-surface-container transition-colors">
              <span className="material-symbols-outlined text-base">calendar_view_week</span>
              סקירה שבועית
            </button>
          </Link>
          <Link href="/journal/new">
            <button className="flex items-center gap-2 bg-primary-container text-on-primary-container font-bold px-5 py-2.5 rounded-xl shadow hover:scale-[0.98] transition-all text-sm">
              <span className="material-symbols-outlined text-base">add</span>
              עסקה
            </button>
          </Link>
        </div>
      </header>

      <div className="p-6 lg:p-12 max-w-4xl mx-auto">
        {/* Stats */}
        {totalTrades > 0 && (
          <div className="grid grid-cols-4 gap-4 mb-8">
            {[
              { label: "עסקאות", value: totalTrades, cls: "text-on-surface" },
              { label: "Win Rate", value: `${winRate}%`, cls: "text-primary" },
              { label: "WIN", value: wins, cls: "text-green-700" },
              { label: "LOSS", value: losses, cls: "text-error" },
            ].map((s) => (
              <div key={s.label} className="bg-surface-container-lowest border border-outline-variant/10 rounded-2xl p-5 text-center">
                <p className={`text-2xl font-black ${s.cls}`}>{s.value}</p>
                <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Weekly review — mobile only */}
        <Link href="/journal/weekly" className="flex lg:hidden items-center justify-between bg-surface-container-lowest border border-outline-variant/10 hover:border-primary-container/50 rounded-2xl px-5 py-4 mb-6 transition-all">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center">
              <span className="material-symbols-outlined text-on-primary-container text-base" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_view_week</span>
            </div>
            <span className="text-on-surface text-sm font-bold">סקירה שבועית</span>
          </div>
          <span className="material-symbols-outlined text-on-surface-variant">chevron_left</span>
        </Link>

        {/* Empty state */}
        {totalTrades === 0 && (
          <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-3xl p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center mx-auto mb-5">
              <span className="material-symbols-outlined text-on-surface-variant text-3xl">query_stats</span>
            </div>
            <p className="text-on-surface font-bold mb-2">אין עסקאות עדיין</p>
            <p className="text-on-surface-variant text-sm mb-6">תעד את העסקה הראשונה שלך</p>
            <Link href="/journal/new" className="inline-block bg-primary-container text-on-primary-container font-bold px-8 py-3 rounded-xl text-sm hover:scale-[0.98] transition-all">
              + תעד עסקה ראשונה
            </Link>
          </div>
        )}

        {/* Trades list */}
        {totalTrades > 0 && (
          <div className="space-y-6">
            {Object.entries(grouped).map(([date, dayTrades]) => {
              const dayWins = dayTrades.filter((t: Trade) => t.result === "WIN").length;
              const dayLosses = dayTrades.filter((t: Trade) => t.result === "LOSS").length;
              return (
                <div key={date}>
                  <div className="flex items-center justify-between mb-3 px-1">
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">{date}</p>
                    <p className={`text-xs font-bold ${dayWins > dayLosses ? "text-green-700" : dayLosses > dayWins ? "text-error" : "text-primary"}`}>
                      {dayWins}W · {dayLosses}L
                    </p>
                  </div>
                  <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-2xl overflow-hidden divide-y divide-outline-variant/5">
                    {dayTrades.map((trade: Trade) => (
                      <div key={trade.id} className="flex items-center justify-between px-6 py-4 hover:bg-surface-container-low transition-colors">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-on-surface font-bold">{trade.asset || "—"}</span>
                            <span className="text-[10px] text-on-surface-variant bg-surface-container px-2 py-0.5 rounded font-mono border border-outline-variant/10">
                              {trade.type === TradeType.LIVE ? "LIVE" : "SIM"}
                            </span>
                          </div>
                          <p className="text-xs text-on-surface-variant mt-0.5">
                            {[trade.killzone, trade.entryTF, trade.process].filter(Boolean).join(" · ") || "—"}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                          <ResultBadge result={trade.result} />
                          {trade.rr && <span className="text-xs text-on-surface-variant">{trade.rr}R</span>}
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
    </div>
  );
}
