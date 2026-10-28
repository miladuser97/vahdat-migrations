import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json({ error: "شناسه محصول خالی است" }, { status: 400 });
    }

    const variants = await prisma.productVariant.findMany({
      where: { productId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(variants);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "خطا" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { productId, color, colorHex } = await req.json();

    if (!productId || !color) {
      return NextResponse.json({ error: "اطلاعات ناقص است" }, { status: 400 });
    }

    // ساخت اسلاگ یکتا بر اساس رنگ
    const slug = color.replace(/\s+/g, "-").toLowerCase() + "-" + Date.now();
    const sku = "VAR-" + Date.now();

    const variant = await prisma.productVariant.create({
      data: {
        productId,
        color,
        colorHex: colorHex || "#000000",
        slug,
        sku,
        price: 0, // قیمت رو بعداً تو فاز ۳.۸ اضافه می‌کنیم
      },
    });

    return NextResponse.json({ success: true, variant });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "خطا" }, { status: 500 });
  }
}
