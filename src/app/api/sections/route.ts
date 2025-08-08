import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const session = await getServerSession();
  const userId = session?.user?.email ?? "guest";
  const { searchParams } = new URL(req.url);
  const collection = searchParams.get("collection") ?? undefined;
  const where: any = { userId };
  if (collection) where.collection = collection;
  const sections = await prisma.section.findMany({ where, orderBy: { updatedAt: "desc" } });
  return NextResponse.json(sections);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  const userId = session?.user?.email ?? "guest";
  const body = await req.json();
  const created = await prisma.section.create({
    data: {
      userId,
      collection: body.collection,
      title: body.title ?? "Untitled",
      content: body.content ?? "",
    },
  });
  return NextResponse.json(created);
}


