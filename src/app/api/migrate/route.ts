import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function runMigration() {
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
    
    return { 
      success: true, 
      message: "Migration completed successfully",
      testQuery
    };
  } catch (error) {
    console.error("[DEBUG] Migration failed:", error);
    
    return { 
      success: false, 
      message: "Migration failed",
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

export async function GET() {
  const result = await runMigration();
  return NextResponse.json(result, { status: result.success ? 200 : 500 });
}

export async function POST() {
  const result = await runMigration();
  return NextResponse.json(result, { status: result.success ? 200 : 500 });
}
