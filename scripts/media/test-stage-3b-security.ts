// scripts/media/test-stage-3b-security.ts
// تست‌های امنیتی Stage 3B — مرحله A
//
// ⚠️ این تست‌ها فقط روی محیط CI اجرا می‌شن (Node 22).
// ⚠️ هیچ تستی به سرویس metadata واقعی یا شبکه داخلی نمی‌زنه.

import {
    validateUrlStructure,
    validateUrlForDownload,
    isPrivateIp,
    sanitizeUrlForLog,
  } from "../../src/features/media/lib/url-security";
  import { safeDownload } from "../../src/features/media/lib/downloader";
  import { validateImageBuffer } from "../../src/features/media/lib/image-validator";
  
  // ============================================================
  // Test Runner
  // ============================================================
  interface TestResult {
    name: string;
    passed: boolean;
    error?: string;
  }
  
  const results: TestResult[] = [];
  
  async function test(name: string, fn: () => Promise<void> | void): Promise<void> {
    try {
      await fn();
      results.push({ name, passed: true });
      console.log(`✅ ${name}`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      results.push({ name, passed: false, error: msg });
      console.log(`❌ ${name}`);
      console.log(`   → ${msg}`);
    }
  }
  
  function assert(condition: boolean, message: string): void {
    if (!condition) throw new Error(message);
  }
  
  // ============================================================
  // MAIN
  // ============================================================
  async function main(): Promise<void> {
    console.log("═══════════════════════════════════");
    console.log("🧪 Stage 3B Security Tests — Phase A");
    console.log("═══════════════════════════════════\n");
  
    // ============================================================
    // URL Security — Structure
    // ============================================================
    console.log("━━━ URL Security: Structure ━━━\n");
  
    await test("Reject file:// scheme", () => {
      const r = validateUrlStructure("file:///etc/passwd");
      assert(!r.valid, "باید رد بشه");
    });
  
    await test("Reject javascript: scheme", () => {
      const r = validateUrlStructure("javascript:alert(1)");
      assert(!r.valid, "باید رد بشه");
    });
  
    await test("Reject data: scheme", () => {
      const r = validateUrlStructure("data:image/png;base64,xxx");
      assert(!r.valid, "باید رد بشه");
    });
  
    await test("Reject ftp:// scheme", () => {
      const r = validateUrlStructure("ftp://example.com/file");
      assert(!r.valid, "باید رد بشه");
    });
  
    await test("Reject localhost", () => {
      const r = validateUrlStructure("http://localhost:3000/admin");
      assert(!r.valid, "باید رد بشه");
    });
  
    await test("Reject 127.0.0.1", () => {
      const r = validateUrlStructure("http://127.0.0.1:8080/x");
      assert(!r.valid, "باید رد بشه");
    });
  
    await test("Reject private IPv4 (10.x)", () => {
      const r = validateUrlStructure("http://10.0.0.1/x");
      assert(!r.valid, "باید رد بشه");
    });
  
    await test("Reject private IPv4 (192.168.x)", () => {
      const r = validateUrlStructure("http://192.168.1.1/x");
      assert(!r.valid, "باید رد بشه");
    });
  
    await test("Reject AWS metadata IP (169.254.x)", () => {
      const r = validateUrlStructure("http://169.254.169.254/latest/meta-data/");
      assert(!r.valid, "باید رد بشه");
    });
  
    await test("Reject IPv6 loopback (::1)", () => {
      const r = validateUrlStructure("http://[::1]/admin");
      assert(!r.valid, "باید رد بشه");
    });
  
    await test("Reject IPv4-mapped IPv6 (::ffff:127.0.0.1)", () => {
      const r = validateUrlStructure("http://[::ffff:127.0.0.1]/x");
      assert(!r.valid, "باید رد بشه");
    });
  
    await test("Reject metadata.google.internal", () => {
      const r = validateUrlStructure("http://metadata.google.internal/computeMetadata/v1/");
      assert(!r.valid, "باید رد بشه");
    });
  
    await test("Accept valid https URL", () => {
      const r = validateUrlStructure("https://example.com/image.jpg");
      assert(r.valid, "باید قبول بشه");
    });
  
    await test("Accept valid http URL", () => {
      const r = validateUrlStructure("http://example.com/image.jpg");
      assert(r.valid, "باید قبول بشه");
    });
  
    // ============================================================
    // isPrivateIp unit
    // ============================================================
    console.log("\n━━━ isPrivateIp ━━━\n");
  
    await test("isPrivateIp: 10.0.0.1 → true", () => {
      assert(isPrivateIp("10.0.0.1"), "باید true باشه");
    });
  
    await test("isPrivateIp: 172.16.0.1 → true", () => {
      assert(isPrivateIp("172.16.0.1"), "باید true باشه");
    });
  
    await test("isPrivateIp: 192.168.1.1 → true", () => {
      assert(isPrivateIp("192.168.1.1"), "باید true باشه");
    });
  
    await test("isPrivateIp: 169.254.169.254 → true", () => {
      assert(isPrivateIp("169.254.169.254"), "باید true باشه");
    });
  
    await test("isPrivateIp: 127.0.0.1 → true", () => {
      assert(isPrivateIp("127.0.0.1"), "باید true باشه");
    });
  
    await test("isPrivateIp: 8.8.8.8 → false", () => {
      assert(!isPrivateIp("8.8.8.8"), "باید false باشه");
    });
  
    await test("isPrivateIp: ::1 → true", () => {
      assert(isPrivateIp("::1"), "باید true باشه");
    });
  
    await test("isPrivateIp: fe80::1 → true", () => {
      assert(isPrivateIp("fe80::1"), "باید true باشه");
    });
  
    await test("isPrivateIp: 2001:4860:4860::8888 → false", () => {
      assert(!isPrivateIp("2001:4860:4860::8888"), "باید false باشه");
    });
  
    // ============================================================
    // Sanitize URL
    // ============================================================
    console.log("\n━━━ Sanitize URL for Log ━━━\n");
  
    await test("sanitizeUrlForLog removes query+token", () => {
      const s = sanitizeUrlForLog("https://example.com/img.jpg?token=secret123&user=admin");
      assert(!s.includes("secret123"), "نباید token داشته باشه");
      assert(!s.includes("admin"), "نباید user داشته باشه");
      assert(s.includes("example.com"), "باید hostname داشته باشه");
    });
  
    await test("sanitizeUrlForLog removes fragment", () => {
      const s = sanitizeUrlForLog("https://example.com/img.jpg#section");
      assert(!s.includes("section"), "نباید fragment داشته باشه");
    });
  
    // ============================================================
    // Image Validator — Positive tests
    // ============================================================
    console.log("\n━━━ Image Validator: Positive ━━━\n");
  
    await test("Valid 1x1 PNG", () => {
      // 1x1 transparent PNG
      const png = Buffer.from(
        "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da63f8cfc000000301010018dd8db00000000049454e44ae426082",
        "hex"
      );
      const r = validateImageBuffer(png);
      assert(r.valid, `باید معتبر باشه: ${!r.valid ? r.reason : ""}`);
      if (r.valid) {
        assert(r.mimeType === "image/png", "mimeType باید png باشه");
        assert(r.width === 1, "width باید 1 باشه");
        assert(r.height === 1, "height باید 1 باشه");
        assert(r.checksum.length === 64, "checksum باید 64 کاراکتر باشه");
      }
    });
  
    // ============================================================
    // Image Validator — Negative tests
    // ============================================================
    console.log("\n━━━ Image Validator: Negative ━━━\n");
  
    await test("Reject empty buffer", () => {
      const r = validateImageBuffer(Buffer.from(""));
      assert(!r.valid, "باید رد بشه");
    });
  
    await test("Reject PDF", () => {
      const pdf = Buffer.from("%PDF-1.4\n%...", "utf8");
      const r = validateImageBuffer(pdf);
      assert(!r.valid, "باید رد بشه");
    });
  
    await test("Reject HTML", () => {
      const html = Buffer.from("<!DOCTYPE html><html>...", "utf8");
      const r = validateImageBuffer(html);
      assert(!r.valid, "باید رد بشه");
    });
  
    await test("Reject SVG", () => {
      const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>', "utf8");
      const r = validateImageBuffer(svg);
      assert(!r.valid, "باید رد بشه");
    });
  
    await test("Reject random bytes", () => {
      const random = Buffer.from([0x00, 0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88, 0x99, 0xaa, 0xbb]);
      const r = validateImageBuffer(random);
      assert(!r.valid, "باید رد بشه");
    });
  
    // ============================================================
    // Downloader — validation only (بدون fetch واقعی)
    // ============================================================
    console.log("\n━━━ Downloader (validation only) ━━━\n");
  
    await test("safeDownload rejects file://", async () => {
      const r = await safeDownload("file:///etc/passwd");
      assert(!r.success, "باید رد بشه");
      if (!r.success) {
        assert(r.reason.includes("URL_VALIDATION_FAILED"), "reason باید URL_VALIDATION_FAILED باشه");
      }
    });
  
    await test("safeDownload rejects localhost", async () => {
      const r = await safeDownload("http://localhost:9999/x");
      assert(!r.success, "باید رد بشه");
    });
  
    await test("safeDownload rejects private IP", async () => {
      const r = await safeDownload("http://192.168.1.1/x");
      assert(!r.success, "باید رد بشه");
    });
  
    // ============================================================
    // Summary
    // ============================================================
    console.log("\n═══════════════════════════════════");
    console.log("📊 نتیجه‌ی نهایی:");
    console.log("═══════════════════════════════════\n");
  
    const passed = results.filter((r) => r.passed).length;
    const failed = results.filter((r) => !r.passed).length;
    const total = results.length;
  
    console.log(`Total:  ${total}`);
    console.log(`Passed: ${passed} ✅`);
    console.log(`Failed: ${failed} ❌\n`);
  
    if (failed > 0) {
      console.log("خطاها:");
      results
        .filter((r) => !r.passed)
        .forEach((r) => console.log(`   ❌ ${r.name} → ${r.error}`));
      console.log("");
      process.exit(1);
    }
  
    console.log("🎉 All security tests passed!\n");
    process.exit(0);
  }
  
  main().catch((e) => {
    console.error("❌ Fatal:", e);
    process.exit(1);
  });