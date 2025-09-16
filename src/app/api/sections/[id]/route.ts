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

    console.log(
      `[DEBUG] API PATCH - userId: ${sessionInfo.userId}, email: ${sessionInfo.email}, id: ${id}`
    );

    const data: { title?: string; content?: string; isPublic?: boolean; isStarred?: boolean } = {};
    if (typeof body.title === "string") data.title = body.title;
    if (typeof body.content === "string") data.content = body.content;
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

    console.log(
      `[DEBUG] API DELETE - userId: ${sessionInfo.userId}, email: ${sessionInfo.email}, id: ${id}`
    );

    await prisma.section.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.warn("Database not available, returning error:", error);
    return NextResponse.json({ error: "Database not available" }, { status: 503 });
  }
}
