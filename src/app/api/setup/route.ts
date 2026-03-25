import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const { token, password } = await req.json();

  if (!token || !password || password.length < 6) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Token is the user's ID (signed invite link — in production use JWT)
  const user = await prisma.user.findUnique({ where: { id: token } });

  if (!user) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  const hashed = await bcrypt.hash(password, 12);

  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashed, emailVerified: new Date() },
  });

  return NextResponse.json({ success: true });
}
