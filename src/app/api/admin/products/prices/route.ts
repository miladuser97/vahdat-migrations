import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { getAuthenticatedUser } from "@/lib/server/auth-utils";

export async function PUT(req: Request) {
  try {
    // ۱. بررسی احراز هویت و نقش ADMIN
    const user = await getAuthenticatedUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    }

    const { productId, price, costPrice, targetPrice, discountPercentage, variantId } = await req.json();

    if (!productId) {
      return NextResponse.json({ error: "شناسه محصول خالی است" }, { status: 400 });
    }

    // ۲. اعتبارسنجی درصد تخفیف
    if (discountPercentage !== undefined && (discountPercentage < 0 || discountPercentage > 100)) {
      return NextResponse.json({ error: "درصد تخفیف باید بین ۰ تا ۱۰۰ باشد" }, { status: 400 });
    }

    // ۳. اگر variantId دارد، به‌روزرسانی variant
    if (variantId) {
      const variant = await prisma.productVariant.findFirst({
        where: { id: variantId, productId },
      });
      if (!variant) {
        return NextResponse.json({ error: "variant یافت نشد یا متعلق به این محصول نیست" }, { status: 404 });
      }

      const oldPrice = variant.price;
      const updated = await prisma.$transaction(async (tx) => {
        // ثبت تاریخچه
        await tx.priceHistory.create({
          data: {
            productId,
            variantId,
            oldPrice: oldPrice || undefined,
            newPrice: price ? String(price) : undefined,
            changeType: "PRICE",
            source: "MANUAL",
            changedById: user.id,
          },
        });

        // به‌روزرسانی
        return tx.productVariant.update({
          where: { id: variantId },
          data: { price: price ? String(price) : null },
        });
      });

      return NextResponse.json({ success: true, variant: updated });
    }

    // ۴. به‌روزرسانی محصول
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json({ error: "محصول یافت نشد" }, { status: 404 });
    }

    const oldPrice = product.price;
    const oldDiscount = product.discountPercentage;

    const updated = await prisma.$transaction(async (tx) => {
      // ثبت تاریخچه
      await tx.priceHistory.create({
        data: {
          productId,
          oldPrice: oldPrice,
          newPrice: price ? String(price) : oldPrice,
          oldDiscountPercentage: oldDiscount,
          newDiscountPercentage: discountPercentage,
          changeType: "PRICE",
          source: "MANUAL",
          changedById: user.id,
        },
      });

      // به‌روزرسانی
      return tx.product.update({
        where: { id: productId },
        data: {
          price: price ? String(price) : product.price,
          costPrice: costPrice ? String(costPrice) : product.costPrice,
          targetPrice: targetPrice ? String(targetPrice) : product.targetPrice,
          discountPercentage: discountPercentage ?? product.discountPercentage,
        },
      });
    });

    return NextResponse.json({ success: true, product: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "خطا" }, { status: 500 });
  }
}
