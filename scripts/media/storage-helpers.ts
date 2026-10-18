// scripts/media/storage-helpers.ts
// ⚠️ فقط برای تست — نه Production
// ⚠️ از server.ts import نمی‌کنه
// ⚠️ از Supabase SDK مستقیم استفاده می‌کنه

import { createClient, SupabaseClient } from "@supabase/supabase-js";

// ============================================================
// ثابت‌ها
// ============================================================

const EXPECTED_HOST = "whrfzvzysehggsqovqqj.supabase.co";
const FORBIDDEN_HOST_FRAGMENT = "bcmhykiruwbgovaxnwzr";
const ALLOWED_BUCKET = "product-media-test";
const TEST_PATH_PREFIX = "tests/";
const PAGE_LIMIT = 100;
const MAX_PAGES = 50;
const SAFE_RUNID = /^[a-zA-Z0-9_-]+$/;
const SAFE_FILENAME = /^[a-zA-Z0-9_.-]+$/;

// ============================================================
// Error Code
// ============================================================

export type ErrorCode =
  | "CONFIG_MISSING"
  | "URL_FORMAT_INVALID"
  | "URL_PROTOCOL_INVALID"
  | "URL_HAS_CREDENTIALS"
  | "URL_HAS_CUSTOM_PORT"
  | "URL_HAS_QUERY"
  | "URL_HAS_FRAGMENT"
  | "URL_IS_PRODUCTION"
  | "URL_HOST_MISMATCH"
  | "BUCKET_NOT_FOUND"
  | "BUCKET_LIST_FAILED"
  | "BUCKET_NOT_ALLOWED"
  | "UPLOAD_FAILED"
  | "UPLOAD_UNKNOWN"
  | "UPLOAD_PATH_MISMATCH"
  | "CLEANUP_FAILED"
  | "CLEANUP_UNKNOWN"
  | "VERIFY_DELETE_FAILED"
  | "VERIFY_DELETE_UNKNOWN"
  | "PATH_INVALID"
  | "UNEXPECTED";

export class TestError extends Error {
  constructor(public readonly code: ErrorCode) {
    super(`[${code}]`);
    this.name = "TestError";
  }
}

// ============================================================
// Types
// ============================================================

export interface TestStorageConfig {
  url: string;
  serviceRoleKey: string;
  bucket: string;
}

export type UploadOutcome = "success" | "failed" | "unknown";
export type CleanupOutcome = "success" | "failed" | "unknown" | "skipped";

export interface UploadAttempt {
  outcome: UploadOutcome;
  attemptedPath: string;
  confirmedPath: string | null;
  errorCode: ErrorCode | null;
  // ⚠️ requestStarted: true اگه درخواست نوشتنی واقعاً شروع شده باشه
  // verify failures: requestStarted = false
  // upload() صدا زده شد: requestStarted = true (حتی اگه fail بده)
  requestStarted: boolean;
}

export interface FileCheckResult {
  exists: boolean | null;
  errorCode: ErrorCode | null;
}

// ============================================================
// 1. Load config
// ============================================================

export function loadTestStorageConfig(): TestStorageConfig {
  const url = process.env.TEST_SUPABASE_URL;
  const serviceRoleKey = process.env.TEST_SUPABASE_SERVICE_ROLE_KEY;

  if (!url || url.trim() === "") {
    throw new TestError("CONFIG_MISSING");
  }
  if (!serviceRoleKey || serviceRoleKey.trim() === "") {
    throw new TestError("CONFIG_MISSING");
  }

  return {
    url: url.trim(),
    serviceRoleKey: serviceRoleKey.trim(),
    bucket: ALLOWED_BUCKET,
  };
}

// ============================================================
// 2. Verify URL (strict)
// ============================================================

export function verifyTestProjectUrl(config: TestStorageConfig): void {
  let parsed: URL;
  try {
    parsed = new URL(config.url);
  } catch {
    throw new TestError("URL_FORMAT_INVALID");
  }

  if (parsed.protocol !== "https:") {
    throw new TestError("URL_PROTOCOL_INVALID");
  }

  if (parsed.username !== "" || parsed.password !== "") {
    throw new TestError("URL_HAS_CREDENTIALS");
  }

  if (parsed.port !== "" && parsed.port !== "443") {
    throw new TestError("URL_HAS_CUSTOM_PORT");
  }

  if (parsed.search !== "") {
    throw new TestError("URL_HAS_QUERY");
  }

  if (parsed.hash !== "") {
    throw new TestError("URL_HAS_FRAGMENT");
  }

  const hostname = parsed.hostname.toLowerCase();

  // ⚠️ اول Production
  if (
    hostname === `${FORBIDDEN_HOST_FRAGMENT}.supabase.co` ||
    hostname.includes(FORBIDDEN_HOST_FRAGMENT)
  ) {
    throw new TestError("URL_IS_PRODUCTION");
  }

  // ⚠️ بعد hostname دقیق
  if (hostname !== EXPECTED_HOST) {
    throw new TestError("URL_HOST_MISMATCH");
  }
}

