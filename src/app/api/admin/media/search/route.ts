import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";

export async function POST(req: Request) {
  try {
    const { productId, productTitle } = await req.json();

    if (!productId || !productTitle) {
      return NextResponse.json({ error: "اطلاعات ناقص است" }, { status: 400 });
    }

    // 1. جستجو در تکنولایف
    const searchUrl = `https://www.technolife.com/search?q=${encodeURIComponent(productTitle)}`;
    const searchRes = await fetch(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!searchRes.ok) {
      return NextResponse.json({ error: "خطا در جستجوی تکنولایف" }, { status: 500 });
    }

    const html = await searchRes.text();

    // 2. پیدا کردن لینک عکس‌ها (با regex)
    // این regex دنبال urlهایی می‌گرده که با /image/ شروع می‌شن و به png یا jpg ختم می‌شن
    const imageRegex = /https:\/\/www\.technolife\.com\/image\/[^\s"']+\.(?:png|jpg|jpeg)/g;
    const matches = html.match(imageRegex);
    
    if (!matches || matches.length === 0) {
      return NextResponse.json({ error: "هیچ عکسی پیدا نشد" }, { status: 404 });
    }

    // 3. حذف تکراری‌ها و محدود کردن به ۱۰ عکس اول
    const uniqueImages = [...new Set(matches)].slice(0, 10);

    // 4. ذخیره در دیتابیس (MediaCandidate)
    const createdCandidates = [];
    for (const imgUrl of uniqueImages) {
      const exists = await prisma.mediaCandidate.findFirst({
        where: { productId, sourceUrl: imgUrl }
      });
      
      if (!exists) {
        const candidate = await prisma.mediaCandidate.create({
          data: {
            productId: productId,
            sourceUrl: imgUrl,
            previewUrl: imgUrl,
            status: "PENDING",
            source: "OTHER",
          },
        });
        createdCandidates.push(candidate);
      }
    }

    return NextResponse.json({ 
      success: true, 
      count: createdCandidates.length,
      images: uniqueImages 
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || "خطا در جستجو" }, { status: 500 });
  }
}
