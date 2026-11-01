import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";

export async function POST(req: Request) {
  try {
    const { isSalesEnabled } = await req.json();

    if (typeof isSalesEnabled !== "boolean") {
      return NextResponse.json({ error: "مقدار نامعتبر است" }, { status: 400 });
    }

    await prisma.siteSetting.upsert({
      where: { key: "site_sales_enabled" },
      update: { value: isSalesEnabled },
      create: { key: "site_sales_enabled", value: isSalesEnabled },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "خطا" }, { status: 500 });
  }
}
