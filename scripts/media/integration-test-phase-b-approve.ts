// scripts/media/integration-test-phase-b-approve.ts
// تست‌های مسیر موفق approveCandidate + خطاها + رقابت
//
// ⚠️ این تست فقط روی DB موقت (Postgres Container) اجرا می‌شه.
// ⚠️ از mock برای Supabase Storage استفاده می‌کنه.
// ⚠️ هرگز روی production اجرا نکن.
//
// اجرا: npx tsx scripts/media/integration-test-phase-b-approve.ts

import { PrismaClient, MediaSource, Prisma } from "@prisma/client";
import {
  claimCandidate,
  approveCandidate,
  type ApproveDeps,
} from "../../src/features/media/services/approve-candidate-service";
import type { DownloadOutcome } from "../../src/features/media/lib/downloader";
import type {
  ImageValidationOutcome,
  AllowedMimeType,
} from "../../src/features/media/lib/image-validator";

const prisma = new PrismaClient();

// ============================================================
// ردیابی رکوردهای تست
// ============================================================
const testCandidateIds: string[] = [];
const testMediaAssetIds: string[] = [];
const testProductMediaIds: string[] = [];
const testVariantIds: string[] = [];
let testProductId: string | null = null;
let testVariantId: string | null = null;

// ============================================================
// Assert
// ============================================================
function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`ASSERTION FAILED: ${message}`);
  }
}

// ============================================================
// Helper: تشخیص P2002 مخصوص قید (productId, mediaId)
// (کپی از approve-candidate-service برای تست)
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
// Mock: SafeDownload
// ============================================================
function makeMockDownload(
  buffer: Buffer,
  contentType: string = "image/jpeg"
): ApproveDeps["download"] {
  return async (_url: string): Promise<DownloadOutcome> => ({
    success: true,
    buffer,
    contentType,
    finalUrl: _url,
    size: buffer.length,
  });
}

function makeFailingDownload(reason: string = "HTTP_404"): ApproveDeps["download"] {
  return async (): Promise<DownloadOutcome> => ({
    success: false,
    reason,
  });
}

// ============================================================
// Mock: Validate
// ============================================================
function makeMockValidate(
  checksum: string,
  mimeType: AllowedMimeType = "image/jpeg",
  size: number = 1024
): ApproveDeps["validate"] {
  return async (): Promise<ImageValidationOutcome> => ({
    valid: true,
    mimeType,
    width: 100,
    height: 100,
    checksum,
    size,
  });
}

function makeFailingValidate(reason: string = "DECODE_FAILED"): ApproveDeps["validate"] {
  return async (): Promise<ImageValidationOutcome> => ({
    valid: false,
    reason,
  });
}

// ============================================================
// Mock: Upload
// ============================================================
function makeMockUpload(
  publicUrl: string = "https://mock.test/storage/file.jpg"
): ApproveDeps["uploadToStorage"] {
  return async (candidateId: string) => ({
    storagePath: `candidates/${candidateId}/mock.jpg`,
    publicUrl,
  });
}

function makeFailingUpload(reason: string = "STORAGE_UPLOAD_FAILED"): ApproveDeps["uploadToStorage"] {
  return async () => {
    throw new Error(reason);
  };
}

// ============================================================
// Mock: Cleanup (tracking)
// ============================================================
function makeTrackedCleanup(): {
  cleanup: ApproveDeps["cleanupStorage"];
  tracked: string[];
} {
  const tracked: string[] = [];
  const cleanup = async (storagePath: string): Promise<void> => {
    tracked.push(storagePath);
  };
  return { cleanup, tracked };
}

function makeFailingCleanup(): {
  cleanup: ApproveDeps["cleanupStorage"];
  tracked: string[];
} {
  const tracked: string[] = [];
  const cleanup = async (storagePath: string): Promise<void> => {
    tracked.push(storagePath);
    throw new Error("CLEANUP_STORAGE_FAILED: mock failure");
  };
  return { cleanup, tracked };
}

