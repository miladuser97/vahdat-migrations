"use server";

import { getAuthenticatedUser } from "./auth-utils";
import { prisma } from "./prisma";
import { logger } from "../logger";
import { revalidatePath } from "next/cache";
import {
  createServerSupabaseClient,
  PRODUCT_MEDIA_BUCKET,
} from "../supabase/server";
import { createHash } from "crypto";

// ============================================================
// Helpers
// ============================================================
function isAdmin(user: { role: string } | null): boolean {
  if (!user) return false;
  return user.role === "admin" || user.role === "super_admin";
}

// ✅ Helper: تبدیل string به MediaRole
const VALID_MEDIA_ROLES = [
  "PRIMARY",
  "GALLERY",
  "THUMBNAIL",
  "COLOR_VARIANT",
  "DETAIL",
  "LIFESTYLE",
  "PACKAGING",
] as const;

type MediaRoleValue = (typeof VALID_MEDIA_ROLES)[number];

function parseMediaRole(value: string | undefined): MediaRoleValue {
  if (value && (VALID_MEDIA_ROLES as readonly string[]).includes(value)) {
    return value as MediaRoleValue;
  }
  return "GALLERY";
}

// ============================================================
// Types
// ============================================================

export interface MediaAssetData {
  id: string;
  url: string;
  storagePath: string;
  filename: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  altText: string | null;
  title: string | null;
  source: string;
  createdAt: Date;
}

export interface ProductMediaData {
  id: string;
  productId: string;
  mediaId: string;
  displayOrder: number;
  isPrimary: boolean;
  role: string;
  status: string;
  createdAt: Date;
  media: MediaAssetData;
}

// ============================================================
// ✅ آپلود عکس دستی
// ============================================================
export type UploadMediaResult =
  | { success: true; data: { mediaId: string; url: string } }
  | { success: false; error: string };

