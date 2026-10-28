import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";

export async function POST(req: Request) {
  try {
    const { candidateId } = await req.json();

    if (!candidateId) {
      return NextResponse.json({ error: "شناسه کاندید خالی است" }, { status: 400 });
    }

    // فقط وضعیت رو به REJECTED تغییر بده (عکس توی دیتابیس می‌مونه)
    await prisma.mediaCandidate.update({
      where: { id: candidateId },
      data: { status: "REJECTED" },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "خطا" }, { status: 500 });
  }
}
