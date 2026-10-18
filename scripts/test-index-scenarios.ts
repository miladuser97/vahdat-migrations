// scripts/test-index-scenarios.ts
// تست ۹ سناریو برای partial unique indexها
// ⚠️ فقط روی PostgreSQL موقت GitHub Actions

import { PrismaClient, MediaSource } from "@prisma/client";

const prisma = new PrismaClient();

// ============================================================
// Helper
// ============================================================

interface ScenarioResult {
  passed: boolean;
  message: string;
}

let testCounter = 0;

async function cleanTestData(): Promise<void> {
  await prisma.productMedia.deleteMany({
    where: { productId: { startsWith: "test-" } },
  });
  await prisma.product.deleteMany({
    where: { id: { startsWith: "test-" } },
  });
  await prisma.mediaAsset.deleteMany({
    where: { id: { startsWith: "test-" } },
  });
  await prisma.productVariant.deleteMany({
    where: { id: { startsWith: "test-" } },
  });
}

async function createTestProduct(id: string): Promise<void> {
  await prisma.product.create({
    data: {
      id,
      slug: id,
      title: `Test ${id}`,
      price: 1000,
    },
  });
}

async function createTestMedia(id: string): Promise<void> {
  await prisma.mediaAsset.create({
    data: {
      id,
      url: `https://test.example.com/${id}.jpg`,
      storagePath: `test/${id}.jpg`,
      filename: `${id}.jpg`,
      mimeType: "image/jpeg",
      size: 1024,
    },
  });
}

async function createTestVariant(id: string, productId: string): Promise<void> {
  await prisma.productVariant.create({
    data: {
      id,
      productId,
      slug: id,
      sku: id,
      price: 1000,
    },
  });
}

