import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";

export async function POST(req: Request) {
  try {
    const { url, productId } = await req.json();

    if (!url || !productId) {
      return NextResponse.json({ error: "لینک یا شناسه محصول خالی است" }, { status: 400 });
    }

    // 1. دانلود عکس
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      return NextResponse.json({ error: `دانلود عکس ناموفق بود. کد خطا: ${response.status}` }, { status: 400 });
    }
    
    // 2. بررسی نوع فایل
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.startsWith("image/")) {
      return NextResponse.json({ error: `فایل معتبر نیست. نوع فایل: ${contentType}` }, { status: 400 });
    }

    // 3. ذخیره در دیتابیس با productId واقعی
    await prisma.mediaCandidate.create({
      data: {
        sourceUrl: url,
        previewUrl: url,
        status: "PENDING",
        source: "MANUAL_UPLOAD",
        productId: productId, // 👈 از productId واقعی استفاده می‌کنیم
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "خطای دیتابیس" }, { status: 500 });
  }
}
