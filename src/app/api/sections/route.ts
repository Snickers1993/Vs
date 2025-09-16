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
      console.log(
        `[DEBUG] API GET - unauthenticated request, returning empty result (collection: ${collection ?? "all"})`
      );
      return NextResponse.json([]);
    }

    console.log(
      `[DEBUG] API GET - userId: ${sessionInfo.userId}, email: ${sessionInfo.email}, collection: ${collection ?? "all"}`
    );

    const where: { userId: string; collection?: string } = { userId: sessionInfo.userId };
    if (collection) where.collection = collection;
    const sections = await prisma.section.findMany({ where, orderBy: { updatedAt: "desc" } });
    console.log(`[DEBUG] API GET - found ${sections.length} sections for user ${sessionInfo.userId}`);
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
      console.log("[DEBUG] API POST - unauthorized request");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!body?.collection || typeof body.collection !== "string") {
      return NextResponse.json({ error: "Collection is required" }, { status: 400 });
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
      title: typeof body.title === "string" ? body.title : "Untitled",
      content: typeof body.content === "string" ? body.content : "",
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
        console.log(
          `[DEBUG] API POST - section already exists for user ${sessionInfo.userId}, returning existing record ${existing.id}`
        );
        return NextResponse.json(existing);
      }
    }

    console.log(
      `[DEBUG] API POST - userId: ${sessionInfo.userId}, email: ${sessionInfo.email}, collection: ${payload.collection}, title: ${payload.title}, id: ${payload.id ?? "auto"}`
    );

    const created = await prisma.section.create({
      data: payload,
    });
    console.log(`[DEBUG] API POST - created section: ${created.id} for user ${sessionInfo.userId}`);
    return NextResponse.json(created);
  } catch (error) {
    console.warn("Database not available, returning error:", error);
    return NextResponse.json({ error: "Database not available" }, { status: 503 });
  }
}