export async function uploadMediaAction(
  formData: FormData
): Promise<UploadMediaResult> {
  const user = await getAuthenticatedUser();
  if (!isAdmin(user)) {
    return { success: false, error: "دسترسی غیرمجاز." };
  }

  try {
    const file = formData.get("file") as File | null;
    if (!file) {
      return { success: false, error: "فایلی انتخاب نشده." };
    }

    // اعتبارسنجی
    if (!file.type.startsWith("image/")) {
      return { success: false, error: "فقط فایل تصویری مجاز است." };
    }

    const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
    if (file.size > MAX_SIZE) {
      return { success: false, error: "حجم فایل بیش از ۵ مگابایت است." };
    }

    // خواندن فایل
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // محاسبه checksum (SHA-256)
    const checksum = createHash("sha256").update(buffer).digest("hex");

    // چک تکراری
    const existing = await prisma.mediaAsset.findUnique({
      where: { checksum },
    });

    if (existing) {
      return {
        success: true,
        data: { mediaId: existing.id, url: existing.url },
      };
    }

    // آپلود به Supabase
    const supabase = createServerSupabaseClient();

    const ext = file.name.split(".").pop() || "jpg";
    const uniqueId = crypto.randomUUID();
    const storagePath = `products/${uniqueId}/original.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(PRODUCT_MEDIA_BUCKET)
      .upload(storagePath, buffer, {
        contentType: file.type,
        cacheControl: "31536000",
        upsert: false,
      });

    if (uploadError) {
      logger.error("[Media] Upload failed", { error: uploadError.message });
      return { success: false, error: "خطا در آپلود عکس." };
    }

    // URL عمومی
    const { data: urlData } = supabase.storage
      .from(PRODUCT_MEDIA_BUCKET)
      .getPublicUrl(storagePath);

    const publicUrl = urlData.publicUrl;

    // ذخیره در دیتابیس
    const media = await prisma.mediaAsset.create({
      data: {
        url: publicUrl,
        storagePath,
        filename: file.name,
        mimeType: file.type,
        size: file.size,
        checksum,
        source: "MANUAL_UPLOAD",
      },
    });

    logger.info("[Media] Uploaded", { mediaId: media.id, by: user!.id });

    return {
      success: true,
      data: { mediaId: media.id, url: publicUrl },
    };
  } catch (error) {
    logger.error("[Media] Upload error", {
      error: error instanceof Error ? error.message : String(error),
    });
    return { success: false, error: "خطا در آپلود عکس." };
  }
}

// ============================================================
// ✅ اتصال عکس به محصول
// ============================================================
export type AttachMediaResult =
  | { success: true; data: { productMediaId: string } }
  | { success: false; error: string };

export async function attachMediaToProductAction(
  productId: string,
  mediaId: string,
  options?: {
    role?: string;
    isPrimary?: boolean;
    displayOrder?: number;
  }
): Promise<AttachMediaResult> {
  const user = await getAuthenticatedUser();
  if (!isAdmin(user)) {
    return { success: false, error: "دسترسی غیرمجاز." };
  }

  try {
    // چک محصول و عکس
    const [product, media] = await Promise.all([
      prisma.product.findUnique({ where: { id: productId } }),
      prisma.mediaAsset.findUnique({ where: { id: mediaId } }),
    ]);

    if (!product) return { success: false, error: "محصول یافت نشد." };
    if (!media) return { success: false, error: "عکس یافت نشد." };

    // چک اتصال تکراری
    const existingLink = await prisma.productMedia.findUnique({
      where: {
        productId_mediaId: { productId, mediaId },
      },
    });

    if (existingLink) {
      return {
        success: true,
        data: { productMediaId: existingLink.id },
      };
    }

    // اگه isPrimary = true، بقیه رو false کن
    const isPrimary = options?.isPrimary ?? false;

    if (isPrimary) {
      await prisma.productMedia.updateMany({
        where: { productId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const productMedia = await prisma.productMedia.create({
      data: {
        productId,
        mediaId,
        role: parseMediaRole(options?.role),
        isPrimary,
        displayOrder: options?.displayOrder ?? 0,
        status: "APPROVED",
        approvedById: user!.id,
        approvedAt: new Date(),
      },
    });

    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${productId}/edit`);
    revalidatePath("/products");
    revalidatePath(`/products/${product.slug}`);

    logger.info("[Media] Attached", {
      productMediaId: productMedia.id,
      productId,
      mediaId,
      by: user!.id,
    });

    return {
      success: true,
      data: { productMediaId: productMedia.id },
    };
  } catch (error) {
    logger.error("[Media] Attach error", {
      error: error instanceof Error ? error.message : String(error),
    });
    return { success: false, error: "خطا در اتصال عکس." };
  }
}

// ============================================================
// ✅ حذف اتصال عکس از محصول (Detach)
// ============================================================
export type DetachMediaResult =
  | { success: true; data: { id: string } }
  | { success: false; error: string };

