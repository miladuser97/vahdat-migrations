import { NextResponse } from "next/server";

/**
 * Liveness Check API
 * 
 * Simply verifies the process is running.
 */
export async function GET() {
  return NextResponse.json({
    status: "alive",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
}
