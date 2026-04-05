import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Trade } from "@prisma/client";

export default async function StatisticsPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const trades = await prisma.trade.findMany({
    where: { userId: session.user.id },
    orderBy: { entryTime: "asc" },
  });

  const totalTrades = trades.length;
  const wins = trades.filter((t: Trade) => t.result === "WIN").length;
  const losses = trades.filter((t: Trade) => t.result === "LOSS").length;
  const bes = trades.filter((t: Trade) => t.result === "BE").length;
  const winRate = totalTrades > 0 ? Math.round((wins / totalTrades) * 100) : 0;
  const totalR = trades.reduce((sum: number, t: Trade) => sum + (t.rr ?? 0), 0);

  const grossWins = trades
    .filter((t: Trade) => t.result === "WIN")
    .reduce((s: number, t: Trade) => s + (t.rr ?? 0), 0);
  const grossLosses = Math.abs(
    trades.filter((t: Trade) => t.result === "LOSS")
      .reduce((s: number, t: Trade) => s + (t.rr ?? 0), 0)
  );
  const profitFactor = grossLosses > 0 ? (grossWins / grossLosses).toFixed(2) : "∞";

  // Asset distribution
  const byAsset: Record<string, number> = {};
  trades.forEach((t: Trade) => {
    if (!t.asset) return;
    byAsset[t.asset] = (byAsset[t.asset] ?? 0) + 1;
  });
  const assetEntries = Object.entries(byAsset)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([asset, count]) => ({ asset, count, pct: Math.round((count / totalTrades) * 100) }));

  // Killzone performance
  const byKillzone: Record<string, { total: number; wins: number; r: number }> = {};
  trades.forEach((t: Trade) => {
    const kz = t.killzone ?? "אחר";
    if (!byKillzone[kz]) byKillzone[kz] = { total: 0, wins: 0, r: 0 };
    byKillzone[kz].total++;
    if (t.result === "WIN") byKillzone[kz].wins++;
    byKillzone[kz].r += t.rr ?? 0;
  });
  const kzEntries = Object.entries(byKillzone).sort((a, b) => b[1].r - a[1].r).slice(0, 5);
  const maxKzR = Math.max(...kzEntries.map(([, v]) => Math.abs(v.r)), 1);

  // Setup efficiency
  const bySetup: Record<string, { total: number; wins: number; r: number }> = {};
  trades.forEach((t: Trade) => {
    const s = t.setupType ?? "לא מוגדר";
    if (!bySetup[s]) bySetup[s] = { total: 0, wins: 0, r: 0 };
    bySetup[s].total++;
    if (t.result === "WIN") bySetup[s].wins++;
    bySetup[s].r += t.rr ?? 0;
  });
  const setupEntries = Object.entries(bySetup).sort((a, b) => b[1].r - a[1].r);

  // Equity curve (cumulative R)
  let cumR = 0;
  const equityCurve = trades.map((t: Trade) => {
    cumR += t.rr ?? 0;
    return cumR;
  });

  const svgW = 800;
  const svgH = 200;
  const pad = 20;
  const maxR = Math.max(...equityCurve, 0.1);
  const minR = Math.min(...equityCurve, 0);
  const range = maxR - minR || 1;

  const points = equityCurve.map((val, i) => ({
    x: pad + (i / Math.max(equityCurve.length - 1, 1)) * (svgW - pad * 2),
    y: svgH - pad - ((val - minR) / range) * (svgH - pad * 2),
  }));
  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const fillD = points.length > 1
    ? `${pathD} L ${points[points.length - 1].x} ${svgH} L ${points[0].x} ${svgH} Z`
    : "";

  const winRateDash = Math.round((winRate / 100) * 251);

  if (totalTrades === 0) {
    return (
      <div className="min-h-screen bg-surface">
        <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md flex items-center px-6 lg:px-12 h-20 border-b border-outline-variant/10">
          <h2 className="text-2xl font-black tracking-tighter text-on-surface">סטטיסטיקות</h2>
        </header>
        <div className="p-6 lg:p-12 max-w-2xl">
          <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-3xl p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center mx-auto mb-5">
              <span className="material-symbols-outlined text-on-surface-variant text-3xl">query_stats</span>
            </div>
            <p className="text-on-surface font-bold text-lg mb-2">אין נתונים עדיין</p>
            <p className="text-on-surface-variant text-sm">תעד עסקאות ביומן כדי לראות סטטיסטיקות</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md flex items-center justify-between px-6 lg:px-12 h-20 border-b border-outline-variant/10">
        <h2 className="text-2xl font-black tracking-tighter text-on-surface">סטטיסטיקות ביצועים</h2>
        <span className="text-xs font-bold text-on-surface-variant">{totalTrades} עסקאות</span>
      </header>

      <div className="p-6 lg:p-12 pb-28 lg:pb-12 max-w-7xl mx-auto space-y-6">

        {/* Section 1: Equity Curve + Win Rate */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Equity Curve */}
          <div className="lg:col-span-8 bg-surface-container-lowest rounded-3xl p-8 shadow-sm border border-outline-variant/10">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-on-surface-variant text-xs font-bold uppercase tracking-widest mb-1">עקומת R מצטברת</h3>
                <div className="text-4xl font-black text-on-surface tracking-tighter">
                  {totalR >= 0 ? "+" : ""}{totalR.toFixed(2)}R
                </div>
                <div className={`flex items-center mt-2 font-bold text-sm ${totalR >= 0 ? "text-primary" : "text-error"}`}>
                  <span
                    className="material-symbols-outlined text-base me-1"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {totalR >= 0 ? "trending_up" : "trending_down"}
                  </span>
                  {totalR >= 0 ? "רווחי" : "הפסדי"} · {totalTrades} עסקאות
                </div>
              </div>
            </div>
            <div className="h-52 w-full relative overflow-hidden rounded-2xl">
              <svg className="w-full h-full" viewBox={`0 0 ${svgW} ${svgH}`} preserveAspectRatio="none">
                <defs>
                  <linearGradient id="eqGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style={{ stopColor: "rgba(251,192,45,0.35)" }} />
                    <stop offset="100%" style={{ stopColor: "rgba(251,192,45,0)" }} />
                  </linearGradient>
                </defs>
                {points.length > 1 && (
                  <>
                    <path d={fillD} fill="url(#eqGrad)" />
                    <path d={pathD} fill="none" stroke="#fbc02d" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="5" fill="#1c1b1b" stroke="#fbc02d" strokeWidth="2.5" />
                  </>
                )}
              </svg>
            </div>
          </div>

          {/* Win Rate Gauge */}
          <div className="lg:col-span-4 bg-primary-container rounded-3xl p-8 flex flex-col justify-between shadow-xl relative overflow-hidden">
            <div className="absolute -top-12 -start-12 w-48 h-48 bg-black/5 rounded-full blur-3xl pointer-events-none" />
            <div>
              <h3 className="text-on-primary-container text-xs font-bold uppercase tracking-widest mb-6">Win Rate</h3>
              <div className="relative w-40 h-40 mx-auto">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="rgba(0,0,0,0.1)" strokeWidth="8" />
                  <circle
                    cx="50" cy="50" r="40"
                    fill="transparent"
                    stroke="#1c1b1b"
                    strokeDasharray={`${winRateDash} ${251 - winRateDash}`}
                    strokeLinecap="round"
                    strokeWidth="8"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-black text-on-primary-container">{winRate}%</span>
                  <span className="text-[10px] font-bold uppercase text-on-primary-container/70">ממוצע</span>
                </div>
              </div>
            </div>
            <div className="space-y-2 mt-4">
              {[["WIN", wins], ["LOSS", losses], ["BE", bes]].map(([label, val]) => (
                <div key={label as string} className="flex justify-between items-center text-sm font-bold text-on-primary-container/80">
                  <span>{label as string}</span>
                  <span>{val as number}</span>
                </div>
              ))}
              <div className="w-full h-1 bg-black/10 rounded-full overflow-hidden mt-1">
                <div className="bg-on-primary-container h-full" style={{ width: `${winRate}%` }} />
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Asset + Killzone */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Asset Distribution */}
          <div className="lg:col-span-5 bg-surface-container-low rounded-3xl p-8 border border-outline-variant/10">
            <h3 className="text-on-surface text-lg font-black tracking-tight mb-6">פיזור נכסים</h3>
            <div className="space-y-4">
              {assetEntries.length === 0 ? (
                <p className="text-on-surface-variant text-sm">אין נתונים</p>
              ) : assetEntries.map(({ asset, pct }) => (
                <div key={asset} className="group">
                  <div className="flex justify-between mb-1.5">
                    <span className="font-bold text-on-surface text-sm">{asset}</span>
                    <span className="text-primary font-black text-sm">{pct}%</span>
                  </div>
                  <div className="w-full h-3 bg-surface-container-highest rounded-full overflow-hidden">
                    <div
                      className="h-full bg-on-surface rounded-full group-hover:bg-primary-container transition-colors duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Killzone Performance */}
          <div className="lg:col-span-7 bg-surface-container-lowest rounded-3xl p-8 shadow-sm border border-outline-variant/10">
            <h3 className="text-on-surface text-lg font-black tracking-tight mb-6">ביצועים לפי Killzone</h3>
            {kzEntries.length === 0 ? (
              <p className="text-on-surface-variant text-sm">אין נתונים</p>
            ) : (
              <div className="flex items-end justify-between gap-3" style={{ height: "200px" }}>
                {kzEntries.map(([kz, data]) => {
                  const heightPct = Math.max(8, Math.round((Math.abs(data.r) / maxKzR) * 100));
                  return (
                    <div key={kz} className="flex-1 flex flex-col items-center group">
                      <div className="text-[10px] font-bold text-on-surface-variant mb-2">
                        {data.r >= 0 ? "+" : ""}{data.r.toFixed(1)}R
                      </div>
                      <div className="w-full flex items-end" style={{ height: "140px" }}>
                        <div
                          className={`w-full rounded-t-xl transition-all duration-500 ${
                            data.r >= 0
                              ? "bg-primary-container group-hover:bg-on-surface"
                              : "bg-error-container"
                          }`}
                          style={{ height: `${heightPct}%` }}
                        />
                      </div>
                      <div className="mt-3 text-[10px] font-black text-on-surface text-center leading-tight">{kz}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Section 3: Setup Table */}
        <section className="bg-surface-container-low rounded-3xl overflow-hidden border border-outline-variant/10">
          <div className="p-6 lg:p-8 border-b border-outline-variant/10 flex justify-between items-center">
            <h3 className="text-on-surface text-lg font-black tracking-tight">יעילות סטאפים</h3>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-on-surface-variant">Profit Factor:</span>
              <span className="font-black text-on-surface">{profitFactor}</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-on-surface-variant text-[10px] uppercase tracking-widest bg-surface-container/50">
                  <th className="px-6 lg:px-8 py-4 text-start font-bold">סטאפ</th>
                  <th className="px-6 lg:px-8 py-4 text-start font-bold">עסקאות</th>
                  <th className="px-6 lg:px-8 py-4 text-start font-bold">Win Rate</th>
                  <th className="px-6 lg:px-8 py-4 text-start font-bold">Total R</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/5">
                {setupEntries.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-8 py-6 text-on-surface-variant text-sm text-center">אין נתונים</td>
                  </tr>
                ) : setupEntries.map(([setup, data]) => {
                  const sr = data.total > 0 ? Math.round((data.wins / data.total) * 100) : 0;
                  return (
                    <tr key={setup} className="hover:bg-surface-container-lowest transition-colors">
                      <td className="px-6 lg:px-8 py-5 font-bold text-on-surface">{setup}</td>
                      <td className="px-6 lg:px-8 py-5 text-on-surface-variant">{data.total}</td>
                      <td className="px-6 lg:px-8 py-5">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          sr >= 60
                            ? "bg-primary-container/20 text-on-primary-container border border-primary-container/40"
                            : "bg-surface-container-high text-on-surface-variant"
                        }`}>
                          {sr}%
                        </span>
                      </td>
                      <td className={`px-6 lg:px-8 py-5 font-black ${data.r >= 0 ? "text-primary" : "text-error"}`}>
                        {data.r >= 0 ? "+" : ""}{data.r.toFixed(2)}R
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
