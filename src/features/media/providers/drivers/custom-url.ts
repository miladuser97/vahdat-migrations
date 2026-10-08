// src/features/media/providers/drivers/custom-url.ts
// Provider: Custom URL
// ادمین یه URL عکس می‌ده، این provider URL رو validate می‌کنه
// و به عنوان نتیجه برمی‌گردونه.
//
// ⚠️ در Stage 2:
//   - فایل دانلود نمی‌شه
//   - Supabase Storage استفاده نمی‌شه
//   - فقط validation + metadata

import type { MediaProviderDriver } from "../types";
import type {
  ProviderSearchQuery,
  ProviderSearchResult,
} from "../../types";

// ============================================================
// نوع داخلی برای Custom URL
// ============================================================
interface CustomUrlInput {
  url: string;
  title?: string;
  alt?: string;
}

// ============================================================
// URL Validation — حداقل SSRF protection
// ============================================================

const BLOCKED_PROTOCOLS = ["file:", "data:", "javascript:", "ftp:", "gopher:"];
const BLOCKED_HOSTS = [
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "metadata.google.internal",
];

const MAX_URL_LENGTH = 2048;

interface UrlValidationResult {
  valid: boolean;
  reason?: string;
}

function validateUrl(rawUrl: string): UrlValidationResult {
  // چک طول
  if (!rawUrl || rawUrl.length > MAX_URL_LENGTH) {
    return { valid: false, reason: "URL_TOO_LONG_OR_EMPTY" };
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { valid: false, reason: "INVALID_URL_FORMAT" };
  }

  // فقط http و https
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { valid: false, reason: `PROTOCOL_NOT_ALLOWED: ${parsed.protocol}` };
  }

  // چک پروتکل‌های مسدود
  if (BLOCKED_PROTOCOLS.includes(parsed.protocol)) {
    return { valid: false, reason: `BLOCKED_PROTOCOL: ${parsed.protocol}` };
  }

  // چک hostهای مسدود (SSRF)
  const hostname = parsed.hostname.toLowerCase();
  if (BLOCKED_HOSTS.includes(hostname)) {
    return { valid: false, reason: `BLOCKED_HOST: ${hostname}` };
  }

  // چک IPهای خصوصی (SSRF)
  if (isPrivateIp(hostname)) {
    return { valid: false, reason: `PRIVATE_IP_NOT_ALLOWED: ${hostname}` };
  }

  return { valid: true };
}

/**
 * تشخیص IP خصوصی
 * فقط IPv4 ساده رو چک می‌کنه — کافیه برای Stage 2
 */
function isPrivateIp(hostname: string): boolean {
  // IPv4 ساده
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const match = hostname.match(ipv4Regex);
  if (!match) return false;

  const parts = match.slice(1).map((p) => parseInt(p, 10));
  const [a, b] = parts;

  // 10.0.0.0/8
  if (a === 10) return true;
  // 172.16.0.0/12
  if (a === 172 && b >= 16 && b <= 31) return true;
  // 192.168.0.0/16
  if (a === 192 && b === 168) return true;
  // 127.0.0.0/8
  if (a === 127) return true;
  // 169.254.0.0/16 (link-local)
  if (a === 169 && b === 254) return true;

  return false;
}

// ============================================================
// استخراج metadata اولیه از URL
// ============================================================

function extractFileName(url: string): string {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname;
    const segments = pathname.split("/").filter(Boolean);
    const last = segments[segments.length - 1] || "image";
    return decodeURIComponent(last);
  } catch {
    return "image";
  }
}

function guessMimeTypeFromExtension(fileName: string): string | undefined {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".svg")) return "image/svg+xml";
  if (lower.endsWith(".avif")) return "image/avif";
  return undefined;
}

// ============================================================
// Driver
// ============================================================

export const customUrlProvider: MediaProviderDriver = {
  slug: "custom-url",
  name: "لینک دستی",
  description: "افزودن عکس با وارد کردن URL مستقیم",
  capabilities: {
    search: true,
    bulk: false,
    license: false,
    requiresApiKey: false,
  },

  async search(query: ProviderSearchQuery): Promise<ProviderSearchResult[]> {
    // ⚠️ نکته: در Stage 2، URL از query میاد
    // در Stage 4، یه type جداگانه CustomUrlInput خواهیم داشت
    const rawUrl = (query as unknown as CustomUrlInput).url;

    if (!rawUrl) {
      return [];
    }

    const validation = validateUrl(rawUrl);
    if (!validation.valid) {
      console.warn(`[custom-url] URL رد شد: ${validation.reason}`);
      return [];
    }

    const fileName = extractFileName(rawUrl);
    const mimeType = guessMimeTypeFromExtension(fileName);
    const title = (query as unknown as CustomUrlInput).title || fileName;
    const alt = (query as unknown as CustomUrlInput).alt;

    return [
      {
        sourceUrl: rawUrl,
        previewUrl: rawUrl,
        downloadUrl: rawUrl,
        title,
        mimeType,
        raw: {
          provider: "custom-url",
          fileName,
          alt,
        },
      },
    ];
  },
};

// ============================================================
// Export کمکی برای validation
// ============================================================
export { validateUrl, isPrivateIp };