async function tryCreateProductMedia(data: {
  productId: string;
  mediaId: string;
  isPrimary: boolean;
  status: "PENDING" | "APPROVING" | "APPROVED" | "REJECTED";
  variantId: string | null;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.productMedia.create({
      data: {
        id: `test-pm-${testCounter++}`,
        productId: data.productId,
        mediaId: data.mediaId,
        isPrimary: data.isPrimary,
        status: data.status,
        variantId: data.variantId,
        role: "GALLERY",
        displayOrder: 0,
      },
    });
    return { success: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { success: false, error: msg };
  }
}

// ============================================================
// Setup
// ============================================================

async function setup(): Promise<void> {
  console.log("════════════════════════════════════════");
  console.log("📦 Setup: test data");
  console.log("════════════════════════════════════════");

  await cleanTestData();

  await createTestProduct("test-prod-1");
  await createTestProduct("test-prod-2");

  await createTestMedia("test-media-1");
  await createTestMedia("test-media-2");
  await createTestMedia("test-media-3");
  await createTestMedia("test-media-4");
  await createTestMedia("test-media-5");
  await createTestMedia("test-media-6");
  await createTestMedia("test-media-7");
  await createTestMedia("test-media-8");
  await createTestMedia("test-media-9");

  await createTestVariant("test-var-1", "test-prod-1");
  await createTestVariant("test-var-2", "test-prod-1");

  console.log("   ✅ Test data created\n");
}

// ============================================================
// 9 Scenarios
// ============================================================

async function runScenarios(): Promise<ScenarioResult[]> {
  const results: ScenarioResult[] = [];

  // ─────────────────────────────────────────
  // Scenario 1: product primary — first
  // ─────────────────────────────────────────
  console.log("📌 Scenario 1: product primary (first)");
  const s1 = await tryCreateProductMedia({
    productId: "test-prod-1",
    mediaId: "test-media-1",
    isPrimary: true,
    status: "APPROVED",
    variantId: null,
  });
  results.push({
    passed: s1.success,
    message: s1.success
      ? "✅ PASS: first product primary accepted"
      : `❌ FAIL: ${s1.error}`,
  });

  // ─────────────────────────────────────────
  // Scenario 2: product primary — duplicate
  // ─────────────────────────────────────────
  console.log("📌 Scenario 2: product primary (duplicate)");
  const s2 = await tryCreateProductMedia({
    productId: "test-prod-1",
    mediaId: "test-media-2",
    isPrimary: true,
    status: "APPROVED",
    variantId: null,
  });
  // انتظار: رد
  results.push({
    passed: !s2.success,
    message: !s2.success
      ? "✅ PASS: duplicate product primary rejected"
      : "❌ FAIL: duplicate product primary was accepted!",
  });

  // ─────────────────────────────────────────
  // Scenario 3: isPrimary = false
  // ─────────────────────────────────────────
  console.log("📌 Scenario 3: isPrimary = false");
  const s3 = await tryCreateProductMedia({
    productId: "test-prod-1",
    mediaId: "test-media-3",
    isPrimary: false,
    status: "APPROVED",
    variantId: null,
  });
  results.push({
    passed: s3.success,
    message: s3.success
      ? "✅ PASS: isPrimary=false accepted"
      : `❌ FAIL: ${s3.error}`,
  });

  // ─────────────────────────────────────────
  // Scenario 4: status = PENDING
  // ─────────────────────────────────────────
  console.log("📌 Scenario 4: status = PENDING");
  const s4 = await tryCreateProductMedia({
    productId: "test-prod-1",
    mediaId: "test-media-4",
    isPrimary: true,
    status: "PENDING",
    variantId: null,
  });
  results.push({
    passed: s4.success,
    message: s4.success
      ? "✅ PASS: PENDING accepted"
      : `❌ FAIL: ${s4.error}`,
  });

  // ─────────────────────────────────────────
  // Scenario 5: status = REJECTED
  // ─────────────────────────────────────────
  console.log("📌 Scenario 5: status = REJECTED");
  const s5 = await tryCreateProductMedia({
    productId: "test-prod-1",
    mediaId: "test-media-5",
    isPrimary: true,
    status: "REJECTED",
    variantId: null,
  });
  results.push({
    passed: s5.success,
    message: s5.success
      ? "✅ PASS: REJECTED accepted"
      : `❌ FAIL: ${s5.error}`,
  });

  // ─────────────────────────────────────────
  // Scenario 6: different product
  // ─────────────────────────────────────────
  console.log("📌 Scenario 6: different product");
  const s6 = await tryCreateProductMedia({
    productId: "test-prod-2",
    mediaId: "test-media-6",
    isPrimary: true,
    status: "APPROVED",
    variantId: null,
  });
  results.push({
    passed: s6.success,
    message: s6.success
      ? "✅ PASS: different product accepted"
      : `❌ FAIL: ${s6.error}`,
  });

  // ─────────────────────────────────────────
  // Scenario 7: variant primary — first
  // ─────────────────────────────────────────
  console.log("📌 Scenario 7: variant primary (first)");
  const s7 = await tryCreateProductMedia({
    productId: "test-prod-1",
    mediaId: "test-media-7",
    isPrimary: true,
    status: "APPROVED",
    variantId: "test-var-1",
  });
  results.push({
    passed: s7.success,
    message: s7.success
      ? "✅ PASS: first variant primary accepted"
      : `❌ FAIL: ${s7.error}`,
  });

  // ─────────────────────────────────────────
  // Scenario 8: variant primary — duplicate
  // ─────────────────────────────────────────
  console.log("📌 Scenario 8: variant primary (duplicate)");
  const s8 = await tryCreateProductMedia({
    productId: "test-prod-1",
    mediaId: "test-media-8",
    isPrimary: true,
    status: "APPROVED",
    variantId: "test-var-1",
  });
  results.push({
    passed: !s8.success,
    message: !s8.success
      ? "✅ PASS: duplicate variant primary rejected"
      : "❌ FAIL: duplicate variant primary was accepted!",
  });

  // ─────────────────────────────────────────
  // Scenario 9: different variant
  // ─────────────────────────────────────────
  console.log("📌 Scenario 9: different variant");
  const s9 = await tryCreateProductMedia({
    productId: "test-prod-1",
    mediaId: "test-media-9",
    isPrimary: true,
    status: "APPROVED",
    variantId: "test-var-2",
  });
  results.push({
    passed: s9.success,
    message: s9.success
      ? "✅ PASS: different variant accepted"
      : `❌ FAIL: ${s9.error}`,
  });

  return results;
}

// ============================================================
// Main
// ============================================================

async function main(): Promise<void> {
  console.log("════════════════════════════════════════");
  console.log("🧪 Test 9 Index Scenarios");
  console.log("════════════════════════════════════════");

  let failed = false;
  const results: ScenarioResult[] = [];

  try {
    await setup();
    const scenarioResults = await runScenarios();
    results.push(...scenarioResults);

    // بررسی نتایج
    console.log("\n════════════════════════════════════════");
    console.log("📊 Results:");
    console.log("════════════════════════════════════════");

    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      console.log(`   ${r.message}`);
      if (!r.passed) {
        failed = true;
      }
    }

    console.log("════════════════════════════════════════");

    if (failed) {
      console.log("❌ FAILED: some scenarios didn't pass");
      process.exitCode = 1;
    } else {
      console.log("🎉 All 9 scenarios passed!");
      process.exitCode = 0;
    }
  } catch (e) {
    console.error("❌ Fatal error:", e instanceof Error ? e.message : String(e));
    process.exitCode = 1;
  } finally {
    try {
      await cleanTestData();
    } catch {
      // ignore cleanup errors
    }
    await prisma.$disconnect();
  }
}

main().catch(() => {
  console.error("❌ Unexpected error");
  process.exitCode = 1;
});