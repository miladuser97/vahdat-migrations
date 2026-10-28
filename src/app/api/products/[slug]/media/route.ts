import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;

    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        variants: true,
        media: {
          where: { status: "APPROVED" },
          include: { media: true, variant: true },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "محصول یافت نشد" }, { status: 404 });
    }

    return NextResponse.json({
      variants: product.variants,
      media: product.media.map((m) => ({
        id: m.id,
        url: m.media.url,
        variantId: m.variantId,
        colorHex: m.variant?.colorHex || null,
        colorName: m.variant?.color || null,
        isPrimary: m.isPrimary,
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "خطا" }, { status: 500 });
  }
}