// ============================================================
// Cleanup
// ============================================================
async function cleanup(): Promise<{ success: boolean; errors: string[] }> {
  const errors: string[] = [];

  console.log("\n════════════════════════════════════════");
  console.log("🧹 پاک‌سازی رکوردهای تست");
  console.log("════════════════════════════════════════");

  try {
    if (testProductMediaIds.length > 0) {
      const r = await prisma.productMedia.deleteMany({
        where: { id: { in: testProductMediaIds } },
      });
      console.log(`   ✅ ${r.count} ProductMedia حذف شد`);
    }
  } catch (e) {
    errors.push(`ProductMedia: ${e instanceof Error ? e.message : String(e)}`);
  }

  try {
    if (testMediaAssetIds.length > 0) {
      const r = await prisma.mediaAsset.deleteMany({
        where: { id: { in: testMediaAssetIds } },
      });
      console.log(`   ✅ ${r.count} MediaAsset حذف شد`);
    }
  } catch (e) {
    errors.push(`MediaAsset: ${e instanceof Error ? e.message : String(e)}`);
  }

  try {
    if (testCandidateIds.length > 0) {
      const r = await prisma.mediaCandidate.deleteMany({
        where: { id: { in: testCandidateIds } },
      });
      console.log(`   ✅ ${r.count} MediaCandidate حذف شد`);
    }
  } catch (e) {
    errors.push(`MediaCandidate: ${e instanceof Error ? e.message : String(e)}`);
  }

  try {
    if (testVariantIds.length > 0) {
      const r = await prisma.productVariant.deleteMany({
        where: { id: { in: testVariantIds } },
      });
      console.log(`   ✅ ${r.count} ProductVariant حذف شد`);
    }
  } catch (e) {
    errors.push(`ProductVariant: ${e instanceof Error ? e.message : String(e)}`);
  }

  try {
    if (testProductId) {
      await prisma.product.delete({ where: { id: testProductId } });
      console.log(`   ✅ Product تست حذف شد`);
    }
  } catch (e) {
    errors.push(`Product: ${e instanceof Error ? e.message : String(e)}`);
  }

  return { success: errors.length === 0, errors };
}

// ============================================================
// Helper: Candidate تست
// ============================================================
async function makeCandidate(opts?: {
  sourceUrl?: string;
  status?: "PENDING" | "APPROVING" | "APPROVED" | "REJECTED";
}): Promise<string> {
  const ts = Date.now() + Math.random();
  const url = opts?.sourceUrl ?? `https://test.example.com/pb-approve-${ts}.jpg`;
  const c = await prisma.mediaCandidate.create({
    data: {
      productId: testProductId!,
      source: MediaSource.OTHER,
      sourceUrl: url,
      previewUrl: url,
      status: opts?.status ?? "PENDING",
    },
  });
  testCandidateIds.push(c.id);
  return c.id;
}

// ============================================================
// Helper: track MediaAsset و ProductMedia
// ============================================================
async function trackProductMedia(pmId: string): Promise<void> {
  const pm = await prisma.productMedia.findUnique({
    where: { id: pmId },
    include: { media: true },
  });
  if (pm) {
    if (!testProductMediaIds.includes(pm.id)) {
      testProductMediaIds.push(pm.id);
    }
    if (!testMediaAssetIds.includes(pm.mediaId)) {
      testMediaAssetIds.push(pm.mediaId);
    }
  }
}

// ============================================================
// Test 1: approve موفق (مسیر کامل)
// ============================================================
async function testApprove1_success(): Promise<void> {
  console.log("════════════════════════════════════════");
  console.log("📌 Test 1: approve موفق (کامل)");
  console.log("════════════════════════════════════════");

  const candidateId = await makeCandidate();
  const claim = await claimCandidate({ candidateId, userId: "user-1" });
  assert(claim !== null, "claim باید موفق باشه");

  const buffer = Buffer.from("fake-image-data", "utf8");
  const checksum = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

  const deps: ApproveDeps = {
    download: makeMockDownload(buffer),
    validate: makeMockValidate(checksum),
    uploadToStorage: makeMockUpload("https://mock.test/img1.jpg"),
  };

  const result = await approveCandidate(
    {
      candidateId,
      claimToken: claim!.claimToken,
      userId: "user-1",
      variantId: testVariantId,
    },
    deps
  );

  assert(result.success === true, `approve باید موفق باشه: ${JSON.stringify(result)}`);

  const updated = await prisma.mediaCandidate.findUnique({ where: { id: candidateId } });
  assert(updated!.status === "APPROVED", "status باید APPROVED باشه");
  assert(updated!.claimToken === null, "claimToken باید null باشه");
  assert(updated!.claimExpiresAt === null, "claimExpiresAt باید null باشه");
  assert(updated!.reviewedById === "user-1", "reviewedById باید user-1 باشه");
  assert(updated!.reviewedAt !== null, "reviewedAt باید set باشه");

  const pm = await prisma.productMedia.findFirst({
    where: { productId: testProductId! },
    include: { media: true },
    orderBy: { createdAt: "desc" },
  });
  assert(pm !== null, "ProductMedia باید ساخته بشه");
  assert(pm!.status === "APPROVED", "ProductMedia.status باید APPROVED باشه");
  assert(pm!.approvedById === "user-1", "approvedById باید set باشه");
  assert(pm!.media.checksum === checksum, "MediaAsset.checksum باید match کنه");

  if (testVariantId) {
    assert(pm!.variantId === testVariantId, "variantId باید match کنه");
  }

  if (pm) {
    await trackProductMedia(pm.id);
  }

  assert(pm!.media.storagePath.includes("mock.jpg"), "storagePath باید mock.jpg باشه");
  assert(pm!.media.url === "https://mock.test/img1.jpg", "url باید match کنه");

  console.log(`   ✅ PASS: mediaId=${pm!.media.id}, claim پاک شد، variant متصل`);
}

