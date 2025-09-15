import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.email?.toLowerCase() ?? "guest";
    
    console.log(`[DEBUG] Test sections - userId: ${userId}, session: ${!!session}`);
    
    // Test the exact query from sections API
    const where: { userId: string; collection?: string } = { userId };
    const sections = await prisma.section.findMany({ 
      where, 
      orderBy: { updatedAt: "desc" } 
    });
    
    console.log(`[DEBUG] Test sections - found ${sections.length} sections`);
    
    return NextResponse.json({ 
      success: true, 
      message: "Sections query successful",
      userId,
      sectionCount: sections.length,
      sections: sections.map(s => ({ id: s.id, title: s.title, collection: s.collection }))
    });
  } catch (error) {
    console.error("[DEBUG] Test sections failed:", error);
    
    return NextResponse.json({ 
      success: false, 
      message: "Sections query failed",
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 503 });
  }
}
