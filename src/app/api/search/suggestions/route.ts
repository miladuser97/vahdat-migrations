import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { logger } from "@/lib/logger";

// ============================================================
// GET /api/search/suggestions?q=...
// ============================================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim() ?? "";

    // ✅ حداقل ۲ کاراکتر
    if (query.length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    // ✅ جستجو در محصولات (title, shortDescription)
    const products = await prisma.product.findMany({
      where: {
        isEnabled: true,
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { shortDescription: { contains: query, mode: "insensitive" } },
          { sku: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 6,
      orderBy: [{ isBestSeller: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        slug: true,
        title: true,
        discountPrice: true,
        price: true,
        images: true,
        categorySlug: true,
      },
    });

    // ✅ فرمت کردن پیشنهادها
    const suggestions = products.map((product) => {
      // استخراج اولین تصویر
      let imageUrl: string | undefined;
      if (Array.isArray(product.images) && product.images.length > 0) {
        const first = product.images[0];
        if (typeof first === "string") imageUrl = first;
      }

      // قیمت نهایی
      const finalPrice = product.discountPrice
        ? Number(product.discountPrice)
        : Number(product.price);

      return {
        id: product.id,
        slug: product.slug,
        title: product.title,
        price: finalPrice,
        image: imageUrl,
        category: product.categorySlug ?? undefined,
      };
    });

    return NextResponse.json({ suggestions });
  } catch (error) {
    logger.error("خطا در API جستجو", { error });

    return NextResponse.json(
      { suggestions: [], error: "خطا در جستجو" },
      { status: 500 }
    );
  }
}