// ============================================================
// Test 2: duplicate معمولی → PRODUCT_MEDIA_EXISTS
// ============================================================
async function testApprove2_reuseChecksum(): Promise<void> {
  console.log("════════════════════════════════════════");
  console.log("📌 Test 2: duplicate معمولی → PRODUCT_MEDIA_EXISTS");
  console.log("════════════════════════════════════════");

  const checksum = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
  const buffer = Buffer.from("fake-image-data", "utf8");

  // مرحله 1: approve موفق اول
  const c1 = await makeCandidate();
  const claim1 = await claimCandidate({ candidateId: c1, userId: "user-1" });
  const deps1: ApproveDeps = {
    download: makeMockDownload(buffer),
    validate: makeMockValidate(checksum),
    uploadToStorage: makeMockUpload("https://mock.test/img2-first.jpg"),
  };
  const r1 = await approveCandidate(
    { candidateId: c1, claimToken: claim1!.claimToken, userId: "user-1" },
    deps1
  );
  assert(r1.success === true, "approve 1 باید موفق باشه");

  const media1 = await prisma.mediaAsset.findFirst({ where: { checksum } });
  assert(media1 !== null, "MediaAsset 1 باید ساخته بشه");

  const pm1 = await prisma.productMedia.findFirst({
    where: { productId: testProductId!, mediaId: media1!.id },
  });
  assert(pm1 !== null, "ProductMedia 1 باید ساخته بشه");
  await trackProductMedia(pm1!.id);

  const media1Url = media1!.url;

  // مرحله 2: approve 2 با checksum یکسان
  const c2 = await makeCandidate();
  const claim2 = await claimCandidate({ candidateId: c2, userId: "user-1" });
  const deps2: ApproveDeps = {
    download: makeMockDownload(buffer),
    validate: makeMockValidate(checksum),
    uploadToStorage: makeMockUpload("https://mock.test/img2-second.jpg"),
  };
  const r2 = await approveCandidate(
    { candidateId: c2, claimToken: claim2!.claimToken, userId: "user-1" },
    deps2
  );

  assert(r2.success === false, `approve 2 باید fail بشه: ${JSON.stringify(r2)}`);
  if (!r2.success) {
    assert(
      r2.code === "PRODUCT_MEDIA_EXISTS",
      `code باید PRODUCT_MEDIA_EXISTS باشه، الان ${r2.code}`
    );
  }

  // بررسی: MediaAsset 1 دست‌نخورده
  const media1After = await prisma.mediaAsset.findUnique({ where: { id: media1!.id } });
  assert(media1After !== null, "MediaAsset 1 باید هنوز باشه");
  assert(media1After!.url === media1Url, "URL MediaAsset 1 نباید تغییر کنه");

  // بررسی: فقط 1 MediaAsset با این checksum
  const maCount = await prisma.mediaAsset.count({ where: { checksum } });
  assert(maCount === 1, `فقط 1 MediaAsset باید باشه، الان ${maCount}`);

  // بررسی: فقط 1 ProductMedia
  const pmCount = await prisma.productMedia.count({
    where: { productId: testProductId!, mediaId: media1!.id },
  });
  assert(pmCount === 1, `فقط 1 ProductMedia باید باشه، الان ${pmCount}`);

  // بررسی: candidate 2 برگشت به PENDING
  const c2After = await prisma.mediaCandidate.findUnique({ where: { id: c2 } });
  assert(c2After!.status === "PENDING", "status candidate 2 باید PENDING باشه");
  assert(c2After!.claimToken === null, "claimToken candidate 2 باید null باشه");

  console.log(`   ✅ PASS: PRODUCT_MEDIA_EXISTS برگشت، MediaAsset حفظ شد`);
}

