// src/features/media/services/approve-candidate-service.ts
// ⚠️ Server-only: Approve / Reject / Claim برای MediaCandidate
//
// این سرویس از ابزارهای امنیتی موجود پروژه استفاده می‌کنه:
//   - safeDownload (IP Pinning + SSRF protection)
//   - validateImageBuffer (magic bytes + sharp + checksum واقعی)
//   - dynamic import createServerSupabaseClient (سازگار با tsx)
//
// ⚠️ کنترل هم‌زمان با claimToken + claimExpiresAt
// ⚠️ جلوگیری از تأیید هم‌زمان با updateMany شرطی
// ⚠️ cleanup امن در صورت شکست Storage یا DB
// ⚠️ Dependency Injection برای تست‌پذیری (deps)
// ⚠️ PRODUCT_MEDIA_EXISTS: خطای کنترل‌شده وقتی MediaAsset قبلاً
//    به همون Product لینک شده
// ⚠️ P2002 فقط برای قید (productId, mediaId) — نه قیدهای دیگه
// ⚠️ مدیریت فایل یتیم: فایل جدید آپلود شده پاک می‌شه اگه استفاده نشه
// ⚠️ خطای cleanup نباید خطای اصلی رو پنهان کنه

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/server/prisma";
import { logger } from "@/lib/logger";
import { createHash } from "crypto";
import { safeDownload } from "../lib/downloader";
import { validateImageBuffer, type AllowedMimeType } from "../lib/image-validator";

// ============================================================
// ثابت‌ها
// ============================================================

const CLAIM_TTL_MS = 5 * 60 * 1000; // 5 دقیقه
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const PRODUCT_MEDIA_BUCKET = "product-media";

const EXTENSION_BY_MIME: Record<AllowedMimeType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

// ============================================================
// تایپ‌ها
// ============================================================

export interface ClaimCandidateInput {
  candidateId: string;
  userId: string;
}

export interface ClaimResult {
  claimToken: string;
  claimExpiresAt: Date;
  candidateId: string;
}

export interface ApproveCandidateInput {
  candidateId: string;
  claimToken: string;
  userId: string;
  role?: string;
  isPrimary?: boolean;
  variantId?: string | null;
}

export interface ApproveResult {
  success: true;
  mediaId: string;
  productMediaId: string;
  url: string;
}

export interface RejectCandidateInput {
  candidateId: string;
  userId: string;
  reason?: string;
}

export type ApproveOutcome =
  | { success: true; data: ApproveResult }
  | { success: false; error: string; code: string };

// ============================================================
// Dependency Injection برای تست‌پذیری
// ============================================================

export interface ApproveDeps {
  download?: typeof safeDownload;
  validate?: typeof validateImageBuffer;
  uploadToStorage?: typeof uploadToStorage;
  cleanupStorage?: typeof cleanupStorage;
}

// ============================================================
// Helper: تولید claimToken
// ============================================================

function generateClaimToken(): string {
  return createHash("sha256")
    .update(`${Date.now()}-${Math.random()}-${process.pid}`)
    .digest("hex");
}

// ============================================================
// Helper: بررسی انقضای claim
// ============================================================

function isClaimExpired(expiresAt: Date | null): boolean {
  if (!expiresAt) return true;
  return expiresAt.getTime() < Date.now();
}

// ============================================================
// Helper: بررسی P2002 مخصوص قید (productId, mediaId)
// ============================================================
// ⚠️ P2002 ممکنه برای هر unique constraint باشه
// فقط اگه target شامل productId و mediaId باشه، اون وقت
// PRODUCT_MEDIA_EXISTS برمی‌گردونیم
// ============================================================

function isProductMediaUniqueViolation(e: unknown): boolean {
  if (!(e instanceof Prisma.PrismaClientKnownRequestError)) return false;
  if (e.code !== "P2002") return false;

  const meta = e.meta as { target?: unknown } | undefined;
  const target = meta?.target;

  if (Array.isArray(target)) {
    const targetStr = target.map((t) => String(t));
    return targetStr.includes("productId") && targetStr.includes("mediaId");
  }

  if (typeof target === "string") {
    return target.includes("productId") && target.includes("mediaId");
  }

  return false;
}

// ============================================================
// Helper: cleanup امن (خطا رو پنهان نمی‌کنه)
// ============================================================
// ⚠️ خطای cleanup نباید خطای اصلی رو پنهان کنه
// فقط log می‌شه و ادامه می‌دیم
// ============================================================

async function safeCleanup(
  cleanupFn: typeof cleanupStorage,
  storagePath: string,
  context: string,
  extraMeta: Record<string, unknown> = {}
): Promise<void> {
  try {
    await cleanupFn(storagePath);
  } catch (cleanupError) {
    logger.error(`[Approve] Cleanup failed after ${context}`, {
      storagePath,
      error:
        cleanupError instanceof Error
          ? cleanupError.message
          : String(cleanupError),
      ...extraMeta,
    });
  }
}

