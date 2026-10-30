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

    const searchHtml = await searchRes.text();

    // 2. پیدا کردن اولین لینک محصول (product-ID)
    const productLinkRegex = /href="(\/product-\d+\/[^"]+)"/;
    const productLinkMatch = searchHtml.match(productLinkRegex);

    if (!productLinkMatch) {
      return NextResponse.json({ error: "محصولی در تکنولایف پیدا نشد" }, { status: 404 });
    }

    const productPath = productLinkMatch[1];
    const productUrl = `https://www.technolife.com${productPath}`;

    // 3. رفتن به صفحه محصول
    const productRes = await fetch(productUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!productRes.ok) {
      return NextResponse.json({ error: "خطا در باز کردن صفحه محصول" }, { status: 500 });
    }

    const productHtml = await productRes.text();

    // 4. پیدا کردن لینک عکس‌ها (با ساختار دقیق تکنولایف)
    const imageRegex = /https:\/\/www\.technolife\.com\/image\/[^\s"']+\.(?:png|jpg|jpeg)/g;
    const matches = productHtml.match(imageRegex);
    
    if (!matches || matches.length === 0) {
      return NextResponse.json({ error: "هیچ عکسی در صفحه محصول پیدا نشد" }, { status: 404 });
    }

    // 5. حذف تکراری‌ها و محدود کردن به ۱۰ عکس اول
    const uniqueImages = [...new Set(matches)].slice(0, 10);

    // 6. ذخیره در دیتابیس
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
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || "خطا در جستجو" }, { status: 500 });
  }
}
