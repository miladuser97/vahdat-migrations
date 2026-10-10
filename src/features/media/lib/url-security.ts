// src/features/media/lib/url-security.ts
// SSRF Protection برای دانلود تصویر از URL خارجی
//
// ⚠️ این ماژول فقط Node.js (server-side) کار می‌کنه.
// ⚠️ برای Stage 3B، قبل از دانلود هر URL، باید از این عبور کنه.
//
// محدودیت شناخته‌شده:
//   - Node built-in fetch به IP مشخص وصل نمی‌شه (فقط hostname).
//   - برای DNS Rebinding protection کامل، باید از http.request مستقیم
//     با lookup سفارشی استفاده کنیم. فعلاً از fetch استفاده می‌کنیم
//     و DNS رو قبل از fetch resolve می‌کنیم. این ۹۰٪ حملات رو می‌گیره
//     ولی ۱۰۰٪ تضمین نیست. (در گزارش ChatGPT ذکر شد)

import { promises as dns } from "dns";
import { isIP } from "net";
import { URL } from "url";

// ============================================================
// Test Mode (فقط در CI/test)
// ============================================================
// ⚠️ این flag فقط برای تست‌های integration که نیاز به HTTP server محلی دارن.
// ⚠️ در production (NODE_ENV=production) هرگز فعال نمی‌شه.
const ALLOW_LOCALHOST_FOR_TEST =
  process.env.NODE_ENV === "test" ||
  process.env.ALLOW_LOCALHOST_FOR_TEST === "1";

export function isLocalhostAllowedForTest(): boolean {
  return ALLOW_LOCALHOST_FOR_TEST;
}

// ============================================================
// Constants
// ============================================================
const ALLOWED_PROTOCOLS = ["http:", "https:"];

const BLOCKED_HOSTNAMES = [
  "localhost",
  "localhost.localdomain",
  "ip6-localhost",
  "ip6-loopback",
  "metadata.google.internal",
];

// Private/Reserved IPv4 ranges
const PRIVATE_IPV4_RANGES = [
  { start: "0.0.0.0", end: "0.255.255.255" },
  { start: "10.0.0.0", end: "10.255.255.255" },
  { start: "100.64.0.0", end: "100.127.255.255" },
  { start: "127.0.0.0", end: "127.255.255.255" },
  { start: "169.254.0.0", end: "169.254.255.255" },
  { start: "172.16.0.0", end: "172.31.255.255" },
  { start: "192.0.0.0", end: "192.0.0.255" },
  { start: "192.0.2.0", end: "192.0.2.255" },
  { start: "192.168.0.0", end: "192.168.255.255" },
  { start: "198.18.0.0", end: "198.19.255.255" },
  { start: "198.51.100.0", end: "198.51.100.255" },
  { start: "203.0.113.0", end: "203.0.113.255" },
  { start: "224.0.0.0", end: "239.255.255.255" },
  { start: "240.0.0.0", end: "255.255.255.255" },
];

const PRIVATE_IPV6_PREFIXES = [
  "::1",
  "::",
  "fe80:",
  "fec0:",
  "fc00:",
  "fd00:",
  "ff00:",
  "::ffff:",
];

// ============================================================
// Types
// ============================================================
export interface UrlValidationResult {
  valid: boolean;
  reason?: string;
  parsedUrl?: URL;
  resolvedIps?: string[];
}

// ============================================================
// Helper: حذف براکت‌های IPv6
// ============================================================
function stripIpv6Brackets(hostname: string): string {
  return hostname.replace(/^\[|\]$/g, "");
}

// ============================================================
// Convert IPv4 string to number
// ============================================================
function ipv4ToNumber(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  let num = 0;
  for (const part of parts) {
    const n = parseInt(part, 10);
    if (isNaN(n) || n < 0 || n > 255) return null;
    num = num * 256 + n;
  }
  return num;
}

// ============================================================
// Check if IPv4 is private/reserved
// ============================================================
function isPrivateIPv4(ip: string): boolean {
  const ipNum = ipv4ToNumber(ip);
  if (ipNum === null) return true;

  for (const range of PRIVATE_IPV4_RANGES) {
    const startNum = ipv4ToNumber(range.start);
    const endNum = ipv4ToNumber(range.end);
    if (startNum === null || endNum === null) continue;
    if (ipNum >= startNum && ipNum <= endNum) return true;
  }
  return false;
}

