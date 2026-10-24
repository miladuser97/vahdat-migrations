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
    if (!response.ok) throw new Error("دانلود عکس ناموفق بود");
    
    // 2. بررسی حجم و نوع فایل (امنیت)
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.startsWith("image/")) {
      return NextResponse.json({ error: "فایل معتبر نیست" }, { status: 400 });
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    if (buffer.length > 5 * 1024 * 1024) { // حداکثر 5MB
      return NextResponse.json({ error: "حجم فایل بیش از حد مجاز است" }, { status: 400 });
    }

    // 3. ذخیره در دیتابیس (به صورت Base64 یا آپلود به Storage)
    // فعلاً برای سادگی، آدرس رو ذخیره می‌کنیم
    await prisma.productMedia.create({
      data: {
        productId,
        url: url, // آدرس عکس
        status: "APPROVED",
        isPrimary: false,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "خطا" }, { status: 500 });
  }
}
