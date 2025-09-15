import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    console.log("[DEBUG] Running manual migration...");
    
    // Add isPublic column
    await prisma.$executeRaw`ALTER TABLE "Section" ADD COLUMN IF NOT EXISTS "isPublic" BOOLEAN NOT NULL DEFAULT false;`;
    console.log("[DEBUG] Added isPublic column");
    
    // Add isStarred column
    await prisma.$executeRaw`ALTER TABLE "Section" ADD COLUMN IF NOT EXISTS "isStarred" BOOLEAN NOT NULL DEFAULT false;`;
    console.log("[DEBUG] Added isStarred column");
    
    // Create indexes
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "Section_isPublic_idx" ON "Section"("isPublic");`;
    console.log("[DEBUG] Created isPublic index");
    
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "Section_isStarred_idx" ON "Section"("isStarred");`;
    console.log("[DEBUG] Created isStarred index");
    
    // Test the updated schema
    const testQuery = await prisma.section.findMany({
      take: 1,
      select: {
        id: true,
        isPublic: true,
        isStarred: true
      }
    });
    
    console.log("[DEBUG] Migration successful, test query result:", testQuery);
    
    return NextResponse.json({ 
      success: true, 
      message: "Migration completed successfully",
      testQuery
    });
  } catch (error) {
    console.error("[DEBUG] Migration failed:", error);
    
    return NextResponse.json({ 
      success: false, 
      message: "Migration failed",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
