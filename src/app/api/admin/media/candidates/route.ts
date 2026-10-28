import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");

    const whereClause = productId 
      ? { status: "PENDING" as const, productId } 
      : { status: "PENDING" as const };

    const candidates = await prisma.mediaCandidate.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        sourceUrl: true,
        previewUrl: true,
        status: true,
        createdAt: true,
      },
    });
    return NextResponse.json(candidates);
  } catch (error) {
    return NextResponse.json({ error: "خطا در خواندن کاندیدها" }, { status: 500 });
  }
}
