import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";

export async function POST(req: Request) {
  try {
    const { mediaId } = await req.json();

    if (!mediaId) {
      return NextResponse.json({ error: "شناسه عکس خالی است" }, { status: 400 });
    }

    // فقط رکورد اتصال عکس به محصول رو پاک می‌کنیم
    await prisma.productMedia.delete({
      where: { id: mediaId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "خطا" }, { status: 500 });
  }
}
