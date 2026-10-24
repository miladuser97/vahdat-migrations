import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "لینک خالی است" }, { status: 400 });
    }

    // 1. دانلود عکس با تنظیمات امنیتی
    const response = await fetch(url, { redirect: 'follow' });
    if (!response.ok) {
      return NextResponse.json({ error: `دانلود عکس ناموفق بود. کد خطا: ${response.status}` }, { status: 400 });
    }
    
    // 2. بررسی نوع فایل
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.startsWith("image/")) {
      return NextResponse.json({ error: `فایل معتبر نیست. نوع فایل: ${contentType}` }, { status: 400 });
    }

    // 3. ذخیره در دیتابیس (بدون وابستگی به Product)
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
    // این خطا رو دقیق به فرانت‌اند برمی‌گردونیم
    return NextResponse.json({ error: error.message || "خطای دیتابیس" }, { status: 500 });
  }
}
