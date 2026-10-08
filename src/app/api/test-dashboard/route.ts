import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/server/auth-utils";

export async function GET() {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json({
        step: "getAuthenticatedUser",
        status: "❌ user is null",
      });
    }

    // ✅ بررسی نقش کاربر
    const isAdminCheck = user.role === "admin" || user.role === "super_admin";

    return NextResponse.json({
      step: "getAuthenticatedUser",
      status: "✅ ok",
      user: {
        id: user.id,
        role: user.role,
        mobileNumber: user.mobileNumber,
        firstName: user.firstName,
      },
      isAdminCheck,
    });
  } catch (error) {
    return NextResponse.json({
      step: "error",
      status: "❌ failed",
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
  }
}