// ============================================================
// claimCandidate
// ============================================================

export async function claimCandidate(
  input: ClaimCandidateInput
): Promise<ClaimResult | null> {
  const { candidateId, userId } = input;

  const now = new Date();
  const claimToken = generateClaimToken();
  const claimExpiresAt = new Date(now.getTime() + CLAIM_TTL_MS);

  const result = await prisma.mediaCandidate.updateMany({
    where: {
      id: candidateId,
      status: "PENDING",
      OR: [
        { claimToken: null },
        { claimExpiresAt: null },
        { claimExpiresAt: { lt: now } },
      ],
    },
    data: {
      claimToken,
      claimExpiresAt,
      reviewedById: userId,
    },
  });

  if (result.count === 0) {
    logger.info("[Approve] Claim failed — candidate already claimed or not PENDING", {
      candidateId,
      userId,
    });
    return null;
  }

  logger.info("[Approve] Claim acquired", {
    candidateId,
    userId,
    claimExpiresAt: claimExpiresAt.toISOString(),
  });

  return {
    claimToken,
    claimExpiresAt,
    candidateId,
  };
}

// ============================================================
// Helper: آپلود به Supabase Storage (dynamic import برای tsx)
// ============================================================

interface StorageUploadResult {
  storagePath: string;
  publicUrl: string;
}

