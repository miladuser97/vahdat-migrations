import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";

export async function GET() {
  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: "site_sales_enabled" },
    });

    return NextResponse.json({
      isSalesEnabled: setting ? Boolean(setting.value) : true,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "خطا" }, { status: 500 });
  }
}
