// src/features/media/services/candidate-service.ts
// ⚠️ Server-only: مدیریت MediaCandidate در DB
//
// ⚠️ نکته مهم: Duplicate check فعلی، قبل از insert انجام می‌شه.
//    این روش در برابر دو درخواست هم‌زمان (race condition) تضمین کامل نمی‌ده.
//    در آینده ممکنه یه migration جداگانه برای unique constraint اضافه کنیم.
//    راه‌حل‌های ممکن:
//      - @@unique([productId, source, sourceUrlHash])
//      - یا transaction با isolation level SERIALIZABLE
//      - یا INSERT ... ON CONFLICT DO NOTHING
//    فعلاً به‌عنوان known limitation پذیرفته شده.

import "server-only";

import { MediaSource, Prisma } from "@prisma/client";
import { prisma } from "@/lib/server/prisma";
import { logger } from "@/lib/logger";
import type { NormalizedSearchResult } from "../types";

// ============================================================
// مقادیر معتبر MediaSource
// ============================================================
const VALID_SOURCES: readonly MediaSource[] = [
  MediaSource.MANUAL_UPLOAD,
  MediaSource.ICECAT,
  MediaSource.PIXABAY,
  MediaSource.OPENVERSE,
  MediaSource.PEXELS,
  MediaSource.UNSPLASH,
  MediaSource.SUPPLIER,
  MediaSource.OTHER,
] as const;

function isValidSource(value: unknown): value is MediaSource {
  return (
    typeof value === "string" &&
    VALID_SOURCES.includes(value as MediaSource)
  );
}

// ============================================================
// ورودی createCandidate
// ============================================================
export interface CreateCandidateInput {
  productId: string;
  source: MediaSource;
  sourceId?: string;
  sourceUrl: string;
  previewUrl: string;
  downloadUrl?: string;
  title?: string;
  creator?: string;
  licenseType?: string;
  licenseUrl?: string;
  attribution?: string;
  width?: number;
  height?: number;
  relevanceScore?: number;
  metadata?: Prisma.InputJsonValue;
}

// ============================================================
// خروجی
// ============================================================
export interface CandidateResult {
  id: string;
  productId: string;
  source: string;
  sourceUrl: string;
  previewUrl: string;
  status: string;
  createdAt: Date;
  isNew: boolean;
}

// ============================================================
// Validation
// ============================================================
const MAX_URL_LENGTH = 4096;

function validateInput(input: CreateCandidateInput): string | null {
  if (!input.productId || typeof input.productId !== "string") {
    return "productId نامعتبر است";
  }
  if (!isValidSource(input.source)) {
    return `source نامعتبر است: ${String(input.source)}`;
  }
  if (!input.sourceUrl || typeof input.sourceUrl !== "string") {
    return "sourceUrl نامعتبر است";
  }
  if (input.sourceUrl.length > MAX_URL_LENGTH) {
    return "sourceUrl بیش از حد طولانی است";
  }
  if (!input.previewUrl || typeof input.previewUrl !== "string") {
    return "previewUrl نامعتبر است";
  }
  if (input.previewUrl.length > MAX_URL_LENGTH) {
    return "previewUrl بیش از حد طولانی است";
  }
  if (input.downloadUrl && input.downloadUrl.length > MAX_URL_LENGTH) {
    return "downloadUrl بیش از حد طولانی است";
  }
  if (input.metadata !== undefined) {
    try {
      JSON.stringify(input.metadata);
    } catch {
      return "metadata قابل سریالایز نیست";
    }
  }
  return null;
}

