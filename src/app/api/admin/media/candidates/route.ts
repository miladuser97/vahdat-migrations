import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";

export async function GET() {
  try {
    const candidates = await prisma.mediaCandidate.findMany({
      where: { status: "PENDING" },
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