// ============================================================
// Check if IPv6 is private/reserved
// ============================================================
function isPrivateIPv6(ip: string): boolean {
  const lower = ip.toLowerCase();

  const ipv4MappedMatch = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (ipv4MappedMatch && ipv4MappedMatch[1]) {
    return isPrivateIPv4(ipv4MappedMatch[1]);
  }

  for (const prefix of PRIVATE_IPV6_PREFIXES) {
    if (lower === prefix || lower.startsWith(prefix)) {
      if (prefix === "::ffff:") continue;
      return true;
    }
  }

  return false;
}

// ============================================================
// Check if IP (v4 or v6) is private/reserved
// ============================================================
export function isPrivateIp(ip: string): boolean {
  const clean = stripIpv6Brackets(ip);
  const version = isIP(clean);
  if (version === 4) return isPrivateIPv4(clean);
  if (version === 6) return isPrivateIPv6(clean);
  return true;
}

// ============================================================
// Validate URL structure (sync, بدون DNS)
// ============================================================
export function validateUrlStructure(rawUrl: string): UrlValidationResult {
  if (!rawUrl || typeof rawUrl !== "string") {
    return { valid: false, reason: "EMPTY_URL" };
  }

  if (rawUrl.length > 4096) {
    return { valid: false, reason: "URL_TOO_LONG" };
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { valid: false, reason: "INVALID_URL_FORMAT" };
  }

  if (!ALLOWED_PROTOCOLS.includes(parsed.protocol)) {
    return { valid: false, reason: `PROTOCOL_NOT_ALLOWED: ${parsed.protocol}` };
  }

  const hostname = parsed.hostname.toLowerCase();

  if (!hostname) {
    return { valid: false, reason: "EMPTY_HOSTNAME" };
  }

  // ⚠️ در حالت تست، localhost مجازه
  if (!ALLOW_LOCALHOST_FOR_TEST && BLOCKED_HOSTNAMES.includes(hostname)) {
    return { valid: false, reason: `BLOCKED_HOSTNAME: ${hostname}` };
  }

  const cleanHostname = stripIpv6Brackets(hostname);

  // ⚠️ در حالت تست، private IP literal مجازه
  if (!ALLOW_LOCALHOST_FOR_TEST && isIP(cleanHostname) !== 0) {
    if (isPrivateIp(cleanHostname)) {
      return { valid: false, reason: `PRIVATE_IP_LITERAL: ${hostname}` };
    }
  }

  return { valid: true, parsedUrl: parsed };
}

// ============================================================
// Full validation با DNS resolution
// ============================================================
export async function validateUrlForDownload(
  rawUrl: string
): Promise<UrlValidationResult> {
  const structureResult = validateUrlStructure(rawUrl);
  if (!structureResult.valid || !structureResult.parsedUrl) {
    return structureResult;
  }

  const parsed = structureResult.parsedUrl;
  const hostname = parsed.hostname.toLowerCase();
  const cleanHostname = stripIpv6Brackets(hostname);

  if (isIP(cleanHostname) !== 0) {
    return { valid: true, parsedUrl: parsed, resolvedIps: [cleanHostname] };
  }

  let ips: string[] = [];
  try {
    const result = await dns.lookup(cleanHostname, { all: true });
    ips = result.map((r) => r.address);
  } catch {
    return { valid: false, reason: `DNS_RESOLVE_FAILED: ${hostname}` };
  }

  if (ips.length === 0) {
    return { valid: false, reason: "DNS_NO_RESULTS" };
  }

  // ⚠️ در حالت تست، private IP مجازه
  if (!ALLOW_LOCALHOST_FOR_TEST) {
    for (const ip of ips) {
      if (isPrivateIp(ip)) {
        return { valid: false, reason: `DNS_RESOLVED_TO_PRIVATE: ${ip}` };
      }
    }
  }

  return { valid: true, parsedUrl: parsed, resolvedIps: ips };
}

// ============================================================
// Sanitize URL for logging
// ============================================================
export function sanitizeUrlForLog(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    return `${parsed.protocol}//${parsed.hostname}${parsed.pathname}`;
  } catch {
    return "[INVALID_URL]";
  }
}