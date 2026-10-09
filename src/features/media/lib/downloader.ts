// src/features/media/lib/downloader.ts
// Safe Downloader برای تصاویر خارجی
//
// ⚠️ این ماژول فقط Node.js 18+ (server-side) کار می‌کنه.
// ⚠️ از fetch built-in + AbortController استفاده می‌کنه.
//
// الزامات:
//   - timeout
//   - max size (10 MiB)
//   - max redirect
//   - شمارش bytes هنگام stream
//   - cleanup در timeout/fail
//   - log بدون token

import {
    validateUrlForDownload,
    sanitizeUrlForLog,
  } from "./url-security";
  
  // ============================================================
  // Constants
  // ============================================================
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MiB
  const MAX_REDIRECTS = 5;
  const DEFAULT_TIMEOUT_MS = 15_000; // 15 seconds
  
  // Content-Type های مجاز
  const ALLOWED_CONTENT_TYPES = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/avif",
  ];
  
  // ============================================================
  // Types
  // ============================================================
  export interface DownloadResult {
    success: true;
    buffer: Buffer;
    contentType: string;
    finalUrl: string;
    size: number;
  }
  
  export interface DownloadError {
    success: false;
    reason: string;
    statusCode?: number;
  }
  
  export type DownloadOutcome = DownloadResult | DownloadError;
  
  export interface DownloadOptions {
    timeoutMs?: number;
    maxSize?: number;
    maxRedirects?: number;
  }
  
  // ============================================================
  // isRedirect
  // ============================================================
  function isRedirectStatus(status: number): boolean {
    return [301, 302, 303, 307, 308].includes(status);
  }
  
  // ============================================================
  // Main download function
  // ============================================================
  export async function safeDownload(
    rawUrl: string,
    options: DownloadOptions = {}
  ): Promise<DownloadOutcome> {
    const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const maxSize = options.maxSize ?? MAX_FILE_SIZE;
    const maxRedirects = options.maxRedirects ?? MAX_REDIRECTS;
  
    let currentUrl = rawUrl;
    let redirectCount = 0;
  
    // AbortController برای timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
    try {
      while (redirectCount <= maxRedirects) {
        // ۱. Validate URL (structure + DNS)
        const validation = await validateUrlForDownload(currentUrl);
        if (!validation.valid || !validation.parsedUrl) {
          clearTimeout(timeoutId);
          return {
            success: false,
            reason: `URL_VALIDATION_FAILED: ${validation.reason}`,
          };
        }
  
        // ۲. Fetch (با redirect: manual)
        let response: Response;
        try {
          response = await fetch(currentUrl, {
            method: "GET",
            redirect: "manual",
            signal: controller.signal,
            headers: {
              "User-Agent": "MobileVahdatBot/1.0 (+https://vahdatqavinfinal.app)",
              Accept: "image/*",
            },
          });
        } catch (fetchError) {
          clearTimeout(timeoutId);
  
          if (fetchError instanceof Error && fetchError.name === "AbortError") {
            return { success: false, reason: "TIMEOUT" };
          }
  
          return {
            success: false,
            reason: `FETCH_FAILED: ${
              fetchError instanceof Error ? fetchError.message : String(fetchError)
            }`,
          };
        }
  
        // ۳. چک redirect
        if (isRedirectStatus(response.status)) {
          const location = response.headers.get("location");
          if (!location) {
            clearTimeout(timeoutId);
            return {
              success: false,
              reason: "REDIRECT_NO_LOCATION",
              statusCode: response.status,
            };
          }
  
          // Resolve relative redirect
          try {
            currentUrl = new URL(location, currentUrl).toString();
          } catch {
            clearTimeout(timeoutId);
            return {
              success: false,
              reason: "REDIRECT_INVALID_URL",
              statusCode: response.status,
            };
          }
  
          redirectCount++;
  
          if (redirectCount > maxRedirects) {
            clearTimeout(timeoutId);
            return {
              success: false,
              reason: `TOO_MANY_REDIRECTS: ${redirectCount}`,
            };
          }
  
          continue; // حلقه رو ادامه بده
        }
  
        // ۴. چک status
        if (!response.ok) {
          clearTimeout(timeoutId);
          return {
            success: false,
            reason: `HTTP_${response.status}`,
            statusCode: response.status,
          };
        }
  
        // ۵. چک Content-Type
        const contentType = response.headers.get("content-type") ?? "";
        const baseContentType = contentType.split(";")[0]?.trim().toLowerCase() ?? "";
  
        if (!ALLOWED_CONTENT_TYPES.includes(baseContentType)) {
          clearTimeout(timeoutId);
          return {
            success: false,
            reason: `CONTENT_TYPE_NOT_ALLOWED: ${baseContentType}`,
          };
        }
  
        // ۶. چک Content-Length (اگه موجود باشه)
        const contentLength = response.headers.get("content-length");
        if (contentLength) {
          const size = parseInt(contentLength, 10);
          if (!isNaN(size) && size > maxSize) {
            clearTimeout(timeoutId);
            return {
              success: false,
              reason: `FILE_TOO_LARGE_CONTENT_LENGTH: ${size}`,
            };
          }
        }
  
        // ۷. Stream + شمارش bytes
        if (!response.body) {
          clearTimeout(timeoutId);
          return { success: false, reason: "NO_RESPONSE_BODY" };
        }
  
        const chunks: Uint8Array[] = [];
        let receivedBytes = 0;
  
        try {
          const reader = response.body.getReader();
  
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
  
            receivedBytes += value.length;
  
            // چک زودهنگام اگه از سقف گذشت
            if (receivedBytes > maxSize) {
              reader.cancel().catch(() => {
                // ignore
              });
              clearTimeout(timeoutId);
              return {
                success: false,
                reason: `FILE_TOO_LARGE_STREAM: ${receivedBytes}`,
              };
            }
  
            chunks.push(value);
          }
        } catch (streamError) {
          clearTimeout(timeoutId);
  
          if (streamError instanceof Error && streamError.name === "AbortError") {
            return { success: false, reason: "TIMEOUT_DURING_STREAM" };
          }
  
          return {
            success: false,
            reason: `STREAM_FAILED: ${
              streamError instanceof Error ? streamError.message : String(streamError)
            }`,
          };
        }
  
        // ۸. ساخت Buffer
        clearTimeout(timeoutId);
        const buffer = Buffer.concat(chunks.map((c) => Buffer.from(c)));
  
        return {
          success: true,
          buffer,
          contentType: baseContentType,
          finalUrl: currentUrl,
          size: buffer.length,
        };
      }
  
      // اگه از حلقه بیرون زدیم بدون return
      clearTimeout(timeoutId);
      return {
        success: false,
        reason: `TOO_MANY_REDIRECTS: ${redirectCount}`,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      return {
        success: false,
        reason: `UNEXPECTED: ${
          error instanceof Error ? error.message : String(error)
        }`,
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }