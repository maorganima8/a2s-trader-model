import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const STEPS = ["step1", "step2", "step3", "step4", "step5", "step6"] as const;

// GET today's checklist
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const checklist = await prisma.checklistEntry.findUnique({
    where: { userId_date: { userId: session.user.id, date: today } },
  });

  return NextResponse.json({ checklist });
}

// PATCH — toggle a step
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { step, value } = await req.json() as { step: typeof STEPS[number]; value: boolean };

  if (!STEPS.includes(step)) {
    return NextResponse.json({ error: "Invalid step" }, { status: 400 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const checklist = await prisma.checklistEntry.upsert({
    where: { userId_date: { userId: session.user.id, date: today } },
    create: { userId: session.user.id, date: today, [step]: value },
    update: { [step]: value },
  });

  // Auto-set completedAt when all steps done
  const allDone = STEPS.every((s) => (s === step ? value : checklist[s]));
  if (allDone && !checklist.completedAt) {
    await prisma.checklistEntry.update({
      where: { id: checklist.id },
      data: { completedAt: new Date() },
    });
  }

  return NextResponse.json({ checklist });
}
