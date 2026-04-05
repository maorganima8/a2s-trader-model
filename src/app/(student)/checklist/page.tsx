import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CHECKLIST_STEPS } from "@/lib/checklist-steps";
import ChecklistClient from "./ChecklistClient";

export default async function ChecklistPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const checklist = await prisma.checklistEntry.findUnique({
    where: { userId_date: { userId: session.user.id, date: today } },
  });

  const initialSteps = {
    step1: checklist?.step1 ?? false,
    step2: checklist?.step2 ?? false,
    step3: checklist?.step3 ?? false,
    step4: checklist?.step4 ?? false,
    step5: checklist?.step5 ?? false,
    step6: checklist?.step6 ?? false,
  };

  const doneCount = Object.values(initialSteps).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md flex items-center justify-between px-6 lg:px-12 h-20 border-b border-outline-variant/10">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-0.5">
            {new Date().toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <h2 className="text-2xl font-black tracking-tighter text-on-surface">צ&apos;קליסט יומי</h2>
        </div>
        <span className={`px-4 py-1.5 rounded-full text-sm font-bold ${doneCount === 6 ? "bg-primary-container text-on-primary-container" : "bg-surface-container text-on-surface-variant"}`}>
          {doneCount}/6
        </span>
      </header>

      <div className="p-6 lg:p-12 max-w-2xl">
        <ChecklistClient steps={CHECKLIST_STEPS} initialSteps={initialSteps} />
      </div>
    </div>
  );
}
