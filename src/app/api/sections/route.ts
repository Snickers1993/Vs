import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { NextRequest } from "next/server";
import { getSessionUserInfo } from "@/lib/session";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const collection = searchParams.get("collection") ?? undefined;

  try {
    const sessionInfo = await getSessionUserInfo();
    if (!sessionInfo.session || !sessionInfo.userId) {
      return NextResponse.json([]);
    }

    const where: { userId: string; collection?: string; deletedAt: null } = { userId: sessionInfo.userId, deletedAt: null };
    if (collection) where.collection = collection;
    const sections = await prisma.section.findMany({ where, orderBy: { updatedAt: "desc" } });
    return NextResponse.json(sections);
  } catch (error) {
    console.warn("Database not available, returning error:", error);
    return NextResponse.json({ error: "Database not available" }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const sessionInfo = await getSessionUserInfo();

    if (!sessionInfo.session || !sessionInfo.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!body?.collection || typeof body.collection !== "string") {
      return NextResponse.json({ error: "Collection is required" }, { status: 400 });
    }

    const rawTitle = typeof body.title === "string" ? body.title : "Untitled";
    const rawContent = typeof body.content === "string" ? body.content : "";

    if (rawTitle.length > 500) {
      return NextResponse.json({ error: "Title must be 500 characters or fewer" }, { status: 400 });
    }
    if (rawContent.length > 100_000) {
      return NextResponse.json({ error: "Content must be 100KB or fewer" }, { status: 400 });
    }

    const payload: {
      id?: string;
      userId: string;
      collection: string;
      title: string;
      content: string;
      isPublic: boolean;
      isStarred: boolean;
    } = {
      userId: sessionInfo.userId,
      collection: body.collection,
      title: rawTitle,
      content: rawContent,
      isPublic: typeof body.isPublic === "boolean" ? body.isPublic : false,
      isStarred: typeof body.isStarred === "boolean" ? body.isStarred : false,
    };

    if (typeof body.id === "string" && body.id.trim().length > 0) {
      payload.id = body.id.trim();
      const existing = await prisma.section.findUnique({ where: { id: payload.id } });
      if (existing) {
        if (existing.userId !== sessionInfo.userId) {
          return NextResponse.json({ error: "forbidden" }, { status: 403 });
        }
        return NextResponse.json(existing);
      }
    }

    const created = await prisma.section.create({
      data: payload,
    });
    return NextResponse.json(created);
  } catch (error) {
    console.warn("Database not available, returning error:", error);
    return NextResponse.json({ error: "Database not available" }, { status: 503 });
  }
}
