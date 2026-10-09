// scripts/media/integration-test.ts
// تست یکپارچه واقعی Stage 3A با Prisma Client
//
// ⚠️ این تست فقط روی DB موقت (Postgres Container) اجرا می‌شه.
// ⚠️ هرگز روی production اجرا نکن.
//
// اجرا: npx tsx scripts/media/integration-test.ts

import { PrismaClient, MediaSource } from "@prisma/client";
import {
  createCandidate,
  createCandidates,
  getCandidateById,
  getCandidatesForProduct,
} from "../../src/features/media/services/candidate-service";

const prisma = new PrismaClient();

// ============================================================
// ردیابی رکوردهای تست
// ============================================================
const testCandidateIds: string[] = [];
let testProductId: string | null = null;

// ============================================================
// Helper: Assert
// ============================================================
function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`ASSERTION FAILED: ${message}`);
  }
}

// ============================================================
// Helper: Deep Equality (ترتیب کلیدها مهم نیست)
// ============================================================
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null) return a === b;
  if (typeof a !== typeof b) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((val, i) => deepEqual(val, b[i]));
  }

  if (typeof a === "object" && typeof b === "object") {
    const aObj = a as Record<string, unknown>;
    const bObj = b as Record<string, unknown>;
    const aKeys = Object.keys(aObj).sort();
    const bKeys = Object.keys(bObj).sort();
    if (aKeys.length !== bKeys.length) return false;
    if (aKeys.join(",") !== bKeys.join(",")) return false;
    return aKeys.every((key) => deepEqual(aObj[key], bObj[key]));
  }

  return false;
}

