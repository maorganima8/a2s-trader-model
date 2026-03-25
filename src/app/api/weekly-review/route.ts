import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const weekStart = req.nextUrl.searchParams.get("weekStart");
  if (!weekStart) return NextResponse.json({ error: "Missing weekStart" }, { status: 400 });

  const review = await prisma.weeklyReview.findUnique({
    where: { userId_weekStart: { userId: session.user.id, weekStart: new Date(weekStart) } },
  });

  return NextResponse.json({ review });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { weekStart, content } = await req.json();

  const review = await prisma.weeklyReview.upsert({
    where: { userId_weekStart: { userId: session.user.id, weekStart: new Date(weekStart) } },
    create: {
      userId: session.user.id,
      weekStart: new Date(weekStart),
      content,
      submittedAt: new Date(),
    },
    update: {
      content,
      submittedAt: new Date(),
    },
  });

  return NextResponse.json({ review });
}
