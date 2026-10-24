import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "لینک خالی است" }, { status: 400 });
    }

    // 1. دانلود عکس
    const response = await fetch(url);
    if (!response.ok) throw new Error(`دانلود عکس ناموفق بود (کد ${response.status})`);
    
    // 2. بررسی نوع فایل (امنیت)
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.startsWith("image/")) {
      return NextResponse.json({ error: "فایل معتبر نیست" }, { status: 400 });
    }

    // 3. ذخیره در دیتابیس (جدول MediaCandidate)
    await prisma.mediaCandidate.create({
      data: {
        sourceUrl: url,
        previewUrl: url,
        status: "PENDING",
        source: "MANUAL",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Import Error:", error);
    return NextResponse.json({ error: error.message || "خطا" }, { status: 500 });
  }
}