// ============================================================
// 3. Verify bucket
// ============================================================

export function verifyTestBucket(config: TestStorageConfig): void {
  if (config.bucket !== ALLOWED_BUCKET) {
    throw new TestError("BUCKET_NOT_ALLOWED");
  }
}

// ============================================================
// 4. Create test client (فقط بعد از verify)
// ============================================================

function createTestClient(config: TestStorageConfig): SupabaseClient {
  return createClient(config.url, config.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// ============================================================
// 5. Verify bucket exists (با verify مستقل URL + bucket)
// ============================================================

export async function verifyBucketExists(
  config: TestStorageConfig
): Promise<void> {
  // ⚠️ verify URL + bucket قبل از ساخت client
  try {
    verifyTestProjectUrl(config);
    verifyTestBucket(config);
  } catch (e) {
    if (e instanceof TestError) throw e;
    throw new TestError("UNEXPECTED");
  }

  const client = createTestClient(config);

  let data;
  try {
    const result = await client.storage.listBuckets();
    data = result.data;
    if (result.error) throw new TestError("BUCKET_LIST_FAILED");
  } catch (e) {
    if (e instanceof TestError) throw e;
    throw new TestError("BUCKET_LIST_FAILED");
  }

  if (!Array.isArray(data)) {
    throw new TestError("BUCKET_LIST_FAILED");
  }

  const exists = data.some((b) => b.name === config.bucket);
  if (!exists) {
    throw new TestError("BUCKET_NOT_FOUND");
  }
}

// ============================================================
// 6. Build + validate storage path
// ============================================================

export function buildAndValidateTestStoragePath(
  runId: string,
  filename: string
): string {
  if (!runId || !SAFE_RUNID.test(runId) || runId === "." || runId === "..") {
    throw new TestError("PATH_INVALID");
  }
  if (
    !filename ||
    !SAFE_FILENAME.test(filename) ||
    filename === "." ||
    filename === ".."
  ) {
    throw new TestError("PATH_INVALID");
  }

  const storagePath = `${TEST_PATH_PREFIX}${runId}/${filename}`;
  validateTestStoragePath(storagePath);
  return storagePath;
}

export function validateTestStoragePath(storagePath: string): void {
  if (!storagePath || typeof storagePath !== "string") {
    throw new TestError("PATH_INVALID");
  }

  if (!storagePath.startsWith(TEST_PATH_PREFIX)) {
    throw new TestError("PATH_INVALID");
  }

  if (storagePath.includes("//")) {
    throw new TestError("PATH_INVALID");
  }

  const segments = storagePath.split("/");
  if (segments.length !== 3) {
    throw new TestError("PATH_INVALID");
  }

  const [prefix, runId, filename] = segments;

  if (prefix !== "tests") throw new TestError("PATH_INVALID");
  if (!runId || !SAFE_RUNID.test(runId) || runId === "." || runId === "..") {
    throw new TestError("PATH_INVALID");
  }
  if (
    !filename ||
    !SAFE_FILENAME.test(filename) ||
    filename === "." ||
    filename === ".."
  ) {
    throw new TestError("PATH_INVALID");
  }
}

// ============================================================
// 7. Attempt upload (three-state with requestStarted)
// ============================================================

export async function attemptUpload(
  config: TestStorageConfig,
  storagePath: string,
  content: Buffer,
  contentType: string
): Promise<UploadAttempt> {
  const attemptedPath = storagePath;

  // ⚠️ verify URL — requestStarted = false
  try {
    verifyTestProjectUrl(config);
  } catch (e) {
    return {
      outcome: "failed",
      attemptedPath,
      confirmedPath: null,
      errorCode: e instanceof TestError ? e.code : "UNEXPECTED",
      requestStarted: false,
    };
  }

  // ⚠️ verify bucket — requestStarted = false
  try {
    verifyTestBucket(config);
  } catch (e) {
    return {
      outcome: "failed",
      attemptedPath,
      confirmedPath: null,
      errorCode: e instanceof TestError ? e.code : "UNEXPECTED",
      requestStarted: false,
    };
  }

  // ⚠️ verify path — requestStarted = false
  try {
    validateTestStoragePath(storagePath);
  } catch {
    return {
      outcome: "failed",
      attemptedPath,
      confirmedPath: null,
      errorCode: "PATH_INVALID",
      requestStarted: false,
    };
  }

  // ⚠️ از این‌جا: requestStarted = true
  const client = createTestClient(config);

  try {
    const { data, error } = await client.storage
      .from(config.bucket)
      .upload(storagePath, content, { contentType, upsert: false });

    if (error) {
      return {
        outcome: "unknown",
        attemptedPath,
        confirmedPath: null,
        errorCode: "UPLOAD_UNKNOWN",
        requestStarted: true,
      };
    }

    if (!data || data.path !== storagePath) {
      return {
        outcome: "unknown",
        attemptedPath,
        confirmedPath: null,
        errorCode: "UPLOAD_PATH_MISMATCH",
        requestStarted: true,
      };
    }

    return {
      outcome: "success",
      attemptedPath,
      confirmedPath: storagePath,
      errorCode: null,
      requestStarted: true,
    };
  } catch {
    return {
      outcome: "unknown",
      attemptedPath,
      confirmedPath: null,
      errorCode: "UPLOAD_UNKNOWN",
      requestStarted: true,
    };
  }
}

// ============================================================
// 8. Cleanup (با verify مستقل URL + bucket)
// ============================================================

export async function testCleanup(
  config: TestStorageConfig,
  storagePath: string
): Promise<{ success: boolean; errorCode: ErrorCode | null }> {
  // ⚠️ verify URL + bucket قبل از هر چیز
  try {
    verifyTestProjectUrl(config);
    verifyTestBucket(config);
  } catch (e) {
    return {
      success: false,
      errorCode: e instanceof TestError ? e.code : "UNEXPECTED",
    };
  }

  // ⚠️ verify path
  try {
    validateTestStoragePath(storagePath);
  } catch {
    return { success: false, errorCode: "PATH_INVALID" };
  }

  const client = createTestClient(config);

  try {
    const { error } = await client.storage
      .from(config.bucket)
      .remove([storagePath]);

    if (error) {
      return { success: false, errorCode: "CLEANUP_FAILED" };
    }
    return { success: true, errorCode: null };
  } catch {
    return { success: false, errorCode: "CLEANUP_UNKNOWN" };
  }
}

// ============================================================
// 9. Check file exists (با verify مستقل URL + bucket)
// ============================================================

export async function checkFileExists(
  config: TestStorageConfig,
  storagePath: string
): Promise<FileCheckResult> {
  // ⚠️ verify URL + bucket قبل از ساخت client
  try {
    verifyTestProjectUrl(config);
    verifyTestBucket(config);
  } catch (e) {
    return {
      exists: null,
      errorCode: e instanceof TestError ? e.code : "UNEXPECTED",
    };
  }

  // ⚠️ verify path
  try {
    validateTestStoragePath(storagePath);
  } catch {
    return { exists: null, errorCode: "PATH_INVALID" };
  }

  const lastSlash = storagePath.lastIndexOf("/");
  const folder = storagePath.substring(0, lastSlash);
  const filename = storagePath.substring(lastSlash + 1);

  const client = createTestClient(config);

  let offset = 0;
  let pageCount = 0;
  let found = false;
  let allPagesComplete = false;

  while (pageCount < MAX_PAGES) {
    let data: Array<{ name: string }> | null;
    let error: unknown = null;

    try {
      const result = await client.storage.from(config.bucket).list(folder, {
        limit: PAGE_LIMIT,
        offset,
        sortBy: { column: "name", order: "asc" },
      });
      data = result.data;
      error = result.error;
    } catch {
      return { exists: null, errorCode: "VERIFY_DELETE_UNKNOWN" };
    }

    if (error) {
      return { exists: null, errorCode: "VERIFY_DELETE_UNKNOWN" };
    }

    if (!Array.isArray(data)) {
      return { exists: null, errorCode: "VERIFY_DELETE_UNKNOWN" };
    }

    if (data.some((f) => f.name === filename)) {
      found = true;
      allPagesComplete = true;
      break;
    }

    if (data.length < PAGE_LIMIT) {
      allPagesComplete = true;
      break;
    }

    offset += PAGE_LIMIT;
    pageCount++;
  }

  if (!allPagesComplete) {
    return { exists: null, errorCode: "VERIFY_DELETE_UNKNOWN" };
  }

  return { exists: found, errorCode: null };
}