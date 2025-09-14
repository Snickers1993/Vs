import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.email ?? "guest";
  const { searchParams } = new URL(req.url);
  const collection = searchParams.get("collection") ?? undefined;
  
  try {
    const where: { userId: string; collection?: string } = { userId };
    if (collection) where.collection = collection;
    const sections = await prisma.section.findMany({ where, orderBy: { updatedAt: "desc" } });
    return NextResponse.json(sections);
  } catch (error) {
    // If database is not available, return error status
    console.warn("Database not available, returning error");
    return NextResponse.json({ error: "Database not available" }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.email ?? "guest";
  const body = await req.json();
  
  try {
    const created = await prisma.section.create({
      data: {
        userId,
        collection: body.collection,
        title: body.title ?? "Untitled",
        content: body.content ?? "",
      },
    });
    return NextResponse.json(created);
  } catch (error) {
    // If database is not available, return error status
    console.warn("Database not available, returning error");
    return NextResponse.json({ error: "Database not available" }, { status: 503 });
  }
}


