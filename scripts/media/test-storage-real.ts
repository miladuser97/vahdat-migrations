// scripts/media/test-storage-real.ts
// ⚠️ فقط روی Project تست

import {
  loadTestStorageConfig,
  verifyTestProjectUrl,
  verifyBucketExists,
  buildAndValidateTestStoragePath,
  attemptUpload,
  testCleanup,
  checkFileExists,
  TestError,
  type ErrorCode,
  type UploadOutcome,
  type CleanupOutcome,
  type TestStorageConfig,
} from "./storage-helpers";

// ============================================================
// Helper
// ============================================================

function buildRunId(): string {
  const ghRunId = process.env.GITHUB_RUN_ID;
  if (ghRunId && /^[0-9]+$/.test(ghRunId)) {
    return `run-${ghRunId}`;
  }
  const ts = Date.now();
  const rand = Math.random().toString(36).substring(2, 10);
  return `local-${ts}-${rand}`;
}

function buildFilename(): string {
  const ts = Date.now();
  const rand = Math.random().toString(36).substring(2, 10);
  return `test-${ts}-${rand}.txt`;
}

function logError(code: ErrorCode, context?: string): void {
  const ctx = context ? ` (${context})` : "";
  console.error(`   ❌ Error [${code}]${ctx}`);
}

function logWarning(code: ErrorCode, context?: string): void {
  const ctx = context ? ` (${context})` : "";
  console.log(`   ⚠️  Warning [${code}]${ctx}`);
}

function formatOutcome(o: UploadOutcome | CleanupOutcome): string {
  switch (o) {
    case "success": return "✅ PASS";
    case "failed": return "❌ FAIL";
    case "unknown": return "⚠️  UNKNOWN";
    case "skipped": return "⏭️  SKIP";
  }
}

// ============================================================
// RunState — با uploadRequestStarted
// ============================================================

interface RunState {
  configErrorBeforeUpload: ErrorCode | null;
  configErrorAfterUpload: ErrorCode | null;
  // ⚠️ uploadRequestStarted: آیا درخواست نوشتنی واقعاً شروع شده؟
  // (نه فقط تابع صدا زده شد)
  uploadRequestStarted: boolean;
  uploadOutcome: UploadOutcome;
  cleanupOutcome: CleanupOutcome;
}

// ============================================================
// determineExitCode — با invariant جدید
// ============================================================

function determineExitCode(state: RunState): number {
  const {
    uploadRequestStarted,
    uploadOutcome,
    cleanupOutcome,
  } = state;

  // ⚠️ Invariant: upload=failed فقط وقتی requestStarted = false
  if (uploadOutcome === "failed" && uploadRequestStarted) {
    console.error("   ❌ Invariant violated: upload=failed with requestStarted=true");
    return 2;
  }

  // موفقیت کامل
  if (
    !state.configErrorBeforeUpload &&
    !state.configErrorAfterUpload &&
    uploadOutcome === "success" &&
    cleanupOutcome === "success"
  ) {
    return 0;
  }

  // config error قبل از شروع درخواست
  if (state.configErrorBeforeUpload && !uploadRequestStarted) {
    return 1;
  }

  // config error بعد از شروع
  if (state.configErrorAfterUpload) {
    return 2;
  }

  // upload unknown
  if (uploadOutcome === "unknown") return 2;

  // upload failed (قطعاً requestStarted = false)
  if (uploadOutcome === "failed") return 1;

  // cleanup unknown/skipped
  if (cleanupOutcome === "unknown" || cleanupOutcome === "skipped") return 2;

  // cleanup failed
  if (cleanupOutcome === "failed") return 1;

  return 2;
}

// ============================================================
// attemptCleanup
// ============================================================

async function attemptCleanup(
  verifiedConfig: TestStorageConfig,
  attemptedPath: string,
  uploadOutcome: UploadOutcome
): Promise<CleanupOutcome> {
  if (uploadOutcome !== "success" && uploadOutcome !== "unknown") {
    return "skipped";
  }

  try {
    await testCleanup(verifiedConfig, attemptedPath);
  } catch {
    // نادیده
  }

  const verifyResult = await checkFileExists(verifiedConfig, attemptedPath);

  if (verifyResult.exists === null) {
    logWarning("VERIFY_DELETE_UNKNOWN");
    return "unknown";
  }

  if (verifyResult.exists === true) {
    logError("VERIFY_DELETE_FAILED");
    return "failed";
  }

  if (uploadOutcome === "success") {
    return "success";
  }

  return "unknown";
}

// ============================================================
// main
// ============================================================

