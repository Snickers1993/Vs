import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const session = await getServerSession(authOptions);
  const userId = session?.user?.email ?? "guest";
  const body = await req.json();
  const updated = await prisma.section.update({
    where: { id },
    data: { title: body.title, content: body.content },
  });
  if (updated.userId !== userId) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  return NextResponse.json(updated);
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const session = await getServerSession(authOptions);
  const userId = session?.user?.email ?? "guest";
  const existing = await prisma.section.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) return NextResponse.json({ error: "not found" }, { status: 404 });
  await prisma.section.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}


