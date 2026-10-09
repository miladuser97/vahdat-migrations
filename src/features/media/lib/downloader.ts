// src/features/media/lib/downloader.ts
// Safe Downloader با IP Pinning برای جلوگیری از DNS Rebinding
//
// ⚠️ این ماژول فقط Node.js 18+ (server-side) کار می‌کنه.
// ⚠️ از http.request / https.request با lookup سفارشی استفاده می‌کنه.
//
// محافظت‌ها:
//   - DNS resolve قبل از اتصال
//   - IP pinning: اتصال فقط به IP تأییدشده
//   - SNI + Host header درست
//   - redirect: manual + validate هر مرحله
//   - timeout + max size + max redirect
//   - شمارش bytes هنگام stream
//   - log بدون token/credentials

import http from "http";
import https from "https";
import { URL } from "url";
import type { LookupFunction } from "net";
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

const ALLOWED_CONTENT_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
];

const USER_AGENT = "MobileVahdatBot/1.0 (+https://vahdatqavinfinal.app)";

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
// Helpers
// ============================================================
function isRedirectStatus(status: number): boolean {
  return [301, 302, 303, 307, 308].includes(status);
}

/**
 * انتخاب IP مناسب برای اتصال
 * - ترجیح IPv4
 * - fallback به IPv6
 */
function pickIpForConnection(ips: string[]): string {
  // ترجیح IPv4 (ساده‌تر، معمول‌تر)
  const ipv4 = ips.find((ip) => ip.includes("."));
  if (ipv4) return ipv4;

  // fallback به IPv6
  if (ips[0]) return ips[0];

  throw new Error("NO_IP_AVAILABLE");
}

/**
 * حذف information حساس از پیام خطا
 */
function sanitizeError(err: unknown): string {
  if (err instanceof Error) {
    // فقط type خطا
    return err.name || "NETWORK_ERROR";
  }
  return "NETWORK_ERROR";
}

// ============================================================
// Core: fetch با IP pinning
// ============================================================
interface FetchResult {
  statusCode: number;
  headers: http.IncomingHttpHeaders;
  buffer: Buffer;
}

