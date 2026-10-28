import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";

export async function POST(req: Request) {
  try {
    const { candidateId, productId } = await req.json();

    if (!candidateId || !productId) {
      return NextResponse.json({ error: "اطلاعات ناقص است" }, { status: 400 });
    }

    // 1. پیدا کردن کاندید
    const candidate = await prisma.mediaCandidate.findUnique({
      where: { id: candidateId },
    });

    if (!candidate) {
      return NextResponse.json({ error: "کاندید یافت نشد" }, { status: 404 });
    }

    // 2. ساخت MediaAsset (عکس اصلی)
    const asset = await prisma.mediaAsset.create({
      data: {
        url: candidate.previewUrl,
        storagePath: candidate.previewUrl, // موقت
        filename: "candidate-" + candidate.id,
        mimeType: "image/jpeg", // موقت
        size: 0,
        source: "MANUAL_UPLOAD",
      },
    });

    // 3. ساخت ProductMedia (اتصال عکس به محصول)
    await prisma.productMedia.create({
      data: {
        productId: productId,
        mediaId: asset.id,
        status: "APPROVED",
        isPrimary: false,
      },
    });

    // 4. آپدیت وضعیت کاندید
    await prisma.mediaCandidate.update({
      where: { id: candidateId },
      data: { status: "APPROVED" },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "خطا" }, { status: 500 });
  }
}