export async function detachMediaFromProductAction(
  productMediaId: string
): Promise<DetachMediaResult> {
  const user = await getAuthenticatedUser();
  if (!isAdmin(user)) {
    return { success: false, error: "دسترسی غیرمجاز." };
  }

  try {
    const link = await prisma.productMedia.findUnique({
      where: { id: productMediaId },
      include: { product: { select: { slug: true } } },
    });

    if (!link) {
      return { success: false, error: "اتصال یافت نشد." };
    }

    await prisma.productMedia.delete({ where: { id: productMediaId } });

    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${link.productId}/edit`);
    revalidatePath("/products");
    revalidatePath(`/products/${link.product.slug}`);

    logger.info("[Media] Detached", {
      productMediaId,
      by: user!.id,
    });

    return { success: true, data: { id: productMediaId } };
  } catch (error) {
    logger.error("[Media] Detach error", {
      error: error instanceof Error ? error.message : String(error),
    });
    return { success: false, error: "خطا در حذف اتصال." };
  }
}

// ============================================================
// ✅ گرفتن همه‌ی عکس‌های یک محصول
// ============================================================
export type GetProductMediaResult =
  | { success: true; data: ProductMediaData[] }
  | { success: false; error: string };

export async function getProductMediaAction(
  productId: string
): Promise<GetProductMediaResult> {
  const user = await getAuthenticatedUser();
  if (!isAdmin(user)) {
    return { success: false, error: "دسترسی غیرمجاز." };
  }

  try {
    const items = await prisma.productMedia.findMany({
      where: { productId, status: "APPROVED" },
      include: { media: true },
      orderBy: [{ isPrimary: "desc" }, { displayOrder: "asc" }],
    });

    return {
      success: true,
      data: items.map((item) => ({
        id: item.id,
        productId: item.productId,
        mediaId: item.mediaId,
        displayOrder: item.displayOrder,
        isPrimary: item.isPrimary,
        role: item.role,
        status: item.status,
        createdAt: item.createdAt,
        media: {
          id: item.media.id,
          url: item.media.url,
          storagePath: item.media.storagePath,
          filename: item.media.filename,
          mimeType: item.media.mimeType,
          size: item.media.size,
          width: item.media.width,
          height: item.media.height,
          altText: item.media.altText,
          title: item.media.title,
          source: item.media.source,
          createdAt: item.media.createdAt,
        },
      })),
    };
  } catch (error) {
    logger.error("[Media] GetProductMedia error", {
      error: error instanceof Error ? error.message : String(error),
    });
    return { success: false, error: "خطا در بارگذاری عکس‌ها." };
  }
}

// ============================================================
// ✅ گرفتن آرشیو عکس‌ها (برای پنل /admin/media)
// ============================================================
export type GetAllMediaResult =
  | { success: true; data: MediaAssetData[] }
  | { success: false; error: string };

export async function getAllMediaAction(): Promise<GetAllMediaResult> {
  const user = await getAuthenticatedUser();
  if (!isAdmin(user)) {
    return { success: false, error: "دسترسی غیرمجاز." };
  }

  try {
    const items = await prisma.mediaAsset.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return {
      success: true,
      data: items.map((item) => ({
        id: item.id,
        url: item.url,
        storagePath: item.storagePath,
        filename: item.filename,
        mimeType: item.mimeType,
        size: item.size,
        width: item.width,
        height: item.height,
        altText: item.altText,
        title: item.title,
        source: item.source,
        createdAt: item.createdAt,
      })),
    };
  } catch (error) {
    logger.error("[Media] GetAll error", {
      error: error instanceof Error ? error.message : String(error),
    });
    return { success: false, error: "خطا در بارگذاری آرشیو." };
  }
}

// ============================================================
// ✅ حذف کامل عکس (فقط super_admin)
// ============================================================
export type DeleteMediaResult =
  | { success: true; data: { id: string } }
  | { success: false; error: string };

export async function deleteMediaAction(
  mediaId: string
): Promise<DeleteMediaResult> {
  const user = await getAuthenticatedUser();
  if (!user || user.role !== "super_admin") {
    return { success: false, error: "فقط مدیر ارشد می‌تواند عکس حذف کند." };
  }

  try {
    const media = await prisma.mediaAsset.findUnique({
      where: { id: mediaId },
      include: {
        _count: { select: { productLinks: true } },
      },
    });

    if (!media) {
      return { success: false, error: "عکس یافت نشد." };
    }

    if (media._count.productLinks > 0) {
      return {
        success: false,
        error: `این عکس به ${media._count.productLinks} محصول متصل است. ابتدا از محصولات جدا کنید.`,
      };
    }

    // حذف از Supabase
    const supabase = createServerSupabaseClient();
    await supabase.storage.from(PRODUCT_MEDIA_BUCKET).remove([media.storagePath]);

    // حذف از دیتابیس
    await prisma.mediaAsset.delete({ where: { id: mediaId } });

    revalidatePath("/admin/media");

    logger.info("[Media] Deleted", { mediaId, by: user.id });

    return { success: true, data: { id: mediaId } };
  } catch (error) {
    logger.error("[Media] Delete error", {
      error: error instanceof Error ? error.message : String(error),
    });
    return { success: false, error: "خطا در حذف عکس." };
  }
}