import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function Row({ label, value }: { label: string; value?: string | number | boolean | null }) {
  if (value === null || value === undefined || value === "") return null;
  const display = typeof value === "boolean" ? (value ? "כן" : "לא") : String(value);
  return (
    <div className="flex items-start justify-between py-3 border-b border-zinc-800 last:border-0">
      <span className="text-zinc-400 text-sm">{label}</span>
      <span className="text-white text-sm font-medium text-left max-w-[55%] break-words">{display}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-4">
      <h2 className="text-yellow-500 text-xs font-bold uppercase tracking-widest mb-2">{title}</h2>
      {children}
    </div>
  );
}

export default async function ModelPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!profile?.hasPersonalModel) {
    return (
      <div className="px-4 pt-6 max-w-lg mx-auto">
        <h1 className="text-xl font-bold text-white mb-6">המודל שלי</h1>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
          <p className="text-4xl mb-4">📊</p>
          <p className="text-white font-semibold mb-2">המודל האישי עוד לא נבנה</p>
          <p className="text-zinc-400 text-sm leading-relaxed">
            המנטור שלך יבנה את המודל האישי בשיעור 2 בשיתוף מסך.
            עד אז אתה עובד עם המודל הבסיסי לפי השוק שלך.
          </p>
        </div>
      </div>
    );
  }

  const marketLabel = profile.market === "FOREX" ? "פורקס" : "חוזים עתידיים";
  const processLabel = profile.process === "ERL_IRL" ? "ERL→IRL" : profile.process;

  return (
    <div className="px-4 pt-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-white">המודל שלי</h1>
        <span className="text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-800 px-2.5 py-1 rounded-lg font-medium">
          מודל אישי
        </span>
      </div>

      <Section title="בסיס">
        <Row label="שוק" value={marketLabel} />
        <Row label="תהליך" value={processLabel} />
        <Row label="SMT" value={profile.smt} />
        <Row label="Pd-Array" value={profile.pdArray} />
      </Section>

      <Section title="זמנים">
        <Row label="ימי מסחר" value={profile.tradingDays?.join(", ")} />
        <Row label="שעות מסחר" value={profile.tradingHours} />
        <Row label="טיים פריים" value={profile.preferredTF} />
      </Section>

      <Section title="ניהול סיכון">
        <Row label="רמת סיכון ראשון" value={profile.riskLevel1 ? `${profile.riskLevel1}%` : null} />
        <Row label="רמת סיכון שלב הבא" value={profile.riskLevel2 ? `${profile.riskLevel2}%` : null} />
        <Row label="עסקאות ביום" value={profile.tradesPerDay} />
      </Section>

      {(profile.barriers || profile.biggestFear) && (
        <Section title="מנטל">
          <Row label="מה מונע" value={profile.barriers} />
          <Row label="הפחד הגדול" value={profile.biggestFear} />
          <Row label="תגובה לגבול" value={profile.limitReaction} />
        </Section>
      )}
    </div>
  );
}
