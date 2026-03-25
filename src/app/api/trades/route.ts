import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const trades = await prisma.trade.findMany({
    where: { userId: session.user.id },
    orderBy: { entryTime: "desc" },
  });

  return NextResponse.json({ trades });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const {
    type, entryTime, exitTime, asset, killzone,
    tradingViewUrl, process, setupType, entryTF,
    result, rr, notes,
    rating, proudScore, whatWasGood,
    mistake,
  } = body;

  if (!type || !entryTime || !asset || !result) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const entry = new Date(entryTime);
  const exit = exitTime ? new Date(exitTime) : null;
  const duration = exit ? Math.round((exit.getTime() - entry.getTime()) / 60000) : null;

  const weekdays = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
  const weekday = weekdays[entry.getDay()];

  const trade = await prisma.trade.create({
    data: {
      userId: session.user.id,
      type,
      entryTime: entry,
      exitTime: exit ?? undefined,
      duration,
      asset,
      killzone: killzone || undefined,
      tradingViewUrl: tradingViewUrl || undefined,
      weekday,
      process: process || undefined,
      setupType: setupType || undefined,
      entryTF: entryTF || undefined,
      result,
      rr: rr ? parseFloat(rr) : undefined,
      notes: notes || undefined,
      rating: result === "WIN" && rating ? parseInt(rating) : undefined,
      proudScore: result === "WIN" && proudScore ? parseInt(proudScore) : undefined,
      whatWasGood: result === "WIN" ? whatWasGood || undefined : undefined,
      mistake: result === "LOSS" ? mistake || undefined : undefined,
    },
  });

  // Auto-create mistake entry if LOSS
  if (result === "LOSS" && mistake) {
    await prisma.mistake.create({
      data: {
        userId: session.user.id,
        description: mistake,
        tradeId: trade.id,
        isManual: false,
      },
    });
  }

  return NextResponse.json({ trade }, { status: 201 });
}
