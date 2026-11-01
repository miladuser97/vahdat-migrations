import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");
    const limit = parseInt(searchParams.get("limit") || "100");

    const whereClause = productId ? { productId } : {};

    const history = await prisma.priceHistory.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        product: { select: { title: true } },
        variant: { select: { color: true } },
      },
    });

    return NextResponse.json(
      history.map((h) => ({
        id: h.id,
        productTitle: h.product.title,
        variantColor: h.variant?.color || null,
        oldPrice: h.oldPrice?.toString() || null,
        newPrice: h.newPrice?.toString() || null,
        oldDiscountPercentage: h.oldDiscountPercentage,
        newDiscountPercentage: h.newDiscountPercentage,
        changeType: h.changeType,
        source: h.source,
        createdAt: h.createdAt,
      }))
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "خطا" }, { status: 500 });
  }
}