// ============================================================
// Test 3: دانلود ناموفق → release claim
// ============================================================
async function testApprove3_downloadFail(): Promise<void> {
  console.log("════════════════════════════════════════");
  console.log("📌 Test 3: دانلود ناموفق");
  console.log("════════════════════════════════════════");

  const candidateId = await makeCandidate();
  const claim = await claimCandidate({ candidateId, userId: "user-1" });

  const deps: ApproveDeps = {
    download: makeFailingDownload("HTTP_500"),
  };

  const result = await approveCandidate(
    { candidateId, claimToken: claim!.claimToken, userId: "user-1" },
    deps
  );

  assert(result.success === false, "approve باید fail بشه");
  if (!result.success) {
    assert(result.code === "DOWNLOAD_FAILED", `code باید DOWNLOAD_FAILED باشه، الان ${result.code}`);
  }

  const updated = await prisma.mediaCandidate.findUnique({ where: { id: candidateId } });
  assert(updated!.status === "PENDING", "status باید PENDING باشه");
  assert(updated!.claimToken === null, "claimToken باید null باشه");
  assert(updated!.claimExpiresAt === null, "claimExpiresAt باید null باشه");

  console.log(`   ✅ PASS: claim پاک شد`);
}

// ============================================================
// Test 4: اعتبارسنجی ناموفق → release claim
// ============================================================
async function testApprove4_validationFail(): Promise<void> {
  console.log("════════════════════════════════════════");
  console.log("📌 Test 4: اعتبارسنجی ناموفق");
  console.log("════════════════════════════════════════");

  const candidateId = await makeCandidate();
  const claim = await claimCandidate({ candidateId, userId: "user-1" });

  const buffer = Buffer.from("not-an-image", "utf8");
  const deps: ApproveDeps = {
    download: makeMockDownload(buffer),
    validate: makeFailingValidate("UNKNOWN_MIME_TYPE"),
  };

  const result = await approveCandidate(
    { candidateId, claimToken: claim!.claimToken, userId: "user-1" },
    deps
  );

  assert(result.success === false, "approve باید fail بشه");
  if (!result.success) {
    assert(result.code === "VALIDATION_FAILED", `code باید VALIDATION_FAILED باشه، الان ${result.code}`);
  }

  const updated = await prisma.mediaCandidate.findUnique({ where: { id: candidateId } });
  assert(updated!.status === "PENDING", "status باید PENDING باشه");
  assert(updated!.claimToken === null, "claimToken باید null باشه");

  console.log(`   ✅ PASS: claim پاک شد`);
}

// ============================================================
// Test 5: Storage ناموفق → release claim
// ============================================================
async function testApprove5_storageFail(): Promise<void> {
  console.log("════════════════════════════════════════");
  console.log("📌 Test 5: Storage ناموفق");
  console.log("════════════════════════════════════════");

  const candidateId = await makeCandidate();
  const claim = await claimCandidate({ candidateId, userId: "user-1" });

  const buffer = Buffer.from("fake-image-data", "utf8");
  const checksum = "cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc";

  const deps: ApproveDeps = {
    download: makeMockDownload(buffer),
    validate: makeMockValidate(checksum),
    uploadToStorage: makeFailingUpload("STORAGE_TIMEOUT"),
  };

  const result = await approveCandidate(
    { candidateId, claimToken: claim!.claimToken, userId: "user-1" },
    deps
  );

  assert(result.success === false, "approve باید fail بشه");
  if (!result.success) {
    assert(result.code === "STORAGE_FAILED", `code باید STORAGE_FAILED باشه، الان ${result.code}`);
  }

  const updated = await prisma.mediaCandidate.findUnique({ where: { id: candidateId } });
  assert(updated!.status === "PENDING", "status باید PENDING باشه");
  assert(updated!.claimToken === null, "claimToken باید null باشه");

  const ma = await prisma.mediaAsset.findFirst({ where: { checksum } });
  assert(ma === null, "MediaAsset نباید ساخته بشه");

  console.log(`   ✅ PASS: claim پاک شد، MediaAsset ساخته نشد`);
}

