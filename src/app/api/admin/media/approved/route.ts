import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json({ error: "شناسه محصول خالی است" }, { status: 400 });
    }

    const mediaList = await prisma.productMedia.findMany({
      where: { productId },
      include: { media: true },
      orderBy: { displayOrder: "asc" },
    });

    return NextResponse.json(mediaList);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "خطا" }, { status: 500 });
  }
}
