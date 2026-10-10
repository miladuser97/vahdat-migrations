// scripts/media/test-stage-3b-http.ts
// تست‌های HTTP واقعی برای Stage 3B Phase A
//
// ⚠️ این تست‌ها یه HTTP server محلی بالا میارن.
// ⚠️ نیاز به NODE_ENV=test یا ALLOW_LOCALHOST_FOR_TEST=1 داره.

import http from "http";
import type { AddressInfo } from "net";
import { safeDownload } from "../../src/features/media/lib/downloader";
import { isLocalhostAllowedForTest } from "../../src/features/media/lib/url-security";

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
// Helper: ساخت HTTP server
// ============================================================
interface MockServer {
  url: string;
  port: number;
  close: () => Promise<void>;
}

async function startMockServer(
  handler: (
    req: http.IncomingMessage,
    res: http.ServerResponse
  ) => void
): Promise<MockServer> {
  return new Promise((resolve, reject) => {
    const server = http.createServer(handler);

    server.listen(0, "127.0.0.1", () => {
      const addr = server.address() as AddressInfo;
      const port = addr.port;

      resolve({
        url: `http://127.0.0.1:${port}`,
        port,
        close: () =>
          new Promise<void>((res) => {
            server.close(() => res());
          }),
      });
    });

    server.on("error", reject);
  });
}