async function main(): Promise<void> {
  console.log("════════════════════════════════════════");
  console.log("🧪 Test Storage Real — Test Project Only");
  console.log("════════════════════════════════════════");

  const state: RunState = {
    configErrorBeforeUpload: null,
    configErrorAfterUpload: null,
    uploadRequestStarted: false,
    uploadOutcome: "unknown",
    cleanupOutcome: "skipped",
  };

  let verifiedConfig: TestStorageConfig | null = null;
  let attemptedPath: string | null = null;

  try {
    // 1. Load config
    try {
      console.log("\n📌 Step 1: Load config");
      verifiedConfig = loadTestStorageConfig();
      console.log("   ✅ Config loaded (URL hidden)");
    } catch (e) {
      if (e instanceof TestError) {
        state.configErrorBeforeUpload = e.code;
        logError(e.code, "step 1");
      } else {
        state.configErrorBeforeUpload = "UNEXPECTED";
        logError("UNEXPECTED", "step 1");
      }
    }

    // 2. Verify URL
    if (verifiedConfig && !state.configErrorBeforeUpload) {
      try {
        console.log("\n📌 Step 2: Verify test project URL");
        verifyTestProjectUrl(verifiedConfig);
        console.log("   ✅ URL verified: test project only");
      } catch (e) {
        if (e instanceof TestError) {
          state.configErrorBeforeUpload = e.code;
          logError(e.code, "step 2");
        } else {
          state.configErrorBeforeUpload = "UNEXPECTED";
          logError("UNEXPECTED", "step 2");
        }
      }
    }

    // 3. Verify bucket
    if (verifiedConfig && !state.configErrorBeforeUpload) {
      try {
        console.log("\n📌 Step 3: Verify bucket exists");
        await verifyBucketExists(verifiedConfig);
        console.log(`   ✅ Bucket "${verifiedConfig.bucket}" exists`);
      } catch (e) {
        if (e instanceof TestError) {
          state.configErrorBeforeUpload = e.code;
          logError(e.code, "step 3");
        } else {
          state.configErrorBeforeUpload = "UNEXPECTED";
          logError("UNEXPECTED", "step 3");
        }
      }
    }

    // 4. Upload
    if (verifiedConfig && !state.configErrorBeforeUpload) {
      try {
        console.log("\n📌 Step 4: Upload test file");
        const runId = buildRunId();
        const filename = buildFilename();
        const storagePath = buildAndValidateTestStoragePath(runId, filename);
        attemptedPath = storagePath;
        console.log(`   📁 Storage path: ${storagePath}`);

        const content = Buffer.from(`test-${Date.now()}`, "utf8");

        const attempt = await attemptUpload(
          verifiedConfig,
          storagePath,
          content,
          "text/plain"
        );

        state.uploadOutcome = attempt.outcome;
        // ⚠️ requestStarted از خود attempt
        state.uploadRequestStarted = attempt.requestStarted;

        if (attempt.outcome === "success") {
          console.log(`   ✅ Upload succeeded`);
        } else if (attempt.outcome === "failed") {
          logError(attempt.errorCode ?? "UPLOAD_FAILED");
        } else {
          logWarning(attempt.errorCode ?? "UPLOAD_UNKNOWN");
        }
      } catch (e) {
        // خطای غیرمنتظره در attemptUpload (نباید اتفاق بیفته)
        state.uploadOutcome = "unknown";
        state.uploadRequestStarted = true;
        logError("UNEXPECTED", "step 4");
      }
    }

    // 5. Cleanup (مستقل)
    if (verifiedConfig && attemptedPath) {
      try {
        console.log("\n📌 Step 5: Cleanup");
        const cleanupOutcome = await attemptCleanup(
          verifiedConfig,
          attemptedPath,
          state.uploadOutcome
        );
        state.cleanupOutcome = cleanupOutcome;

        if (cleanupOutcome === "success") {
          console.log("   ✅ Cleanup succeeded");
        } else if (cleanupOutcome === "failed") {
          logError("CLEANUP_FAILED");
        } else if (cleanupOutcome === "unknown") {
          logWarning("CLEANUP_UNKNOWN");
        } else {
          console.log("   ⏭️  Cleanup skipped");
        }
      } catch {
        state.cleanupOutcome = "unknown";
        logWarning("CLEANUP_UNKNOWN");
      }
    }
  } catch (e) {
    if (state.uploadRequestStarted) {
      state.configErrorAfterUpload = "UNEXPECTED";
    } else {
      state.configErrorBeforeUpload = "UNEXPECTED";
    }
    logError("UNEXPECTED", "main");
  } finally {
    console.log("\n════════════════════════════════════════");
    console.log("📊 Final Report:");
    console.log(`   Config:  ${state.configErrorBeforeUpload || state.configErrorAfterUpload ? "❌ FAIL" : "✅ PASS"}`);
    console.log(`   Upload:  ${formatOutcome(state.uploadOutcome)}`);
    console.log(`   Cleanup: ${formatOutcome(state.cleanupOutcome)}`);

    if (attemptedPath && state.cleanupOutcome !== "success") {
      console.log(`   ⚠️  Possible orphan: ${attemptedPath}`);
    }

    console.log("════════════════════════════════════════");

    const exitCode = determineExitCode(state);

    if (exitCode === 0) {
      console.log("🎉 All storage tests passed!");
    } else if (exitCode === 1) {
      console.log("❌ FAILED");
    } else {
      console.log("⚠️  UNKNOWN — manual review required");
    }

    process.exitCode = exitCode;
  }
}

// ============================================================
// main().catch()
// ============================================================

main().catch(() => {
  console.error("❌ Fatal error — state unknown");
  process.exitCode = 2;
});