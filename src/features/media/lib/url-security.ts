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
  // 0.0.0.0/8 — "this network"
  { start: "0.0.0.0", end: "0.255.255.255" },
  // 10.0.0.0/8 — private
  { start: "10.0.0.0", end: "10.255.255.255" },
  // 100.64.0.0/10 — carrier-grade NAT
  { start: "100.64.0.0", end: "100.127.255.255" },
  // 127.0.0.0/8 — loopback
  { start: "127.0.0.0", end: "127.255.255.255" },
  // 169.254.0.0/16 — link-local (AWS metadata!)
  { start: "169.254.0.0", end: "169.254.255.255" },
  // 172.16.0.0/12 — private
  { start: "172.16.0.0", end: "172.31.255.255" },
  // 192.0.0.0/24 — IETF protocol assignments
  { start: "192.0.0.0", end: "192.0.0.255" },
  // 192.0.2.0/24 — TEST-NET-1
  { start: "192.0.2.0", end: "192.0.2.255" },
  // 192.168.0.0/16 — private
  { start: "192.168.0.0", end: "192.168.255.255" },
  // 198.18.0.0/15 — benchmark
  { start: "198.18.0.0", end: "198.19.255.255" },
  // 198.51.100.0/24 — TEST-NET-2
  { start: "198.51.100.0", end: "198.51.100.255" },
  // 203.0.113.0/24 — TEST-NET-3
  { start: "203.0.113.0", end: "203.0.113.255" },
  // 224.0.0.0/4 — multicast
  { start: "224.0.0.0", end: "239.255.255.255" },
  // 240.0.0.0/4 — reserved
  { start: "240.0.0.0", end: "255.255.255.255" },
];

// Private/Reserved IPv6 prefixes (به‌صورت string prefix)
const PRIVATE_IPV6_PREFIXES = [
  "::1",          // loopback
  "::",           // unspecified
  "fe80:",        // link-local
  "fec0:",        // site-local (deprecated)
  "fc00:",        // unique local (ULA)
  "fd00:",        // unique local (ULA)
  "ff00:",        // multicast
  "::ffff:",      // IPv4-mapped (باید چک بشه)
];

// ============================================================
// Types
// ============================================================
export interface UrlValidationResult {
  valid: boolean;
  reason?: string;
  // اگه valid، اینا پر می‌شن:
  parsedUrl?: URL;
  resolvedIps?: string[];
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
  if (ipNum === null) return true; // invalid → block

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

  // IPv4-mapped: ::ffff:x.x.x.x
  const ipv4MappedMatch = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (ipv4MappedMatch && ipv4MappedMatch[1]) {
    return isPrivateIPv4(ipv4MappedMatch[1]);
  }

  // IPv4-mapped (hex): ::ffff:xxxx:xxxx
  // Rare, skip for now

  for (const prefix of PRIVATE_IPV6_PREFIXES) {
    if (lower === prefix || lower.startsWith(prefix)) {
      // ::ffff: needs special care — already handled
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
  const version = isIP(ip);
  if (version === 4) return isPrivateIPv4(ip);
  if (version === 6) return isPrivateIPv6(ip);
  return true; // unknown → block
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

  // Protocol
  if (!ALLOWED_PROTOCOLS.includes(parsed.protocol)) {
    return { valid: false, reason: `PROTOCOL_NOT_ALLOWED: ${parsed.protocol}` };
  }

  // Hostname
  const hostname = parsed.hostname.toLowerCase();

  if (!hostname) {
    return { valid: false, reason: "EMPTY_HOSTNAME" };
  }

  // Blocked hostnames
  if (BLOCKED_HOSTNAMES.includes(hostname)) {
    return { valid: false, reason: `BLOCKED_HOSTNAME: ${hostname}` };
  }

  // اگه hostname یه IP literal بود، مستقیم چک کن
  if (isIP(hostname) !== 0) {
    if (isPrivateIp(hostname)) {
      return { valid: false, reason: `PRIVATE_IP_LITERAL: ${hostname}` };
    }
  }

  return { valid: true, parsedUrl: parsed };
}

// ============================================================
// Full validation با DNS resolution
// ⚠️ این تابع async هست چون DNS resolve می‌کنه
// ============================================================
export async function validateUrlForDownload(
  rawUrl: string
): Promise<UrlValidationResult> {
  // ۱. Structure
  const structureResult = validateUrlStructure(rawUrl);
  if (!structureResult.valid || !structureResult.parsedUrl) {
    return structureResult;
  }

  const parsed = structureResult.parsedUrl;
  const hostname = parsed.hostname.toLowerCase();

  // ۲. اگه IP literal بود، چک بالا کافیه
  if (isIP(hostname) !== 0) {
    return { valid: true, parsedUrl: parsed, resolvedIps: [hostname] };
  }

  // ۳. DNS resolve
  let ips: string[] = [];
  try {
    const result = await dns.lookup(hostname, { all: true });
    ips = result.map((r) => r.address);
  } catch {
    return { valid: false, reason: `DNS_RESOLVE_FAILED: ${hostname}` };
  }

  if (ips.length === 0) {
    return { valid: false, reason: "DNS_NO_RESULTS" };
  }

  // ۴. چک همه‌ی IPها
  for (const ip of ips) {
    if (isPrivateIp(ip)) {
      return { valid: false, reason: `DNS_RESOLVED_TO_PRIVATE: ${ip}` };
    }
  }

  // ⚠️ محدودیت: چون از fetch استفاده می‌کنیم، نمی‌تونیم IP رو pin کنیم.
  // در آینده باید از http.request با lookup سفارشی استفاده کنیم.
  // فعلاً DNS قبل از fetch resolve می‌کنیم (۹۰٪ محافظت).

  return { valid: true, parsedUrl: parsed, resolvedIps: ips };
}

// ============================================================
// Sanitize URL for logging (حذف token, query, fragment)
// ============================================================
export function sanitizeUrlForLog(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    // فقط protocol + hostname + pathname
    return `${parsed.protocol}//${parsed.hostname}${parsed.pathname}`;
  } catch {
    return "[INVALID_URL]";
  }
}