import { NextAuthOptions, User } from "next-auth";
import { JWT } from "next-auth/jwt";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) return null;

        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) return null;

        // Check access expiry for students
        if (user.role === "STUDENT" && user.accessExpiresAt) {
          if (new Date() > user.accessExpiresAt) return null;
        }

        return { id: user.id, email: user.email, name: user.name, role: user.role } as User & { role: Role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as User & { role: Role }).role;
        token.id = user.id as string;
      }
      return token as JWT & { role: Role; id: string };
    },
    async session({ session, token }) {
      const t = token as JWT & { role: Role; id: string };
      if (session.user) {
        session.user.role = t.role;
        session.user.id = t.id;
      }
      return session;
    },
  },
};
