import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";

export async function POST(req: Request) {
  try {
    const { candidateId, productId } = await req.json();

    if (!candidateId || !productId) {
      return NextResponse.json({ error: "اطلاعات ناقص است" }, { status: 400 });
    }

    const candidate = await prisma.mediaCandidate.findUnique({
      where: { id: candidateId },
    });

    if (!candidate) {
      return NextResponse.json({ error: "کاندید یافت نشد" }, { status: 404 });
    }

    const asset = await prisma.mediaAsset.create({
      data: {
        url: candidate.previewUrl,
        storagePath: candidate.previewUrl,
        filename: "candidate-" + candidate.id,
        mimeType: "image/jpeg",
        size: 0,
        source: "MANUAL_UPLOAD",
      },
    });

    await prisma.productMedia.create({
      data: {
        productId: productId,
        mediaId: asset.id,
        status: "APPROVED",
        isPrimary: false,
        variantId: candidate.variantId, // 👈 انتقال رنگ
      },
    });

    await prisma.mediaCandidate.update({
      where: { id: candidateId },
      data: { status: "APPROVED" },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "خطا" }, { status: 500 });
  }
}
