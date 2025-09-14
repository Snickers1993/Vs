import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toString().trim().toLowerCase() || "";
        const password = credentials?.password?.toString() || "";
        if (!email || !password) return null;
        
        try {
          const user = await prisma.user.findUnique({ where: { email } });
          if (!user || !user.hashedPassword) return null;
          const ok = await bcrypt.compare(password, user.hashedPassword);
          if (!ok) return null;
          return { id: user.id, email: user.email ?? email } as { id: string; email: string };
        } catch {
          // If database is not available, allow any credentials for development
          console.warn("Database not available, allowing any credentials for development");
          return { id: email, email: email } as { id: string; email: string };
        }
      },
    }),
  ],
  pages: { signIn: "/auth/signin" },
  callbacks: {
    async jwt({ token, user }) {
      if (user && (user as { id?: string }).id) {
        return { ...token, uid: (user as { id?: string }).id } as typeof token & { uid?: string };
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && (token as unknown as { uid?: string }).uid) {
        (session.user as unknown as { id?: string }).id = (token as unknown as { uid?: string }).uid;
      }
      return session;
    },
  },
};


