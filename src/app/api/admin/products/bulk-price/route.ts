import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";

export async function POST(req: Request) {
  try {
    const { categorySlug, updateType, value, includeVariants } = await req.json();

    if (!categorySlug || !updateType || value === undefined) {
      return NextResponse.json({ error: "اطلاعات ناقص است" }, { status: 400 });
    }

    if (updateType !== "PERCENTAGE" && updateType !== "FIXED") {
      return NextResponse.json({ error: "نوع به‌روزرسانی نامعتبر است" }, { status: 400 });
    }

    const products = await prisma.product.findMany({
      where: { categorySlug, isEnabled: true },
      include: { variants: includeVariants },
    });

    if (products.length === 0) {
      return NextResponse.json({ error: "محصولی در این دسته‌بندی یافت نشد" }, { status: 404 });
    }

    if (products.length > 100) {
      return NextResponse.json({ error: "حداکثر ۱۰۰ محصول در هر درخواست مجاز است" }, { status: 400 });
    }

    const results = [];
    for (const product of products) {
      try {
        const newPrice = updateType === "PERCENTAGE"
          ? product.price.mul(1 + value / 100).toNumber()
          : product.price.add(value).toNumber();

        if (newPrice < 0) {
          results.push({ productId: product.id, title: product.title, success: false, error: "قیمت منفی" });
          continue;
        }

        await prisma.$transaction(async (tx) => {
          await tx.priceHistory.create({
            data: {
              productId: product.id,
              oldPrice: product.price,
              newPrice: String(newPrice),
              changeType: "PRICE",
              source: "MANUAL",
            },
          });

          await tx.product.update({
            where: { id: product.id },
            data: { price: String(newPrice) },
          });

          if (includeVariants && product.variants) {
            for (const variant of product.variants) {
              if (variant.price) {
                const newVariantPrice = updateType === "PERCENTAGE"
                  ? variant.price.mul(1 + value / 100).toNumber()
                  : variant.price.add(value).toNumber();

                await tx.priceHistory.create({
                  data: {
                    productId: product.id,
                    variantId: variant.id,
                    oldPrice: variant.price,
                    newPrice: String(newVariantPrice),
                    changeType: "PRICE",
                    source: "MANUAL",
                  },
                });

                await tx.productVariant.update({
                  where: { id: variant.id },
                  data: { price: String(newVariantPrice) },
                });
              }
            }
          }
        });

        results.push({ productId: product.id, title: product.title, success: true });
      } catch (err: any) {
        results.push({ productId: product.id, title: product.title, success: false, error: err.message });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failedCount = results.filter((r) => !r.success).length;

    return NextResponse.json({
      success: true,
      total: products.length,
      successCount,
      failedCount,
      results,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "خطا" }, { status: 500 });
  }
}