// ============================================================
// createCandidate
// ============================================================
export async function createCandidate(
  input: CreateCandidateInput
): Promise<CandidateResult> {
  // ۱. Validation
  const validationError = validateInput(input);
  if (validationError) {
    throw new Error(`INVALID_INPUT: ${validationError}`);
  }

  // ۲. Duplicate check
  const existing = await prisma.mediaCandidate.findFirst({
    where: {
      productId: input.productId,
      source: input.source,
      sourceUrl: input.sourceUrl,
    },
    select: {
      id: true,
      productId: true,
      source: true,
      sourceUrl: true,
      previewUrl: true,
      status: true,
      createdAt: true,
    },
  });

  if (existing) {
    logger.info("[Candidate] Duplicate found", {
      candidateId: existing.id,
      productId: input.productId,
    });

    return {
      id: existing.id,
      productId: existing.productId,
      source: existing.source,
      sourceUrl: existing.sourceUrl,
      previewUrl: existing.previewUrl,
      status: existing.status,
      createdAt: existing.createdAt,
      isNew: false,
    };
  }

  // ۳. Create
  const createData: Prisma.MediaCandidateUncheckedCreateInput = {
    productId: input.productId,
    source: input.source,
    sourceId: input.sourceId ?? null,
    sourceUrl: input.sourceUrl,
    previewUrl: input.previewUrl,
    downloadUrl: input.downloadUrl ?? null,
    title: input.title ?? null,
    creator: input.creator ?? null,
    licenseType: input.licenseType ?? null,
    licenseUrl: input.licenseUrl ?? null,
    attribution: input.attribution ?? null,
    width: input.width ?? null,
    height: input.height ?? null,
    relevanceScore: input.relevanceScore ?? null,
    metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
    status: "PENDING",
  };

  const created = await prisma.mediaCandidate.create({
    data: createData,
    select: {
      id: true,
      productId: true,
      source: true,
      sourceUrl: true,
      previewUrl: true,
      status: true,
      createdAt: true,
    },
  });

  logger.info("[Candidate] Created", {
    candidateId: created.id,
    productId: input.productId,
    source: input.source,
  });

  return {
    id: created.id,
    productId: created.productId,
    source: created.source,
    sourceUrl: created.sourceUrl,
    previewUrl: created.previewUrl,
    status: created.status,
    createdAt: created.createdAt,
    isNew: true,
  };
}

// ============================================================
// createCandidates — bulk
// ============================================================
export interface CreateCandidatesResult {
  created: CandidateResult[];
  duplicates: CandidateResult[];
  errors: Array<{ input: CreateCandidateInput; error: string }>;
}

export async function createCandidates(
  inputs: CreateCandidateInput[]
): Promise<CreateCandidatesResult> {
  const created: CandidateResult[] = [];
  const duplicates: CandidateResult[] = [];
  const errors: Array<{ input: CreateCandidateInput; error: string }> = [];

  for (const input of inputs) {
    try {
      const result = await createCandidate(input);
      if (result.isNew) {
        created.push(result);
      } else {
        duplicates.push(result);
      }
    } catch (error) {
      errors.push({
        input,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return { created, duplicates, errors };
}

// ============================================================
// Helper: تبدیل NormalizedSearchResult → CreateCandidateInput
// ============================================================
export function toCreateCandidateInput(
  result: NormalizedSearchResult,
  productId: string
): CreateCandidateInput {
  // ساخت metadata امن (قابل JSON.stringify)
  const metadataBase: Record<string, Prisma.InputJsonValue> = {
    provider: result.providerSlug,
    providerName: result.providerName,
  };

  // اضافه کردن raw فقط اگه سبک باشه
  if (result.raw && Object.keys(result.raw).length > 0) {
    try {
      const serialized = JSON.stringify(result.raw);
      if (serialized.length < 5000) {
        metadataBase.raw = result.raw as Prisma.InputJsonValue;
      }
    } catch {
      // اگه سریالایز نشد، نادیده بگیر
    }
  }

  return {
    productId,
    source: MediaSource.OTHER,
    sourceId: result.sourceId,
    sourceUrl: result.sourceUrl,
    previewUrl: result.previewUrl,
    downloadUrl: result.downloadUrl,
    title: result.title,
    creator: result.creator,
    licenseType: result.license?.type,
    licenseUrl: result.license?.url,
    attribution: result.license?.attribution,
    width: result.width,
    height: result.height,
    relevanceScore: result.relevanceHint,
    metadata: metadataBase,
  };
}

// ============================================================
// Query helpers
// ============================================================
export async function getCandidateById(id: string) {
  return prisma.mediaCandidate.findUnique({
    where: { id },
  });
}

export async function getCandidatesForProduct(
  productId: string,
  status?: "PENDING" | "APPROVED" | "REJECTED"
) {
  return prisma.mediaCandidate.findMany({
    where: {
      productId,
      ...(status ? { status } : {}),
    },
    orderBy: { createdAt: "desc" },
  });
}