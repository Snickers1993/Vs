import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { NextRequest } from "next/server";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor") ?? undefined;
  const rawLimit = parseInt(searchParams.get("limit") ?? "", 10);
  const limit = Math.min(Number.isFinite(rawLimit) && rawLimit > 0 ? rawLimit : DEFAULT_LIMIT, MAX_LIMIT);

  try {
    const sharedSections = await prisma.section.findMany({
      where: { isPublic: true, deletedAt: null },
      orderBy: { updatedAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true,
        title: true,
        content: true,
        collection: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const hasMore = sharedSections.length > limit;
    const results = hasMore ? sharedSections.slice(0, limit) : sharedSections;
    const nextCursor = hasMore ? results[results.length - 1].id : undefined;

    return NextResponse.json({ items: results, nextCursor });
  } catch {
    console.warn("Database not available, returning empty shared sections");
    return NextResponse.json({ items: [], nextCursor: undefined });
  }
}
