import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";

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

    // 👈 انتخاب variant (اگه داده شده و قیمت داره)
    let basePrice = Number(product.price);
    
    if (variantId) {
      const variant = product.variants.find((v) => v.id === variantId);
      if (variant && variant.price) {
        basePrice = Number(variant.price);
      }
    }

    const discountPercentage = Number(product.discountPercentage ?? 0);
    const discountAmount = (basePrice * discountPercentage) / 100;
    const finalPrice = Math.round(basePrice - discountAmount);

    return NextResponse.json({
      basePrice: basePrice.toString(),
      finalPrice: finalPrice.toString(),
      discountAmount: Math.round(discountAmount).toString(),
      discountPercentage: discountPercentage,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "خطا" }, { status: 500 });
  }
}