// ============================================================
// Test 6: دو approve هم‌زمان (race condition)
// ============================================================
async function testApprove6_concurrent(): Promise<void> {
  console.log("════════════════════════════════════════");
  console.log("📌 Test 6: دو approve هم‌زمان (race condition)");
  console.log("════════════════════════════════════════");

  const candidateId = await makeCandidate();
  const claim = await claimCandidate({ candidateId, userId: "user-1" });

  const buffer = Buffer.from("fake-image-data", "utf8");
  const checksum = "dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd";

  const pmCountBefore = await prisma.productMedia.count({
    where: { productId: testProductId! },
  });

  const deps: ApproveDeps = {
    download: makeMockDownload(buffer),
    validate: makeMockValidate(checksum),
    uploadToStorage: makeMockUpload("https://mock.test/img6.jpg"),
  };

  const [r1, r2] = await Promise.all([
    approveCandidate({ candidateId, claimToken: claim!.claimToken, userId: "user-1" }, deps),
    approveCandidate({ candidateId, claimToken: claim!.claimToken, userId: "user-2" }, deps),
  ]);

  const successCount = [r1, r2].filter((r) => r.success).length;
  assert(successCount === 1, `فقط 1 approve باید موفق باشه، الان ${successCount}`);

  const pmCountAfter = await prisma.productMedia.count({
    where: { productId: testProductId! },
  });
  assert(pmCountAfter === pmCountBefore + 1, `فقط 1 ProductMedia: before=${pmCountBefore}, after=${pmCountAfter}`);

  const maCount = await prisma.mediaAsset.count({ where: { checksum } });
  assert(maCount === 1, `فقط 1 MediaAsset: ${maCount}`);

  const pm = await prisma.productMedia.findFirst({
    where: { productId: testProductId! },
    orderBy: { createdAt: "desc" },
  });
  if (pm) {
    await trackProductMedia(pm.id);
  }

  console.log(`   ✅ PASS: فقط 1 approve موفق، فقط 1 ProductMedia`);
}

// ============================================================
// Test 7: status نامعتبر (REJECTED)
// ============================================================
async function testApprove7_invalidStatus(): Promise<void> {
  console.log("════════════════════════════════════════");
  console.log("📌 Test 7: approve روی status=REJECTED");
  console.log("════════════════════════════════════════");

  const candidateId = await makeCandidate({ status: "REJECTED" });

  const result = await approveCandidate(
    { candidateId, claimToken: "0".repeat(64), userId: "user-1" }
  );

  assert(result.success === false, "approve باید fail بشه");
  if (!result.success) {
    assert(result.code === "INVALID_STATUS", `code باید INVALID_STATUS باشه، الان ${result.code}`);
  }

  console.log(`   ✅ PASS: status نامعتبر رد شد`);
}

// ============================================================
// Test 8: محافظت از فایل reuse شده در DB fail
// ============================================================
async function testApprove8_protectReused(): Promise<void> {
  console.log("════════════════════════════════════════");
  console.log("📌 Test 8: محافظت از فایل reuse شده در DB fail");
  console.log("════════════════════════════════════════");

  const checksum = "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
  const buffer = Buffer.from("fake-image-data", "utf8");

  // مرحله 1: approve موفق اول
  const c1 = await makeCandidate();
  const claim1 = await claimCandidate({ candidateId: c1, userId: "user-1" });
  const deps1: ApproveDeps = {
    download: makeMockDownload(buffer),
    validate: makeMockValidate(checksum),
    uploadToStorage: makeMockUpload("https://mock.test/img8-first.jpg"),
  };
  const r1 = await approveCandidate(
    { candidateId: c1, claimToken: claim1!.claimToken, userId: "user-1" },
    deps1
  );
  assert(r1.success === true, "approve 1 باید موفق باشه");

  const media1 = await prisma.mediaAsset.findFirst({ where: { checksum } });
  assert(media1 !== null, "MediaAsset باید ساخته بشه");

  const pm1 = await prisma.productMedia.findFirst({
    where: { productId: testProductId!, mediaId: media1!.id },
  });
  await trackProductMedia(pm1!.id);

  const media1Url = media1!.url;

  // مرحله 2: approve 2 با variantId نامعتبر
  const c2 = await makeCandidate();
  const claim2 = await claimCandidate({ candidateId: c2, userId: "user-1" });

  const { cleanup, tracked } = makeTrackedCleanup();
  const deps2: ApproveDeps = {
    download: makeMockDownload(buffer),
    validate: makeMockValidate(checksum),
    uploadToStorage: makeMockUpload("https://mock.test/img8-second.jpg"),
    cleanupStorage: cleanup,
  };

  const r2 = await approveCandidate(
    {
      candidateId: c2,
      claimToken: claim2!.claimToken,
      userId: "user-1",
      variantId: "00000000-0000-0000-0000-000000000000",
    },
    deps2
  );

  assert(r2.success === false, "approve 2 باید fail بشه");

  // بررسی: MediaAsset 1 دست‌نخورده
  const media1After = await prisma.mediaAsset.findUnique({ where: { id: media1!.id } });
  assert(media1After !== null, "MediaAsset 1 باید هنوز باشه");
  assert(media1After!.url === media1Url, "URL اصلی باید حفظ بشه");
  assert(media1After!.checksum === checksum, "checksum باید حفظ بشه");

  console.log(`   ✅ PASS: MediaAsset اصلی حفظ شد، tracked=${tracked.length}`);
}

