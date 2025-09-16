import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type SessionUserInfo = {
  session: Session | null;
  email: string | null;
  userId: string | null;
};

export async function getSessionUserInfo(): Promise<SessionUserInfo> {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase() ?? null;
  if (!session || !email) {
    return { session, email, userId: null };
  }

  const sessionUser = session.user as { id?: string | null };
  if (sessionUser?.id) {
    return { session, email, userId: sessionUser.id };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  return { session, email, userId: user?.id ?? null };
}
