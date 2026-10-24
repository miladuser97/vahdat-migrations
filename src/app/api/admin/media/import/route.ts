import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";

export async function POST(req: Request) {
  try {
    const { productId, url } = await req.json();

    if (!productId || !url) {
      return NextResponse.json({ error: "اطلاعات ناقص است" }, { status: 400 });
    }

    // 1. دانلود عکس
    const response = await fetch(url);
    if (!response.ok) throw new Error(`دانلود عکس ناموفق بود (کد ${response.status})`);
    
    // 2. بررسی نوع فایل (امنیت)
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.startsWith("image/")) {
      return NextResponse.json({ error: "فایل معتبر نیست" }, { status: 400 });
    }

    // 3. ذخیره در دیتابیس
    await prisma.productMedia.create({
      data: {
        productId: productId === "test" ? "test" : productId, // موقت برای تست
        url: url,
        status: "APPROVED",
        isPrimary: false,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Import Error:", error);
    return NextResponse.json({ error: error.message || "خطا" }, { status: 500 });
  }
}
