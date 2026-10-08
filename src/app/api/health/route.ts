import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";

/**
 * Health Check API
 * 
 * ✅ اصلاح شده: اطلاعات حداقلی برای عموم
 * اطلاعات کامل فقط در Logger ثبت میشه
 */
export async function GET() {
  try {
    // 1. چک کردن اتصال به دیتابیس
    await prisma.$executeRawUnsafe("SELECT 1");
    
    // ============================================================
    // ✅ اطلاعات حداقلی برای عموم
    // ============================================================
    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // خطا رو فقط در Logger ثبت کن
    console.error("Health Check Failed:", error);
    
    return NextResponse.json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
    }, { status: 503 });
  }
}