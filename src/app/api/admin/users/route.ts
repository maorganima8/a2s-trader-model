import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role === "STUDENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, email, phone, market } = await req.json();

  if (!name || !email) {
    return NextResponse.json({ error: "שם ומייל הם שדות חובה" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "משתמש עם מייל זה כבר קיים" }, { status: 409 });
  }

  const tempPassword = crypto.randomBytes(16).toString("hex");
  const hashedPassword = await bcrypt.hash(tempPassword, 12);

  const now = new Date();
  const accessExpiresAt = new Date(now);
  accessExpiresAt.setDate(accessExpiresAt.getDate() + 180);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      phone: phone || undefined,
      role: "STUDENT",
      password: hashedPassword,
      joinedAt: now,
      accessExpiresAt,
      market: market || "FOREX",
      studentProfile: { create: {} },
    },
  });

  // TODO: Send WhatsApp invite via Green API
  // TODO: Send email invite via Resend
  // Invite link: /setup?token=${user.id}

  return NextResponse.json({ user }, { status: 201 });
}
