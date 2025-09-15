import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    console.log("[DEBUG] Testing Prisma schema...");
    
    // Test if we can access the Section model
    const sectionCount = await prisma.section.count();
    console.log(`[DEBUG] Section count: ${sectionCount}`);
    
    // Test if we can access the User model
    const userCount = await prisma.user.count();
    console.log(`[DEBUG] User count: ${userCount}`);
    
    // Test the exact query structure
    const testQuery = await prisma.section.findMany({
      take: 1,
      select: {
        id: true,
        userId: true,
        collection: true,
        title: true,
        content: true,
        isPublic: true,
        isStarred: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    console.log(`[DEBUG] Test query result:`, testQuery);
    
    return NextResponse.json({ 
      success: true, 
      message: "Schema test successful",
      sectionCount,
      userCount,
      testQuery
    });
  } catch (error) {
    console.error("[DEBUG] Schema test failed:", error);
    
    return NextResponse.json({ 
      success: false, 
      message: "Schema test failed",
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 503 });
  }
}
