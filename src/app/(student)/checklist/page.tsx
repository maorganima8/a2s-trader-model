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

  return (
    <div className="px-4 pt-6 max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white">צ'קליסט יומי</h1>
        <p className="text-zinc-500 text-sm mt-0.5">
          {new Date().toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>
      <ChecklistClient steps={CHECKLIST_STEPS} initialSteps={initialSteps} />
    </div>
  );
}
