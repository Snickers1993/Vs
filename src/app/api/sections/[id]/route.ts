import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession();
  const userId = session?.user?.email ?? "guest";
  const body = await req.json();
  const updated = await prisma.section.update({
    where: { id: params.id },
    data: { title: body.title, content: body.content },
  });
  if (updated.userId !== userId) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  return NextResponse.json(updated);
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession();
  const userId = session?.user?.email ?? "guest";
  const existing = await prisma.section.findUnique({ where: { id: params.id } });
  if (!existing || existing.userId !== userId) return NextResponse.json({ error: "not found" }, { status: 404 });
  await prisma.section.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}


