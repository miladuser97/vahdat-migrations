import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";

export async function POST(req: Request) {
  try {
    const { productId, productTitle } = await req.json();

    if (!productId || !productTitle) {
      return NextResponse.json({ error: "اطلاعات ناقص است" }, { status: 400 });
    }

    // 1. جستجوی تصویر در گوگل
    // ما از سرویس DuckDuckGo استفاده می‌کنیم که رایگانه و API غیررسمی داره
    const searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(productTitle)}&iax=images&ia=images`;
    
    // 2. گرفتن صفحه جستجو
    const searchRes = await fetch(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!searchRes.ok) {
      return NextResponse.json({ error: "خطا در جستجوی گوگل" }, { status: 500 });
    }

    const searchHtml = await searchRes.text();

    // 3. پیدا کردن لینک عکس‌ها
    // DuckDuckGo لینک عکس‌ها رو داخل یه متغیر جاوااسکریپت به اسم vqd ذخیره می‌کنه
    // ما با regex دنبال لینک‌های عکس می‌گردیم
    const imageRegex = /"image":"(https:\/\/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/g;
    const matches = [...searchHtml.matchAll(imageRegex)];
    const imageUrls = matches.map(m => m[1]);

    // 4. اگه عکسی پیدا نشد، یه پیام خطا بده
    if (imageUrls.length === 0) {
      return NextResponse.json({ error: "هیچ عکسی در گوگل پیدا نشد" }, { status: 404 });
    }

    // 5. حذف تکراری‌ها و محدود کردن به ۱۰ عکس اول
    const uniqueImages = [...new Set(imageUrls)].slice(0, 10);

    // 6. ذخیره در دیتابیس
    const createdCandidates = [];
    for (const imgUrl of uniqueImages) {
      // چک کن که لینک معتبر باشه (با http شروع بشه)
      if (!imgUrl.startsWith("http")) continue;
      
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
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || "خطا در جستجو" }, { status: 500 });
  }
}
