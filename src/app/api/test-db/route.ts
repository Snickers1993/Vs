import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Test database connection
    await prisma.$connect();
    
    // Test a simple query
    const userCount = await prisma.user.count();
    
    console.log(`[DEBUG] Database test successful - ${userCount} users found`);
    
    return NextResponse.json({ 
      success: true, 
      message: "Database connection successful",
      userCount 
    });
  } catch (error) {
    console.error("[DEBUG] Database test failed:", error);
    
    return NextResponse.json({ 
      success: false, 
      message: "Database connection failed",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 503 });
  } finally {
    await prisma.$disconnect();
  }
}
