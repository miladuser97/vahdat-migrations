// scripts/media/integration-test-phase-b.ts
// تست‌های واقعی Phase B برای approve-candidate-service
//
// ⚠️ این تست فقط روی DB موقت (Postgres Container) اجرا می‌شه.
// ⚠️ هرگز روی production اجرا نکن.
//
// اجرا: npx tsx scripts/media/integration-test-phase-b.ts

import { PrismaClient, MediaSource } from "@prisma/client";
import {
  claimCandidate,
  approveCandidate,
  releaseClaim,
  releaseExpiredClaims,
  rejectCandidate,
  isCandidateClaimed,
} from "../../src/features/media/services/approve-candidate-service";

const prisma = new PrismaClient();

// ============================================================
// ردیابی رکوردهای تست
// ============================================================
const testCandidateIds: string[] = [];
const testMediaAssetIds: string[] = [];
const testProductMediaIds: string[] = [];
let testProductId: string | null = null;

// ============================================================
// Assert
// ============================================================
function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`ASSERTION FAILED: ${message}`);
  }
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
    const msg = e instanceof Error ? e.message : String(e);
    errors.push(`ProductMedia cleanup: ${msg}`);
  }

  try {
    if (testMediaAssetIds.length > 0) {
      const r = await prisma.mediaAsset.deleteMany({
        where: { id: { in: testMediaAssetIds } },
      });
      console.log(`   ✅ ${r.count} MediaAsset حذف شد`);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    errors.push(`MediaAsset cleanup: ${msg}`);
  }

  try {
    if (testCandidateIds.length > 0) {
      const r = await prisma.mediaCandidate.deleteMany({
        where: { id: { in: testCandidateIds } },
      });
      console.log(`   ✅ ${r.count} MediaCandidate حذف شد`);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    errors.push(`MediaCandidate cleanup: ${msg}`);
  }

  try {
    if (testProductId) {
      await prisma.product.delete({ where: { id: testProductId } });
      console.log(`   ✅ Product تست حذف شد`);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    errors.push(`Product cleanup: ${msg}`);
  }

  return { success: errors.length === 0, errors };
}

// ============================================================
// Helper: ساخت Candidate تست
// ============================================================
async function makeCandidate(opts?: {
  sourceUrl?: string;
  status?: "PENDING" | "APPROVING" | "APPROVED" | "REJECTED";
}): Promise<string> {
  const ts = Date.now() + Math.random();
  const url = opts?.sourceUrl ?? `https://test.example.com/pb-${ts}.jpg`;
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
// Tests
// ============================================================

// ─────────────────────────────────────────
// Test 1: claim موفق
// ─────────────────────────────────────────
async function test1_claimSuccess(): Promise<void> {
  console.log("════════════════════════════════════════");
  console.log("📌 Test 1: claimCandidate موفق");
  console.log("════════════════════════════════════════");

  const id = await makeCandidate();
  const claim = await claimCandidate({ candidateId: id, userId: "user-1" });

  assert(claim !== null, "claim باید موفق باشه");
  assert(claim!.claimToken.length === 64, "claimToken باید 64 char باشه");
  assert(claim!.candidateId === id, "candidateId باید match کنه");

  const check = await isCandidateClaimed(id);
  assert(check.claimed === true, "candidate باید claimed باشه");

  console.log(`   ✅ PASS: token length=${claim!.claimToken.length}`);
}

// ─────────────────────────────────────────
// Test 2: claim دوباره (باید fail)
// ─────────────────────────────────────────
async function test2_claimConflict(): Promise<void> {
  console.log("════════════════════════════════════════");
  console.log("📌 Test 2: claim دوم روی همون candidate (باید fail)");
  console.log("════════════════════════════════════════");

  const id = await makeCandidate();
  const claim1 = await claimCandidate({ candidateId: id, userId: "user-1" });
  assert(claim1 !== null, "claim1 باید موفق باشه");

  const claim2 = await claimCandidate({ candidateId: id, userId: "user-2" });
  assert(claim2 === null, "claim2 باید fail بشه");

  console.log(`   ✅ PASS: claim دوم رد شد`);
}

// ─────────────────────────────────────────
// Test 3: releaseClaim و claim مجدد
// ─────────────────────────────────────────
async function test3_releaseThenClaim(): Promise<void> {
  console.log("════════════════════════════════════════");
  console.log("📌 Test 3: releaseClaim سپس claim مجدد");
  console.log("════════════════════════════════════════");

  const id = await makeCandidate();
  const claim1 = await claimCandidate({ candidateId: id, userId: "user-1" });
  assert(claim1 !== null, "claim1 باید موفق باشه");

  await releaseClaim(id, claim1!.claimToken);

  const check = await isCandidateClaimed(id);
  assert(check.claimed === false, "بعد از release نباید claimed باشه");

  const claim2 = await claimCandidate({ candidateId: id, userId: "user-2" });
  assert(claim2 !== null, "claim2 بعد از release باید موفق باشه");

  console.log(`   ✅ PASS: release + claim مجدد`);
}

// ─────────────────────────────────────────
// Test 4: approve با token نامطابق
// ─────────────────────────────────────────
async function test4_approveWrongToken(): Promise<void> {
  console.log("════════════════════════════════════════");
  console.log("📌 Test 4: approve با claimToken نامطابق");
  console.log("════════════════════════════════════════");

  const id = await makeCandidate();
  await claimCandidate({ candidateId: id, userId: "user-1" });

  const result = await approveCandidate({
    candidateId: id,
    claimToken: "0".repeat(64),
    userId: "user-1",
  });

  assert(result.success === false, "approve باید fail بشه");
  if (!result.success) {
    assert(result.code === "INVALID_CLAIM", `code باید INVALID_CLAIM باشه، الان ${result.code}`);
  }

  console.log(`   ✅ PASS: token نامطابق رد شد`);
}

// ─────────────────────────────────────────
// Test 5: approve با status نامعتبر
// ─────────────────────────────────────────
async function test5_approveWrongStatus(): Promise<void> {
  console.log("════════════════════════════════════════");
  console.log("📌 Test 5: approve روی candidate با status=REJECTED");
  console.log("════════════════════════════════════════");

  const id = await makeCandidate({ status: "REJECTED" });
  const claim = await claimCandidate({ candidateId: id, userId: "user-1" });

  // claim روی REJECTED باید fail بشه
  assert(claim === null, "claim روی REJECTED باید fail بشه");

  console.log(`   ✅ PASS: claim روی REJECTED رد شد`);
}

// ─────────────────────────────────────────
// Test 6: approve با candidate ناموجود
// ─────────────────────────────────────────
async function test6_approveNotFound(): Promise<void> {
  console.log("════════════════════════════════════════");
  console.log("📌 Test 6: approve روی candidate ناموجود");
  console.log("════════════════════════════════════════");

  const result = await approveCandidate({
    candidateId: "00000000-0000-0000-0000-000000000000",
    claimToken: "0".repeat(64),
    userId: "user-1",
  });

  assert(result.success === false, "approve باید fail بشه");
  if (!result.success) {
    assert(result.code === "NOT_FOUND", `code باید NOT_FOUND باشه، الان ${result.code}`);
  }

  console.log(`   ✅ PASS: candidate ناموجود رد شد`);
}

// ─────────────────────────────────────────
// Test 7: rejectCandidate موفق
// ─────────────────────────────────────────
async function test7_rejectSuccess(): Promise<void> {
  console.log("════════════════════════════════════════");
  console.log("📌 Test 7: rejectCandidate موفق");
  console.log("════════════════════════════════════════");

  const id = await makeCandidate();
  const result = await rejectCandidate({
    candidateId: id,
    userId: "admin-1",
    reason: "Test rejection",
  });

  assert(result.success === true, "reject باید موفق باشه");

  const check = await prisma.mediaCandidate.findUnique({ where: { id } });
  assert(check!.status === "REJECTED", "status باید REJECTED باشه");
  assert(check!.rejectReason === "Test rejection", "rejectReason باید ذخیره بشه");

  console.log(`   ✅ PASS: reject موفق`);
}

// ─────────────────────────────────────────
// Test 8: reject روی APPROVED (باید fail)
// ─────────────────────────────────────────
async function test8_rejectApproved(): Promise<void> {
  console.log("════════════════════════════════════════");
  console.log("📌 Test 8: reject روی candidate با status=APPROVED");
  console.log("════════════════════════════════════════");

  const id = await makeCandidate({ status: "APPROVED" });
  const result = await rejectCandidate({
    candidateId: id,
    userId: "admin-1",
  });

  assert(result.success === false, "reject روی APPROVED باید fail بشه");
  assert(result.error !== undefined, "باید error داشته باشه");

  console.log(`   ✅ PASS: reject روی APPROVED رد شد`);
}

// ─────────────────────────────────────────
// Test 9: reject روی APPROVING (باید fail)
// ─────────────────────────────────────────
async function test9_rejectApproving(): Promise<void> {
  console.log("════════════════════════════════════════");
  console.log("📌 Test 9: reject روی candidate با status=APPROVING");
  console.log("════════════════════════════════════════");

  const id = await makeCandidate({ status: "APPROVING" });
  const result = await rejectCandidate({
    candidateId: id,
    userId: "admin-1",
  });

  assert(result.success === false, "reject روی APPROVING باید fail بشه");

  console.log(`   ✅ PASS: reject روی APPROVING رد شد`);
}

// ─────────────────────────────────────────
// Test 10: releaseExpiredClaims
// ─────────────────────────────────────────
async function test10_releaseExpired(): Promise<void> {
  console.log("════════════════════════════════════════");
  console.log("📌 Test 10: releaseExpiredClaims");
  console.log("════════════════════════════════════════");

  const id = await makeCandidate();

  // claim با انقضای گذشته (مستقیم تو DB)
  await prisma.mediaCandidate.update({
    where: { id },
    data: {
      claimToken: "expired-token",
      claimExpiresAt: new Date(Date.now() - 60_000), // 1 دقیقه پیش
      status: "APPROVING",
    },
  });

  const count = await releaseExpiredClaims();
  assert(count >= 1, `باید حداقل 1 claim آزاد بشه، الان ${count}`);

  const check = await prisma.mediaCandidate.findUnique({ where: { id } });
  assert(check!.claimToken === null, "claimToken باید null باشه");
  assert(check!.status === "PENDING", "status باید PENDING باشه");

  console.log(`   ✅ PASS: ${count} claim منقضی آزاد شد`);
}

// ─────────────────────────────────────────
// Test 11: concurrent claim (دو درخواست هم‌زمان)
// ─────────────────────────────────────────
async function test11_concurrentClaim(): Promise<void> {
  console.log("════════════════════════════════════════");
  console.log("📌 Test 11: دو claim هم‌زمان روی یک candidate");
  console.log("════════════════════════════════════════");

  const id = await makeCandidate();

  // هر دو هم‌زمان اجرا
  const [c1, c2] = await Promise.all([
    claimCandidate({ candidateId: id, userId: "user-1" }),
    claimCandidate({ candidateId: id, userId: "user-2" }),
  ]);

  const successCount = [c1, c2].filter((c) => c !== null).length;
  assert(successCount === 1, `فقط 1 claim باید موفق باشه، الان ${successCount}`);

  console.log(`   ✅ PASS: فقط 1 claim موفق شد`);
}

// ─────────────────────────────────────────
// Test 12: isCandidateClaimed
// ─────────────────────────────────────────
async function test12_isClaimed(): Promise<void> {
  console.log("════════════════════════════════════════");
  console.log("📌 Test 12: isCandidateClaimed");
  console.log("════════════════════════════════════════");

  const id = await makeCandidate();

  const before = await isCandidateClaimed(id);
  assert(before.claimed === false, "قبل از claim نباید claimed باشه");

  await claimCandidate({ candidateId: id, userId: "user-1" });

  const after = await isCandidateClaimed(id);
  assert(after.claimed === true, "بعد از claim باید claimed باشه");
  assert(after.expiresAt !== null, "expiresAt باید set باشه");

  console.log(`   ✅ PASS: isCandidateClaimed درست کار می‌کنه`);
}

// ============================================================
// Main
// ============================================================
async function main(): Promise<void> {
  console.log("════════════════════════════════════════");
  console.log("🧪 Integration Test — Phase B");
  console.log("════════════════════════════════════════");

  let testFailed = false;
  let failureMessage = "";

  try {
    // Setup: Product تست
    console.log("📦 Setup: ساخت Product تست");
    const product = await prisma.product.create({
      data: {
        slug: `pb-test-${Date.now()}`,
        title: "Test Product — Phase B",
        price: 1000000,
      },
    });
    testProductId = product.id;
    console.log(`   ✅ Product created: ${product.id}\n`);

    // اجرای همه تست‌ها
    await test1_claimSuccess();
    await test2_claimConflict();
    await test3_releaseThenClaim();
    await test4_approveWrongToken();
    await test5_approveWrongStatus();
    await test6_approveNotFound();
    await test7_rejectSuccess();
    await test8_rejectApproved();
    await test9_rejectApproving();
    await test10_releaseExpired();
    await test11_concurrentClaim();
    await test12_isClaimed();

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
  console.log("🎉 All Phase B tests passed!");
  console.log("════════════════════════════════════════");
  process.exit(0);
}

main().catch((e) => {
  console.error("❌ Fatal:", e);
  process.exit(1);
});