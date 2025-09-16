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

    console.log(
      `[DEBUG] API POST - userId: ${sessionInfo.userId}, email: ${sessionInfo.email}, collection: ${body.collection}, title: ${body.title}`
    );

    const created = await prisma.section.create({
      data: {
        userId: sessionInfo.userId,
        collection: body.collection,
        title: body.title ?? "Untitled",
        content: body.content ?? "",
        isPublic: body.isPublic ?? false,
        isStarred: body.isStarred ?? false,
      },
    });
    console.log(`[DEBUG] API POST - created section: ${created.id} for user ${sessionInfo.userId}`);
    return NextResponse.json(created);
  } catch (error) {
    console.warn("Database not available, returning error:", error);
    return NextResponse.json({ error: "Database not available" }, { status: 503 });
  }
}