async function uploadToStorage(
  candidateId: string,
  buffer: Buffer,
  mimeType: AllowedMimeType,
  checksum: string
): Promise<StorageUploadResult> {
  const extension = EXTENSION_BY_MIME[mimeType];
  const storagePath = `candidates/${candidateId}/${checksum}.${extension}`;

  const { createServerSupabaseClient } = await import("@/lib/supabase/server");
  const supabase = createServerSupabaseClient();

  const { error } = await supabase.storage
    .from(PRODUCT_MEDIA_BUCKET)
    .upload(storagePath, buffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    throw new Error(`STORAGE_UPLOAD_FAILED: ${error.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from(PRODUCT_MEDIA_BUCKET)
    .getPublicUrl(storagePath);

  return {
    storagePath,
    publicUrl: publicUrlData.publicUrl,
  };
}

// ============================================================
// Helper: پاک‌سازی Storage
// ============================================================

async function cleanupStorage(storagePath: string): Promise<void> {
  const { createServerSupabaseClient } = await import("@/lib/supabase/server");
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.storage
    .from(PRODUCT_MEDIA_BUCKET)
    .remove([storagePath]);

  if (error) {
    throw new Error(`STORAGE_CLEANUP_FAILED: ${error.message}`);
  }
}

// ============================================================
// approveCandidate
// ============================================================

export async function approveCandidate(
  input: ApproveCandidateInput,
  deps: ApproveDeps = {}
): Promise<ApproveOutcome> {
  const { candidateId, claimToken, userId, role, isPrimary, variantId } = input;

  const downloadFn = deps.download ?? safeDownload;
  const validateFn = deps.validate ?? validateImageBuffer;
  const uploadFn = deps.uploadToStorage ?? uploadToStorage;
  const cleanupFn = deps.cleanupStorage ?? cleanupStorage;

  // ─────────────────────────────────────────
  // مرحله ۱: بررسی candidate و claim
  // ─────────────────────────────────────────
  const candidate = await prisma.mediaCandidate.findUnique({
    where: { id: candidateId },
  });

  if (!candidate) {
    return { success: false, error: "Candidate یافت نشد", code: "NOT_FOUND" };
  }

  if (candidate.status !== "PENDING" && candidate.status !== "APPROVING") {
    return {
      success: false,
      error: `Candidate در وضعیت ${candidate.status} است`,
      code: "INVALID_STATUS",
    };
  }

  if (candidate.claimToken !== claimToken) {
    return { success: false, error: "Claim token نامطابق", code: "INVALID_CLAIM" };
  }

  if (isClaimExpired(candidate.claimExpiresAt)) {
    return { success: false, error: "Claim منقضی شده", code: "CLAIM_EXPIRED" };
  }

  // ─────────────────────────────────────────
  // مرحله ۲: transition PENDING → APPROVING
  // ─────────────────────────────────────────
  const statusUpdate = await prisma.mediaCandidate.updateMany({
    where: {
      id: candidateId,
      claimToken,
      status: "PENDING",
      claimExpiresAt: { gt: new Date() },
    },
    data: { status: "APPROVING" },
  });

  if (statusUpdate.count === 0) {
    return {
      success: false,
      error: "عدم امکان تغییر وضعیت (race condition)",
      code: "RACE_CONDITION",
    };
  }

  let storagePath: string | null = null;
  let mediaAssetIdForConflict: string | null = null;

  try {
    // ─────────────────────────────────────────
    // مرحله ۳: دانلود امن
    // ─────────────────────────────────────────
    const downloadOutcome = await downloadFn(candidate.sourceUrl, {
      maxSize: MAX_IMAGE_SIZE_BYTES,
    });

    if (!downloadOutcome.success) {
      await releaseClaim(candidateId, claimToken);
      return {
        success: false,
        error: `دانلود ناموفق: ${downloadOutcome.reason}`,
        code: "DOWNLOAD_FAILED",
      };
    }

    const { buffer } = downloadOutcome;

    // ─────────────────────────────────────────
    // مرحله ۴: اعتبارسنجی تصویر
    // ─────────────────────────────────────────
    const validation = await validateFn(buffer);

    if (!validation.valid) {
      await releaseClaim(candidateId, claimToken);
      return {
        success: false,
        error: `اعتبارسنجی ناموفق: ${validation.reason}`,
        code: "VALIDATION_FAILED",
      };
    }

    const { mimeType, width, height, checksum, size } = validation;

    // ─────────────────────────────────────────
    // مرحله ۵: آپلود به Storage
    // ─────────────────────────────────────────
    let upload: StorageUploadResult;
    try {
      upload = await uploadFn(candidateId, buffer, mimeType, checksum);
      storagePath = upload.storagePath;
    } catch (e) {
      await releaseClaim(candidateId, claimToken);
      return {
        success: false,
        error: e instanceof Error ? e.message : "آپلود ناموفق",
        code: "STORAGE_FAILED",
      };
    }

    // ─────────────────────────────────────────
    // مرحله ۶: DB transaction
    // ─────────────────────────────────────────
    let mediaId: string;
    let productMediaId: string;
    let reusedMediaAsset = false;

    try {
      const result = await prisma.$transaction(async (tx) => {
        // ۶.۱: reuse MediaAsset بر اساس checksum
        let mediaAsset = await tx.mediaAsset.findFirst({
          where: { checksum },
        });

        if (!mediaAsset) {
          mediaAsset = await tx.mediaAsset.create({
            data: {
              url: upload.publicUrl,
              storagePath: upload.storagePath,
              filename: `${checksum}.${EXTENSION_BY_MIME[mimeType]}`,
              mimeType,
              size,
              width,
              height,
              checksum,
              source: candidate.source,
              title: candidate.title,
            },
          });
        } else {
          reusedMediaAsset = true;
        }

        mediaAssetIdForConflict = mediaAsset.id;

        // ۶.۲: ProductMedia — طبق unique constraint (productId, mediaId)
        const existingProductMedia = await tx.productMedia.findFirst({
          where: {
            productId: candidate.productId,
            mediaId: mediaAsset.id,
          },
        });

        if (existingProductMedia) {
          throw new Error(
            `PRODUCT_MEDIA_EXISTS: این MediaAsset از قبل به این Product متصل است (productMediaId=${existingProductMedia.id})`
          );
        }

        // ایجاد ProductMedia جدید
        const productMedia = await tx.productMedia.create({
          data: {
            productId: candidate.productId,
            mediaId: mediaAsset.id,
            variantId: variantId ?? null,
            displayOrder: 0,
            isPrimary: isPrimary ?? false,
            role:
              (role as
                | "PRIMARY"
                | "GALLERY"
                | "THUMBNAIL"
                | "COLOR_VARIANT"
                | "DETAIL"
                | "LIFESTYLE"
                | "PACKAGING") ?? "GALLERY",
            status: "APPROVED",
            approvedById: userId,
            approvedAt: new Date(),
          },
        });

        // ۶.۳: candidate → APPROVED
        await tx.mediaCandidate.update({
          where: { id: candidateId },
          data: {
            status: "APPROVED",
            reviewedById: userId,
            reviewedAt: new Date(),
            claimToken: null,
            claimExpiresAt: null,
          },
        });

        return { mediaAsset, productMedia };
      });

      mediaId = result.mediaAsset.id;
      productMediaId = result.productMedia.id;
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);

      // ✅ PRODUCT_MEDIA_EXISTS (کنترل‌شده، قبل از P2002)
      if (errorMessage.startsWith("PRODUCT_MEDIA_EXISTS")) {
        if (storagePath) {
          await safeCleanup(cleanupFn, storagePath, "PRODUCT_MEDIA_EXISTS", {
            candidateId,
          });
        }
        await releaseClaim(candidateId, claimToken);
        return {
          success: false,
          error: errorMessage,
          code: "PRODUCT_MEDIA_EXISTS",
        };
      }

      // ✅ P2002 مخصوص قید (productId, mediaId)
      if (isProductMediaUniqueViolation(e) && mediaAssetIdForConflict) {
        const conflict = await prisma.productMedia.findFirst({
          where: {
            productId: candidate.productId,
            mediaId: mediaAssetIdForConflict,
          },
        });

        if (conflict) {
          if (storagePath) {
            await safeCleanup(cleanupFn, storagePath, "P2002 conflict", {
              candidateId,
            });
          }
          await releaseClaim(candidateId, claimToken);
          return {
            success: false,
            error: `PRODUCT_MEDIA_EXISTS: این MediaAsset از قبل به این Product متصل است (productMediaId=${conflict.id})`,
            code: "PRODUCT_MEDIA_EXISTS",
          };
        }
      }

      // اگه MediaAsset reuse نشده بود، فایل جدید رو پاک کن
      if (storagePath && !reusedMediaAsset) {
        await safeCleanup(cleanupFn, storagePath, "DB_FAILED", {
          candidateId,
        });
      }
      await releaseClaim(candidateId, claimToken);

      return {
        success: false,
        error: errorMessage,
        code: "DB_FAILED",
      };
    }

    logger.info("[Approve] Candidate approved", {
      candidateId,
      mediaId,
      productMediaId,
      userId,
      reusedMediaAsset,
    });

    return {
      success: true,
      data: {
        success: true,
        mediaId,
        productMediaId,
        url: upload.publicUrl,
      },
    };
  } catch (e) {
    if (storagePath) {
      await safeCleanup(cleanupFn, storagePath, "unexpected error", {
        candidateId,
      });
    }
    await releaseClaim(candidateId, claimToken);

    logger.error("[Approve] Unexpected error", {
      candidateId,
      error: e instanceof Error ? e.message : String(e),
    });

    return {
      success: false,
      error: "خطای غیرمنتظره",
      code: "UNEXPECTED",
    };
  }
}

// ============================================================
// releaseClaim
// ============================================================

export async function releaseClaim(
  candidateId: string,
  claimToken: string
): Promise<void> {
  try {
    await prisma.mediaCandidate.updateMany({
      where: {
        id: candidateId,
        claimToken,
        status: { in: ["PENDING", "APPROVING"] },
      },
      data: {
        status: "PENDING",
        claimToken: null,
        claimExpiresAt: null,
      },
    });

    logger.info("[Approve] Claim released", { candidateId });
  } catch (e) {
    logger.error("[Approve] Release claim failed", {
      candidateId,
      error: e instanceof Error ? e.message : String(e),
    });
  }
}

// ============================================================
// releaseExpiredClaims
// ============================================================

export async function releaseExpiredClaims(): Promise<number> {
  const now = new Date();

  const result = await prisma.mediaCandidate.updateMany({
    where: {
      status: { in: ["PENDING", "APPROVING"] },
      claimExpiresAt: { lt: now },
      claimToken: { not: null },
    },
    data: {
      status: "PENDING",
      claimToken: null,
      claimExpiresAt: null,
    },
  });

  logger.info("[Approve] Expired claims released", { count: result.count });

  return result.count;
}

// ============================================================
// rejectCandidate
// ============================================================

export interface RejectResult {
  success: boolean;
  error?: string;
}

export async function rejectCandidate(
  input: RejectCandidateInput
): Promise<RejectResult> {
  const { candidateId, userId, reason } = input;

  const candidate = await prisma.mediaCandidate.findUnique({
    where: { id: candidateId },
  });

  if (!candidate) {
    return { success: false, error: "Candidate یافت نشد" };
  }

  if (candidate.status === "APPROVED") {
    return { success: false, error: "Candidate تأیید شده — قابل رد نیست" };
  }

  if (candidate.status === "APPROVING") {
    return {
      success: false,
      error: "Candidate در حال تأیید — ابتدا باید claim آزاد شود",
    };
  }

  await prisma.mediaCandidate.update({
    where: { id: candidateId },
    data: {
      status: "REJECTED",
      reviewedById: userId,
      reviewedAt: new Date(),
      rejectReason: reason ?? null,
      claimToken: null,
      claimExpiresAt: null,
    },
  });

  logger.info("[Approve] Candidate rejected", { candidateId, userId });

  return { success: true };
}

// ============================================================
// isCandidateClaimed
// ============================================================

export async function isCandidateClaimed(
  candidateId: string
): Promise<{ claimed: boolean; expiresAt: Date | null }> {
  const candidate = await prisma.mediaCandidate.findUnique({
    where: { id: candidateId },
    select: { claimToken: true, claimExpiresAt: true },
  });

  if (!candidate) {
    return { claimed: false, expiresAt: null };
  }

  const claimed =
    candidate.claimToken !== null &&
    !isClaimExpired(candidate.claimExpiresAt);

  return {
    claimed,
    expiresAt: candidate.claimExpiresAt,
  };
}