// ============================================================
// Test A: P2002 نامرتبط → نباید PRODUCT_MEDIA_EXISTS بشه
// ============================================================
async function testA_unrelatedP2002(): Promise<void> {
  console.log("════════════════════════════════════════");
  console.log("📌 Test A: P2002 نامرتبط (قید دیگه)");
  console.log("════════════════════════════════════════");

  // مرحله 1: یه ProductVariant با (productId, slug) بساز
  const slug1 = `variant-a-${Date.now()}`;
  const variant1 = await prisma.productVariant.create({
    data: {
      productId: testProductId!,
      slug: slug1,
      sku: `SKU-A-${Date.now()}`,
      price: 1000000,
    },
  });
  testVariantIds.push(variant1.id);

  // مرحله 2: تلاش برای ساخت ProductVariant دیگه با همون (productId, slug)
  let caughtError: unknown = null;
  try {
    await prisma.productVariant.create({
      data: {
        productId: testProductId!,
        slug: slug1,  // ← تکراری
        sku: `SKU-A2-${Date.now()}`,
        price: 1000000,
      },
    });
  } catch (e) {
    caughtError = e;
  }

  assert(caughtError !== null, "باید خطای P2002 رخ بده");

  // مرحله 3: بررسی خطا
  if (caughtError instanceof Prisma.PrismaClientKnownRequestError) {
    assert(caughtError.code === "P2002", `code باید P2002 باشه، الان ${caughtError.code}`);

    // ❌ تشخیص باید false باشه (چون قید (productId, slug) هست، نه (productId, mediaId))
    const isProductMediaViolation = isProductMediaUniqueViolation(caughtError);
    assert(
      isProductMediaViolation === false,
      `isProductMediaUniqueViolation باید false باشه، الان ${isProductMediaViolation}`
    );

    console.log(`   ℹ️  meta.target = ${JSON.stringify(caughtError.meta?.target)}`);
  } else {
    assert(false, `caughtError باید PrismaClientKnownRequestError باشه، الان ${caughtError}`);
  }

  console.log(`   ✅ PASS: P2002 نامرتبط تشخیص داده نشد`);
}

// ============================================================
// Test B: بازیابی پس از rollback (P2002 قید هدف)
// ============================================================
// سناریو:
//   - ProductMedia از قبل با (productId, mediaId) موجود باشه
//   - approveCandidate با checksum یکسان → findFirst پیدا می‌کنه
//   - PRODUCT_MEDIA_EXISTS کنترل‌شده (نه P2002)
//   - بررسی: query مجدد (اگه P2002 اتفاق بیفته) خارج از transaction
// ============================================================
async function testB_recoveryAfterRollback(): Promise<void> {
  console.log("════════════════════════════════════════");
  console.log("📌 Test B: بازیابی پس از rollback");
  console.log("════════════════════════════════════════");

  const checksum = "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
  const buffer = Buffer.from("fake-image-data", "utf8");

  // مرحله 1: MediaAsset + ProductMedia از قبل بساز
  const mediaAsset = await prisma.mediaAsset.create({
    data: {
      url: "https://mock.test/test-b.jpg",
      storagePath: "test/test-b.jpg",
      filename: "test-b.jpg",
      mimeType: "image/jpeg",
      size: 100,
      checksum,
    },
  });
  testMediaAssetIds.push(mediaAsset.id);

  const existingPm = await prisma.productMedia.create({
    data: {
      productId: testProductId!,
      mediaId: mediaAsset.id,
      status: "APPROVED",
    },
  });
  testProductMediaIds.push(existingPm.id);

  // مرحله 2: candidate جدید با همون checksum
  const c1 = await makeCandidate();
  const claim1 = await claimCandidate({ candidateId: c1, userId: "user-1" });

  const deps: ApproveDeps = {
    download: makeMockDownload(buffer),
    validate: makeMockValidate(checksum),
    uploadToStorage: makeMockUpload("https://mock.test/test-b-new.jpg"),
  };

  // مرحله 3: approveCandidate → انتظار PRODUCT_MEDIA_EXISTS
  const result = await approveCandidate(
    { candidateId: c1, claimToken: claim1!.claimToken, userId: "user-1" },
    deps
  );

  assert(result.success === false, "approve باید fail بشه");
  if (!result.success) {
    assert(
      result.code === "PRODUCT_MEDIA_EXISTS",
      `code باید PRODUCT_MEDIA_EXISTS باشه، الان ${result.code}`
    );
  }

  // مرحله 4: بررسی ProductMedia اصلی دست‌نخورده
  const pmAfter = await prisma.productMedia.findUnique({
    where: { id: existingPm.id },
  });
  assert(pmAfter !== null, "ProductMedia اصلی باید حفظ بشه");
  assert(pmAfter!.mediaId === mediaAsset.id, "mediaId باید حفظ بشه");

  // مرحله 5: بررسی candidate برگشت به PENDING
  const c1After = await prisma.mediaCandidate.findUnique({ where: { id: c1 } });
  assert(c1After!.status === "PENDING", "status باید PENDING باشه");
  assert(c1After!.claimToken === null, "claimToken باید null باشه");

  console.log(`   ✅ PASS: PRODUCT_MEDIA_EXISTS برگشت، رکورد اصلی حفظ شد`);
}

