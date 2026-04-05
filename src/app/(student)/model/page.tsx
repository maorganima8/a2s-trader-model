import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function Row({ label, value }: { label: string; value?: string | number | boolean | null }) {
  if (value === null || value === undefined || value === "") return null;
  const display = typeof value === "boolean" ? (value ? "כן" : "לא") : String(value);
  return (
    <div className="flex items-start justify-between py-3 border-b border-outline-variant/10 last:border-0">
      <span className="text-on-surface-variant text-sm">{label}</span>
      <span className="text-on-surface text-sm font-semibold text-left max-w-[55%] break-words">{display}</span>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-2xl p-6 mb-4">
      <div className="flex items-center gap-2 mb-4">
        <span
          className="material-symbols-outlined text-primary text-base"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          {icon}
        </span>
        <h2 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">{title}</h2>
      </div>
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
      <div className="min-h-screen bg-surface">
        <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md flex items-center px-6 lg:px-12 h-20 border-b border-outline-variant/10">
          <h2 className="text-2xl font-black tracking-tighter text-on-surface">המודל שלי</h2>
        </header>
        <div className="p-6 lg:p-12 max-w-2xl">
          <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-3xl p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center mx-auto mb-5">
              <span className="material-symbols-outlined text-on-surface-variant text-3xl">psychology</span>
            </div>
            <p className="text-on-surface font-bold text-lg mb-2">המודל האישי עוד לא נבנה</p>
            <p className="text-on-surface-variant text-sm leading-relaxed max-w-xs mx-auto">
              המנטור שלך יבנה את המודל האישי בשיעור 2 בשיתוף מסך.
              עד אז אתה עובד עם המודל הבסיסי לפי השוק שלך.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const marketLabel = profile.market === "FOREX" ? "פורקס" : "חוזים עתידיים";
  const processLabel = profile.process === "ERL_IRL" ? "ERL→IRL" : profile.process;

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md flex items-center justify-between px-6 lg:px-12 h-20 border-b border-outline-variant/10">
        <h2 className="text-2xl font-black tracking-tighter text-on-surface">המודל שלי</h2>
        <span className="px-4 py-1.5 bg-primary-container text-on-primary-container text-xs font-bold uppercase tracking-widest rounded-full">
          מודל אישי
        </span>
      </header>

      <div className="p-6 lg:p-12 max-w-2xl">
        <Section title="בסיס" icon="foundation">
          <Row label="שוק" value={marketLabel} />
          <Row label="תהליך" value={processLabel} />
          <Row label="SMT" value={profile.smt} />
          <Row label="Pd-Array" value={profile.pdArray} />
        </Section>

        <Section title="זמנים" icon="schedule">
          <Row label="ימי מסחר" value={profile.tradingDays?.join(", ")} />
          <Row label="שעות מסחר" value={profile.tradingHours} />
          <Row label="טיים פריים" value={profile.preferredTF} />
        </Section>

        <Section title="ניהול סיכון" icon="shield">
          <Row label="רמת סיכון ראשון" value={profile.riskLevel1 ? `${profile.riskLevel1}%` : null} />
          <Row label="רמת סיכון שלב הבא" value={profile.riskLevel2 ? `${profile.riskLevel2}%` : null} />
          <Row label="עסקאות ביום" value={profile.tradesPerDay} />
        </Section>

        {(profile.barriers || profile.biggestFear) && (
          <Section title="מנטל" icon="psychology">
            <Row label="מה מונע" value={profile.barriers} />
            <Row label="הפחד הגדול" value={profile.biggestFear} />
            <Row label="תגובה לגבול" value={profile.limitReaction} />
          </Section>
        )}
      </div>
    </div>
  );
}
