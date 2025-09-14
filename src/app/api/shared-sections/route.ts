import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    // Get all sections that are marked as public
    const sharedSections = await prisma.section.findMany({
      where: { isPublic: true },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        content: true,
        collection: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            email: true
          }
        }
      }
    });
    
    return NextResponse.json(sharedSections);
  } catch (error) {
    console.warn("Database not available, returning empty shared sections");
    return NextResponse.json([]);
  }
}