// ============================================================
// Test C: شکست cleanup → خطای اصلی حفظ بشه
// ============================================================
async function testC_cleanupFailure(): Promise<void> {
  console.log("════════════════════════════════════════");
  console.log("📌 Test C: شکست cleanup");
  console.log("════════════════════════════════════════");

  const checksum = "1111111111111111111111111111111111111111111111111111111111111111";
  const buffer = Buffer.from("fake-image-data", "utf8");

  // مرحله 1: MediaAsset + ProductMedia از قبل
  const mediaAsset = await prisma.mediaAsset.create({
    data: {
      url: "https://mock.test/test-c.jpg",
      storagePath: "test/test-c.jpg",
      filename: "test-c.jpg",
      mimeType: "image/jpeg",
      size: 100,
      checksum,
    },
  });
  testMediaAssetIds.push(mediaAsset.id);

  const existingPm = await prisma.productMedia.create({
    data: {
      productId: testProductId!,
      mediaId: mediaAsset.id,
      status: "APPROVED",
    },
  });
  testProductMediaIds.push(existingPm.id);

  // مرحله 2: candidate
  const c1 = await makeCandidate();
  const claim1 = await claimCandidate({ candidateId: c1, userId: "user-1" });

  const { cleanup, tracked } = makeFailingCleanup();
  const deps: ApproveDeps = {
    download: makeMockDownload(buffer),
    validate: makeMockValidate(checksum),
    uploadToStorage: makeMockUpload("https://mock.test/test-c-new.jpg"),
    cleanupStorage: cleanup,
  };

  // مرحله 3: approveCandidate → PRODUCT_MEDIA_EXISTS
  const result = await approveCandidate(
    { candidateId: c1, claimToken: claim1!.claimToken, userId: "user-1" },
    deps
  );

  // ✅ بررسی 1: خطای اصلی حفظ بشه
  assert(result.success === false, "approve باید fail بشه");
  if (!result.success) {
    assert(
      result.code === "PRODUCT_MEDIA_EXISTS",
      `code باید PRODUCT_MEDIA_EXISTS باشه، الان ${result.code}`
    );
  }

  // ✅ بررسی 2: cleanup صدا زده شده
  assert(tracked.length > 0, `cleanup باید صدا زده بشه، الان ${tracked.length}`);

  // ✅ بررسی 3: claim آزاد شده
  const c1After = await prisma.mediaCandidate.findUnique({ where: { id: c1 } });
  assert(c1After!.status === "PENDING", "status باید PENDING باشه");
  assert(c1After!.claimToken === null, "claimToken باید null باشه");

  console.log(`   ✅ PASS: خطای اصلی حفظ شد، cleanup fail شد ولی خطا پنهان نشد`);
}