// ============================================================
// MAIN
// ============================================================
async function main(): Promise<void> {
  console.log("═══════════════════════════════════");
  console.log("🧪 Stage 3B HTTP Tests — Phase A");
  console.log("═══════════════════════════════════\n");

  if (!isLocalhostAllowedForTest()) {
    console.error("❌ این تست نیاز به NODE_ENV=test یا ALLOW_LOCALHOST_FOR_TEST=1 داره");
    process.exit(1);
  }
  console.log("✅ Test mode فعال: localhost مجاز\n");

  // ═══════════════════════════════════════
  // Redirect Tests
  // ═══════════════════════════════════════
  console.log("━━━ Redirect Tests ━━━\n");

  await test("Redirect loop → TOO_MANY_REDIRECTS", async () => {
    let server: MockServer;
    server = await startMockServer((req, res) => {
      res.writeHead(302, { Location: `${server.url}/loop` });
      res.end();
    });

    try {
      const result = await safeDownload(`${server.url}/loop`, {
        maxRedirects: 3,
      });
      assert(!result.success, "باید رد بشه (redirect loop)");
      if (!result.success) {
        assert(
          result.reason.includes("TOO_MANY_REDIRECTS"),
          `reason باید TOO_MANY_REDIRECTS باشه، الان: ${result.reason}`
        );
      }
    } finally {
      await server.close();
    }
  });

  await test("Redirect chain معتبر (1 hop) → موفق", async () => {
    const serverB = await startMockServer((req, res) => {
      res.writeHead(200, { "Content-Type": "image/png" });
      res.end(Buffer.from("fake-png-data"));
    });

    const serverA = await startMockServer((req, res) => {
      res.writeHead(302, { Location: `${serverB.url}/final.png` });
      res.end();
    });

    try {
      const result = await safeDownload(`${serverA.url}/start.png`);
      assert(
        result.success,
        `باید موفق باشه: ${!result.success ? result.reason : ""}`
      );
    } finally {
      await serverA.close();
      await serverB.close();
    }
  });

  // ═══════════════════════════════════════
  // Timeout Tests
  // ═══════════════════════════════════════
  console.log("\n━━━ Timeout Tests ━━━\n");

  await test("Timeout روی server که هرگز پاسخ نمی‌ده", async () => {
    const server = await startMockServer((_req, _res) => {
      // هیچ پاسخی نمی‌دیم
    });

    try {
      const start = Date.now();
      const result = await safeDownload(`${server.url}/slow`, {
        timeoutMs: 2000,
      });
      const elapsed = Date.now() - start;

      assert(!result.success, "باید timeout بده");
      assert(elapsed < 5000, `باید سریع‌تر از ۵ ثانیه باشه، الان ${elapsed}ms`);
      if (!result.success) {
        assert(
          result.reason.includes("TIMEOUT"),
          `reason باید TIMEOUT باشه، الان: ${result.reason}`
        );
      }
      console.log(`   ⏱️ زمان: ${elapsed}ms`);
    } finally {
      await server.close();
    }
  });

  await test("Timeout روی server با تاخیر ۱۰ ثانیه‌ای (timeout=1.5s)", async () => {
    const server = await startMockServer((_req, res) => {
      setTimeout(() => {
        res.writeHead(200, { "Content-Type": "image/png" });
        res.end("fake");
      }, 10_000);
    });

    try {
      const start = Date.now();
      const result = await safeDownload(`${server.url}/slow`, {
        timeoutMs: 1500,
      });
      const elapsed = Date.now() - start;

      assert(!result.success, "باید timeout بده");
      assert(elapsed < 4000, `باید سریع‌تر از ۴ ثانیه باشه، الان ${elapsed}ms`);
      console.log(`   ⏱️ زمان: ${elapsed}ms`);
    } finally {
      await server.close();
    }
  });

  // ═══════════════════════════════════════
  // Size Limit Tests
  // ═══════════════════════════════════════
  console.log("\n━━━ Size Limit Tests ━━━\n");

  await test("Content-Length بزرگ → رد سریع", async () => {
    const server = await startMockServer((_req, res) => {
      res.writeHead(200, {
        "Content-Type": "image/png",
        "Content-Length": String(20 * 1024 * 1024), // 20 MiB
      });
      // ⚠️ به‌جای end() خالی، چانک‌های واقعی می‌فرستیم
      // ولی قبل از اینکه دانلود کامل بشه، downloader باید قطع کنه
      const chunk = Buffer.alloc(1024 * 1024); // 1 MiB
      let sent = 0;
      const interval = setInterval(() => {
        if (sent > 25) {
          clearInterval(interval);
          try {
            res.end();
          } catch {
            // ممکنه connection قبلاً بسته شده باشه
          }
          return;
        }
        try {
          res.write(chunk);
          sent++;
        } catch {
          clearInterval(interval);
        }
      }, 5);

      res.on("close", () => clearInterval(interval));
    });

    try {
      const result = await safeDownload(`${server.url}/big`, {
        maxSize: 5 * 1024 * 1024,
      });
      assert(!result.success, "باید رد بشه");
      if (!result.success) {
        assert(
          result.reason.includes("FILE_TOO_LARGE"),
          `reason باید FILE_TOO_LARGE باشه، الان: ${result.reason}`
        );
      }
    } finally {
      await server.close();
    }
  });

  await test("Stream بزرگتر از سقف (بدون Content-Length) → قطع", async () => {
    const server = await startMockServer((_req, res) => {
      res.writeHead(200, { "Content-Type": "image/png" });
      const chunk = Buffer.alloc(1024 * 1024); // 1 MiB
      let sent = 0;
      const interval = setInterval(() => {
        if (sent > 20) {
          clearInterval(interval);
          try {
            res.end();
          } catch {
            // ممکنه connection قبلاً بسته شده باشه
          }
          return;
        }
        try {
          res.write(chunk);
          sent++;
        } catch {
          clearInterval(interval);
        }
      }, 10);

      res.on("close", () => clearInterval(interval));
    });

    try {
      const result = await safeDownload(`${server.url}/big-stream`, {
        maxSize: 5 * 1024 * 1024,
      });
      assert(!result.success, "باید رد بشه");
      if (!result.success) {
        assert(
          result.reason.includes("FILE_TOO_LARGE"),
          `reason باید FILE_TOO_LARGE باشه، الان: ${result.reason}`
        );
      }
    } finally {
      await server.close();
    }
  });

  // ═══════════════════════════════════════
  // Content-Type Tests
  // ═══════════════════════════════════════
  console.log("\n━━━ Content-Type Tests ━━━\n");

  await test("Content-Type غیرمجاز (text/html) → رد", async () => {
    const server = await startMockServer((_req, res) => {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end("<html></html>");
    });

    try {
      const result = await safeDownload(`${server.url}/html`);
      assert(!result.success, "باید رد بشه");
      if (!result.success) {
        assert(
          result.reason.includes("CONTENT_TYPE"),
          `reason باید CONTENT_TYPE_NOT_ALLOWED باشه، الان: ${result.reason}`
        );
      }
    } finally {
      await server.close();
    }
  });

  await test("Content-Type مجاز (image/png) → موفق", async () => {
    const server = await startMockServer((_req, res) => {
      res.writeHead(200, { "Content-Type": "image/png" });
      res.end(Buffer.from("fake-png"));
    });

    try {
      const result = await safeDownload(`${server.url}/image.png`);
      assert(
        result.success,
        `باید موفق باشه: ${!result.success ? result.reason : ""}`
      );
      if (result.success) {
        assert(
          result.contentType === "image/png",
          "contentType باید image/png باشه"
        );
      }
    } finally {
      await server.close();
    }
  });

  // ═══════════════════════════════════════
  // Summary
  // ═══════════════════════════════════════
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

  console.log("🎉 All HTTP tests passed!\n");
  process.exit(0);
}

main().catch((e) => {
  console.error("❌ Fatal:", e);
  process.exit(1);
});