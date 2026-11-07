import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { calculateFinalPrice } from "@/lib/server/price-service";

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(req.url);
    const variantId = searchParams.get("variantId");

    const product = await prisma.product.findUnique({
      where: { slug },
      include: { variants: true },
    });

    if (!product) {
      return NextResponse.json({ error: "محصول یافت نشد" }, { status: 404 });
    }

    // انتخاب variant (اگه داده شده) یا اولین variant
    const variant = variantId
      ? product.variants.find((v) => v.id === variantId)
      : product.variants[0] || null;

    const result = calculateFinalPrice({
      productPrice: product.price,
      variantPrice: variant?.price,
      discountPercentage: product.discountPercentage,
      costPrice: product.costPrice,
    });

    return NextResponse.json({
      basePrice: result.basePrice.toString(),
      finalPrice: result.finalPrice.toString(),
      discountAmount: result.discountAmount.toString(),
      isBelowCost: result.isBelowCost,
      isBelowMinAllowed: result.isBelowMinAllowed,
      minAllowedPrice: result.minAllowedPrice?.toString() || null,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "خطا" }, { status: 500 });
  }
}