// ============================================================
// Test D: تشخیص واقعی P2002 (diagnostic)
// ============================================================
async function testD_diagnoseP2002Shape(): Promise<void> {
  console.log("════════════════════════════════════════");
  console.log("📌 Test D: تشخیص واقعی P2002 (diagnostic)");
  console.log("════════════════════════════════════════");

  // مرحله 1: MediaAsset بساز
  const checksum = "2222222222222222222222222222222222222222222222222222222222222222";
  const mediaAsset = await prisma.mediaAsset.create({
    data: {
      url: "https://mock.test/test-d.jpg",
      storagePath: "test/test-d.jpg",
      filename: "test-d.jpg",
      mimeType: "image/jpeg",
      size: 100,
      checksum,
    },
  });
  testMediaAssetIds.push(mediaAsset.id);

  // مرحله 2: ProductMedia اول
  const pm1 = await prisma.productMedia.create({
    data: {
      productId: testProductId!,
      mediaId: mediaAsset.id,
      status: "APPROVED",
    },
  });
  testProductMediaIds.push(pm1.id);

  // مرحله 3: تلاش برای create تکراری (productId, mediaId)
  let caughtError: unknown = null;
  try {
    await prisma.productMedia.create({
      data: {
        productId: testProductId!,
        mediaId: mediaAsset.id,
        status: "APPROVED",
      },
    });
  } catch (e) {
    caughtError = e;
  }

  assert(caughtError !== null, "باید خطای P2002 رخ بده");

  // مرحله 4: لاگ اطلاعات تشخیصی
  if (caughtError instanceof Prisma.PrismaClientKnownRequestError) {
    console.log(`   ℹ️  Diagnostic P2002:`);
    console.log(`      code: ${caughtError.code}`);
    console.log(`      meta.modelName: ${caughtError.meta?.modelName}`);
    console.log(`      meta.target: ${JSON.stringify(caughtError.meta?.target)}`);
    console.log(`      meta.target (type): ${typeof caughtError.meta?.target}`);
    if (Array.isArray(caughtError.meta?.target)) {
      console.log(`      meta.target (array): [${caughtError.meta.target.join(", ")}]`);
    }
    if (caughtError.meta?.constraint) {
      console.log(`      meta.constraint: ${caughtError.meta.constraint}`);
    }

    // ✅ بررسی: تشخیص باید true باشه
    const detected = isProductMediaUniqueViolation(caughtError);
    console.log(`      isProductMediaUniqueViolation: ${detected}`);
    assert(detected === true, "تشخیص باید true باشه برای قید (productId, mediaId)");
  } else {
    assert(false, "caughtError باید PrismaClientKnownRequestError باشه");
  }

  console.log(`   ✅ PASS: P2002 تشخیص داده شد`);
}

// ============================================================
// Main
// ============================================================
async function main(): Promise<void> {
  console.log("════════════════════════════════════════");
  console.log("🧪 Integration Test — Phase B (approve)");
  console.log("════════════════════════════════════════");

  let testFailed = false;
  let failureMessage = "";

  try {
    // Setup: Product تست
    console.log("📦 Setup: ساخت Product + Variant تست");
    const product = await prisma.product.create({
      data: {
        slug: `pb-approve-test-${Date.now()}`,
        title: "Test Product — Phase B approve",
        price: 1000000,
      },
    });
    testProductId = product.id;
    console.log(`   ✅ Product: ${product.id}`);

    const variant = await prisma.productVariant.create({
      data: {
        productId: product.id,
        slug: `variant-${Date.now()}`,
        sku: `SKU-${Date.now()}`,
        price: 1000000,
      },
    });
    testVariantId = variant.id;
    testVariantIds.push(variant.id);
    console.log(`   ✅ Variant: ${variant.id}\n`);

    await testApprove1_success();
    await testApprove2_reuseChecksum();
    await testApprove3_downloadFail();
    await testApprove4_validationFail();
    await testApprove5_storageFail();
    await testApprove6_concurrent();
    await testApprove7_invalidStatus();
    await testApprove8_protectReused();
    await testA_unrelatedP2002();
    await testB_recoveryAfterRollback();
    await testC_cleanupFailure();
    await testD_diagnoseP2002Shape();

  } catch (error) {
    testFailed = true;
    failureMessage = error instanceof Error ? error.message : String(error);
    console.error("\n════════════════════════════════════════");
    console.error("❌ TEST FAILED");
    console.error("════════════════════════════════════════");
    console.error(`\n${failureMessage}\n`);
  }

  const cleanupResult = await cleanup();
  await prisma.$disconnect();

  if (testFailed) {
    console.error("════════════════════════════════════════");
    console.error("❌ FAILED");
    console.error("════════════════════════════════════════");
    process.exit(1);
  }

  if (!cleanupResult.success) {
    console.error("⚠️  تست‌ها موفق ولی cleanup کامل نشد");
    cleanupResult.errors.forEach((e) => console.error(`   - ${e}`));
    process.exit(2);
  }

  console.log("════════════════════════════════════════");
  console.log("🎉 All approve tests passed!");
  console.log("════════════════════════════════════════");
  process.exit(0);
}

main().catch((e) => {
  console.error("❌ Fatal:", e);
  process.exit(1);
});