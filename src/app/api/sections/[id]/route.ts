import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserInfo } from "@/lib/session";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const body = await req.json();
    const sessionInfo = await getSessionUserInfo();
    if (!sessionInfo.session || !sessionInfo.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.section.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
    if (existing.userId !== sessionInfo.userId) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const data: { title?: string; content?: string; isPublic?: boolean; isStarred?: boolean } = {};
    if (typeof body.title === "string") {
      if (body.title.length > 500) {
        return NextResponse.json({ error: "Title must be 500 characters or fewer" }, { status: 400 });
      }
      data.title = body.title;
    }
    if (typeof body.content === "string") {
      if (body.content.length > 100_000) {
        return NextResponse.json({ error: "Content must be 100KB or fewer" }, { status: 400 });
      }
      data.content = body.content;
    }
    if (typeof body.isPublic === "boolean") data.isPublic = body.isPublic;
    if (typeof body.isStarred === "boolean") data.isStarred = body.isStarred;

    const updated = await prisma.section.update({
      where: { id },
      data,
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.warn("Database not available, returning error:", error);
    return NextResponse.json({ error: "Database not available" }, { status: 503 });
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const sessionInfo = await getSessionUserInfo();
    if (!sessionInfo.session || !sessionInfo.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.section.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
    if (existing.userId !== sessionInfo.userId) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    await prisma.section.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.warn("Database not available, returning error:", error);
    return NextResponse.json({ error: "Database not available" }, { status: 503 });
  }
}