// ============================================================
// Cleanup
// ============================================================
async function cleanup(): Promise<{ success: boolean; errors: string[] }> {
  const errors: string[] = [];

  console.log("\n═══════════════════════════════════");
  console.log("🧹 پاک‌سازی رکوردهای تست");
  console.log("═══════════════════════════════════\n");

  try {
    if (testCandidateIds.length > 0) {
      const result = await prisma.mediaCandidate.deleteMany({
        where: { id: { in: testCandidateIds } },
      });
      console.log(`   ✅ ${result.count} candidate حذف شد`);
    } else {
      console.log("   ℹ️  هیچ candidate‌ای برای حذف نبود");
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    errors.push(`Candidate cleanup: ${msg}`);
    console.error(`   ❌ خطا در حذف candidateها: ${msg}`);
  }

  try {
    if (testProductId) {
      await prisma.product.delete({
        where: { id: testProductId },
      });
      console.log(`   ✅ Product تست حذف شد`);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    errors.push(`Product cleanup: ${msg}`);
    console.error(`   ❌ خطا در حذف product: ${msg}`);
  }

  return { success: errors.length === 0, errors };
}

// ============================================================
// Main
// ============================================================
async function main(): Promise<void> {
  console.log("═══════════════════════════════════");
  console.log("🧪 Integration Test — Stage 3A");
  console.log("═══════════════════════════════════\n");

  let testFailed = false;
  let failureMessage = "";

  try {
    // ────────────────────────────────
    // Setup: ساخت Product تست
    // ────────────────────────────────
    console.log("📝 Setup: ساخت Product تست\n");
    const testSlug = `test-product-${Date.now()}`;
    const product = await prisma.product.create({
      data: {
        slug: testSlug,
        title: "Test Product — Stage 3A Integration",
        price: 1000000,
      },
    });
    testProductId = product.id;
    console.log(`   ✅ Product created: ${product.id}\n`);

    // ═══════════════════════════════════
    // Test 1: createCandidate (isNew=true)
    // ═══════════════════════════════════
    console.log("═══════════════════════════════════");
    console.log("📝 Test 1: createCandidate — isNew=true");
    console.log("═══════════════════════════════════\n");

    const sourceUrl1 = `https://test.example.com/img-${Date.now()}.jpg`;
    const t1 = await createCandidate({
      productId: testProductId,
      source: MediaSource.OTHER,
      sourceUrl: sourceUrl1,
      previewUrl: sourceUrl1,
      title: "Test Image 1",
    });
    testCandidateIds.push(t1.id);
    assert(t1.isNew === true, "isNew باید true باشه");
    assert(t1.status === "PENDING", "status باید PENDING باشه");
    assert(t1.id.length > 0, "id باید غیرخالی باشه");
    console.log(`   ✅ PASS: id=${t1.id}, status=${t1.status}\n`);

    // ═══════════════════════════════════
    // Test 2: Duplicate check
    // ═══════════════════════════════════
    console.log("═══════════════════════════════════");
    console.log("📝 Test 2: Duplicate check — isNew=false");
    console.log("═══════════════════════════════════\n");

    const t2 = await createCandidate({
      productId: testProductId,
      source: MediaSource.OTHER,
      sourceUrl: sourceUrl1,
      previewUrl: sourceUrl1,
      title: "Test Image 1 — duplicate attempt",
    });
    assert(t2.isNew === false, "isNew باید false باشه (duplicate)");
    assert(t2.id === t1.id, "id باید همون قبلی باشه");
    console.log(`   ✅ PASS: duplicate detected, same id\n`);

    // ═══════════════════════════════════
    // Test 3: createCandidates (bulk)
    // ═══════════════════════════════════
    console.log("═══════════════════════════════════");
    console.log("📝 Test 3: createCandidates — bulk 3 items");
    console.log("═══════════════════════════════════\n");

    const ts = Date.now();
    const bulkResult = await createCandidates([
      {
        productId: testProductId,
        source: MediaSource.OTHER,
        sourceUrl: `https://test.example.com/bulk-1-${ts}.jpg`,
        previewUrl: `https://test.example.com/bulk-1-${ts}.jpg`,
      },
      {
        productId: testProductId,
        source: MediaSource.OTHER,
        sourceUrl: `https://test.example.com/bulk-2-${ts}.jpg`,
        previewUrl: `https://test.example.com/bulk-2-${ts}.jpg`,
      },
      {
        productId: testProductId,
        source: MediaSource.OTHER,
        sourceUrl: `https://test.example.com/bulk-3-${ts}.jpg`,
        previewUrl: `https://test.example.com/bulk-3-${ts}.jpg`,
      },
    ]);
    bulkResult.created.forEach((c) => testCandidateIds.push(c.id));
    assert(bulkResult.created.length === 3, "باید ۳ created باشه");
    assert(bulkResult.duplicates.length === 0, "نباید duplicate باشه");
    assert(bulkResult.errors.length === 0, "نباید error باشه");
    console.log(
      `   ✅ PASS: created=${bulkResult.created.length}, duplicates=${bulkResult.duplicates.length}, errors=${bulkResult.errors.length}\n`
    );

    // ═══════════════════════════════════
    // Test 4: getCandidateById
    // ═══════════════════════════════════
    console.log("═══════════════════════════════════");
    console.log("📝 Test 4: getCandidateById");
    console.log("═══════════════════════════════════\n");

    const t4 = await getCandidateById(t1.id);
    assert(t4 !== null, "candidate باید پیدا بشه");
    assert(t4!.id === t1.id, "id باید match کنه");
    assert(t4!.sourceUrl === sourceUrl1, "sourceUrl باید match کنه");
    console.log(`   ✅ PASS: found ${t4!.id}\n`);

    // ═══════════════════════════════════
    // Test 5: getCandidatesForProduct
    // ═══════════════════════════════════
    console.log("═══════════════════════════════════");
    console.log("📝 Test 5: getCandidatesForProduct (status=PENDING)");
    console.log("═══════════════════════════════════\n");

    const t5 = await getCandidatesForProduct(testProductId, "PENDING");
    assert(t5.length === 4, `باید 4 candidate باشه، الان ${t5.length} هست`);
    assert(
      t5.every((c) => c.status === "PENDING"),
      "همه باید PENDING باشن"
    );
    console.log(`   ✅ PASS: ${t5.length} candidates (همه PENDING)\n`);

    // ═══════════════════════════════════
    // Test 6: metadata round-trip
    // ═══════════════════════════════════
    console.log("═══════════════════════════════════");
    console.log("📝 Test 6: metadata round-trip");
    console.log("═══════════════════════════════════\n");

    const testMetadata = {
      provider: "test-provider",
      nested: { key: "value", num: 42 },
      array: [1, 2, 3],
      string: "test",
    };

    const t6 = await createCandidate({
      productId: testProductId,
      source: MediaSource.OTHER,
      sourceUrl: `https://test.example.com/meta-${Date.now()}.jpg`,
      previewUrl: `https://test.example.com/meta-${Date.now()}.jpg`,
      metadata: testMetadata,
    });
    testCandidateIds.push(t6.id);

    const t6Check = await getCandidateById(t6.id);
    assert(t6Check !== null, "candidate باید پیدا بشه");

    const storedMetadata = t6Check!.metadata;

    // ⚠️ PostgreSQL JSONB کلیدها رو alphabetical ذخیره می‌کنه،
    //    پس باید deep equality چک کنیم نه string equality
    const metadataMatch = deepEqual(storedMetadata, testMetadata);
    assert(
      metadataMatch,
      `metadata باید match کنه.\n  sent: ${JSON.stringify(testMetadata)}\n  got: ${JSON.stringify(storedMetadata)}`
    );
    console.log(`   ✅ PASS: metadata ذخیره و بازیابی شد\n`);

  } catch (error) {
    testFailed = true;
    failureMessage = error instanceof Error ? error.message : String(error);
    console.error("\n═══════════════════════════════════");
    console.error("❌ TEST FAILED");
    console.error("═══════════════════════════════════");
    console.error(`\n${failureMessage}\n`);
  }

  // ────────────────────────────────
  // Cleanup (always)
  // ────────────────────────────────
  const cleanupResult = await cleanup();

  await prisma.$disconnect();

  // ────────────────────────────────
  // Final verdict
  // ────────────────────────────────
  if (testFailed) {
    console.error("═══════════════════════════════════");
    console.error("❌ نتیجه: شکست");
    console.error("═══════════════════════════════════");
    process.exit(1);
  }

  if (!cleanupResult.success) {
    console.error("═══════════════════════════════════");
    console.error("⚠️  تست‌ها موفق ولی cleanup کامل نشد");
    console.error("═══════════════════════════════════");
    cleanupResult.errors.forEach((e) => console.error(`   - ${e}`));
    process.exit(2);
  }

  console.log("═══════════════════════════════════");
  console.log("🎉 All tests passed!");
  console.log("═══════════════════════════════════");
  process.exit(0);
}

main().catch((e) => {
  console.error("❌ Fatal error:", e);
  process.exit(1);
});