async function fetchWithIpPinning(
  url: string,
  pinnedIp: string,
  timeoutMs: number,
  maxSize: number
): Promise<FetchResult> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const isHttps = parsed.protocol === "https:";
    const lib = isHttps ? https : http;
    const port = parsed.port
      ? parseInt(parsed.port, 10)
      : isHttps
      ? 443
      : 80;

    // ⚠️ custom lookup: DNS رو نادیده می‌گیره، IP رو pin می‌کنه
    const customLookup: LookupFunction = (
      _hostname,
      _options,
      callback
    ) => {
      // callback signature: (err, address, family)
      // ولی در برخی نسخه‌ها: (err, addresses[])
      if (typeof callback === "function") {
        const family = pinnedIp.includes(":") ? 6 : 4;
        // @ts-expect-error — Node type تفاوت داره
        callback(null, pinnedIp, family);
      }
    };

    const options: https.RequestOptions = {
      hostname: parsed.hostname,
      port,
      path: parsed.pathname + parsed.search,
      method: "GET",
      lookup: customLookup,
      headers: {
        Host: parsed.hostname,
        "User-Agent": USER_AGENT,
        Accept: "image/*",
      },
      // SNI برای HTTPS
      ...(isHttps ? { servername: parsed.hostname } : {}),
      // TLS
      ...(isHttps
        ? {
            rejectUnauthorized: true,
          }
        : {}),
    };

    let settled = false;
    const settle = (fn: () => void) => {
      if (!settled) {
        settled = true;
        fn();
      }
    };

    const req = lib.request(options, (res) => {
      const statusCode = res.statusCode ?? 0;
      const headers = res.headers;

      // اگه redirect هست، body نمی‌خونیم
      if (isRedirectStatus(statusCode)) {
        res.resume();
        settle(() => resolve({ statusCode, headers, buffer: Buffer.alloc(0) }));
        return;
      }

      // اگه خطا هست، body نمی‌خونیم
      if (statusCode < 200 || statusCode >= 300) {
        res.resume();
        settle(() => resolve({ statusCode, headers, buffer: Buffer.alloc(0) }));
        return;
      }

      const chunks: Buffer[] = [];
      let received = 0;

      res.on("data", (chunk: Buffer) => {
        received += chunk.length;
        if (received > maxSize) {
          res.destroy();
          settle(() =>
            reject(new Error(`FILE_TOO_LARGE_STREAM: ${received}`))
          );
          return;
        }
        chunks.push(chunk);
      });

      res.on("end", () => {
        settle(() =>
          resolve({
            statusCode,
            headers,
            buffer: Buffer.concat(chunks),
          })
        );
      });

      res.on("error", (err) => {
        settle(() => reject(new Error(sanitizeError(err))));
      });
    });

    // timeout
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      settle(() => reject(new Error("TIMEOUT")));
    });

    req.on("error", (err) => {
      const code = (err as NodeJS.ErrnoException).code;
      // DNS error
      if (code === "ENOTFOUND") {
        settle(() => reject(new Error("DNS_NOT_FOUND")));
        return;
      }
      settle(() => reject(new Error(sanitizeError(err))));
    });

    req.end();
  });
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

  const startTime = Date.now();

  try {
    while (redirectCount <= maxRedirects) {
      // چک timeout کل
      const elapsed = Date.now() - startTime;
      if (elapsed > timeoutMs) {
        return { success: false, reason: "TIMEOUT_TOTAL" };
      }
      const remainingTimeout = timeoutMs - elapsed;

      // ۱. Validate URL (structure + DNS)
      const validation = await validateUrlForDownload(currentUrl);
      if (!validation.valid || !validation.parsedUrl || !validation.resolvedIps) {
        return {
          success: false,
          reason: `URL_VALIDATION_FAILED: ${validation.reason ?? "unknown"}`,
        };
      }

      // ۲. IP pinning
      let pinnedIp: string;
      try {
        pinnedIp = pickIpForConnection(validation.resolvedIps);
      } catch {
        return { success: false, reason: "NO_VALID_IP" };
      }

      // ۳. fetch با IP pinning
      let fetchResult: FetchResult;
      try {
        fetchResult = await fetchWithIpPinning(
          currentUrl,
          pinnedIp,
          remainingTimeout,
          maxSize
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : "NETWORK_ERROR";
        return { success: false, reason: msg };
      }

      // ۴. redirect?
      if (isRedirectStatus(fetchResult.statusCode)) {
        const location = fetchResult.headers.location;
        if (!location || Array.isArray(location)) {
          return {
            success: false,
            reason: "REDIRECT_NO_LOCATION",
            statusCode: fetchResult.statusCode,
          };
        }

        try {
          currentUrl = new URL(location, currentUrl).toString();
        } catch {
          return {
            success: false,
            reason: "REDIRECT_INVALID_URL",
            statusCode: fetchResult.statusCode,
          };
        }

        redirectCount++;
        if (redirectCount > maxRedirects) {
          return { success: false, reason: "TOO_MANY_REDIRECTS" };
        }
        continue;
      }

      // ۵. status?
      if (fetchResult.statusCode < 200 || fetchResult.statusCode >= 300) {
        return {
          success: false,
          reason: `HTTP_${fetchResult.statusCode}`,
          statusCode: fetchResult.statusCode,
        };
      }

      // ۶. Content-Type?
      const contentType = fetchResult.headers["content-type"] ?? "";
      const baseContentType = String(contentType)
        .split(";")[0]
        ?.trim()
        .toLowerCase() ?? "";

      if (!ALLOWED_CONTENT_TYPES.includes(baseContentType)) {
        return {
          success: false,
          reason: `CONTENT_TYPE_NOT_ALLOWED: ${baseContentType}`,
        };
      }

      // ۷. Content-Length?
      const contentLength = fetchResult.headers["content-length"];
      if (contentLength) {
        const size = parseInt(String(contentLength), 10);
        if (!isNaN(size) && size > maxSize) {
          return { success: false, reason: `FILE_TOO_LARGE_HEADER: ${size}` };
        }
      }

      // ۸. موفق
      return {
        success: true,
        buffer: fetchResult.buffer,
        contentType: baseContentType,
        finalUrl: currentUrl,
        size: fetchResult.buffer.length,
      };
    }

    return { success: false, reason: "TOO_MANY_REDIRECTS" };
  } catch (err) {
    return {
      success: false,
      reason: `UNEXPECTED: ${sanitizeError(err)}`,
    };
  }
}

// ============================================================
// Export sanitize برای تست
// ============================================================
export { sanitizeUrlForLog };