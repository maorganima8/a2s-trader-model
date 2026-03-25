import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    // Fireberry sends params as query string
    const { searchParams } = new URL(req.url);
    const name = searchParams.get("name");
    const email = searchParams.get("email");
    const phone = searchParams.get("phone");

    if (!name || !email) {
      return NextResponse.json({ error: "Missing name or email" }, { status: 400 });
    }

    // Idempotent — skip if student already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ message: "User already exists" }, { status: 200 });
    }

    // Generate a temporary password — student will set their own via the invite link
    const tempPassword = crypto.randomBytes(16).toString("hex");
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    const now = new Date();
    const accessExpiresAt = new Date(now);
    accessExpiresAt.setDate(accessExpiresAt.getDate() + 180);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone: phone ?? undefined,
        role: "STUDENT",
        password: hashedPassword,
        joinedAt: now,
        accessExpiresAt,
        studentProfile: {
          create: {},
        },
      },
    });

    // TODO: Send WhatsApp invite via Green API
    // TODO: Send email invite via Resend
    // Both will include a setup link: /setup?token=...

    console.log(`[Fireberry] New student created: ${user.email}`);

    return NextResponse.json({ success: true, userId: user.id }, { status: 201 });
  } catch (err) {
    console.error("[Fireberry webhook error]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
