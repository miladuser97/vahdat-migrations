// src/features/media/lib/image-validator.ts
// اعتبارسنجی تصویر با magic bytes + decode واقعی (sharp)
//
// ⚠️ این ماژول Node 18+ (server-side) کار می‌کنه.
// ⚠️ sharp روی Node 13.6 نصب نمی‌شه، ولی در CI (Node 22) کار می‌کنه.
//
// محافظت‌ها:
//   - magic bytes (content-type اسپوف نکنه)
//   - decode واقعی با sharp
//   - محدودیت عرض، ارتفاع، پیکسل (ضد decompression bomb)
//   - محدودیت حجم فایل
//   - SHA-256 checksum

import { createHash } from "crypto";
import sharp from "sharp";

// ============================================================
// Constants
// ============================================================
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MiB
const MAX_WIDTH = 8000;
const MAX_HEIGHT = 8000;
const MAX_PIXELS = 40_000_000; // 40 MP
const DECODE_TIMEOUT_MS = 5000;

// ============================================================
// Types
// ============================================================
export type AllowedMimeType =
  | "image/jpeg"
  | "image/png"
  | "image/webp"
  | "image/gif";

export interface ImageValidationResult {
  valid: true;
  mimeType: AllowedMimeType;
  width: number;
  height: number;
  checksum: string;
  size: number;
}

export interface ImageValidationError {
  valid: false;
  reason: string;
}

export type ImageValidationOutcome =
  | ImageValidationResult
  | ImageValidationError;

// ============================================================
// Magic bytes detection
// ============================================================
function detectMimeType(buffer: Buffer): AllowedMimeType | null {
  // JPEG: FF D8 FF
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return "image/jpeg";
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }

  // GIF: GIF8
  if (
    buffer.length >= 6 &&
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38
  ) {
    return "image/gif";
  }

  // WebP: RIFF....WEBP
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return "image/webp";
  }

  return null;
}

// ============================================================
// Decode با sharp (با timeout)
// ============================================================
async function decodeImage(
  buffer: Buffer
): Promise<{ width: number; height: number } | null> {
  try {
    // timeout: sharp ممکنه روی فایل مخرب گیر کنه
    const decodePromise = sharp(buffer, {
      // محدودیت‌ها رو به sharp می‌دیم (fast-fail)
      limitInputPixels: MAX_PIXELS,
      // failOn: null for safety
      failOn: "none",
    }).metadata();

    const timeoutPromise = new Promise<null>((resolve) => {
      setTimeout(() => resolve(null), DECODE_TIMEOUT_MS);
    });

    const metadata = await Promise.race([decodePromise, timeoutPromise]);
    if (!metadata) return null;

    const width = metadata.width;
    const height = metadata.height;

    if (!width || !height) return null;

    // ⚠️ فقط metadata می‌خونیم. برای decode کامل payload،
    // باید از toBuffer استفاده کنیم. ولی این کار CPU-intensive هست.
    // برای امنیت بیشتر، حداقل یک decode سطحی انجام بدیم:

    // decode واقعی (small resize) برای تأیید محتوا
    await sharp(buffer, {
      limitInputPixels: MAX_PIXELS,
      failOn: "none",
    })
      .resize(10, 10, { fit: "inside" })
      .toBuffer();

    return { width, height };
  } catch {
    return null;
  }
}

// ============================================================
// Main validation function
// ============================================================
export async function validateImageBuffer(
  buffer: Buffer
): Promise<ImageValidationOutcome> {
  // ۱. حجم
  if (buffer.length === 0) {
    return { valid: false, reason: "EMPTY_BUFFER" };
  }
  if (buffer.length > MAX_FILE_SIZE) {
    return {
      valid: false,
      reason: `FILE_TOO_LARGE: ${buffer.length}`,
    };
  }

  // ۲. حداقل طول
  if (buffer.length < 12) {
    return { valid: false, reason: "BUFFER_TOO_SMALL" };
  }

  // ۳. Magic bytes
  const mimeType = detectMimeType(buffer);
  if (!mimeType) {
    return { valid: false, reason: "UNKNOWN_MIME_TYPE" };
  }

  // ۴. Decode واقعی
  const decoded = await decodeImage(buffer);
  if (!decoded) {
    return { valid: false, reason: "DECODE_FAILED" };
  }

  const { width, height } = decoded;

  // ۵. ابعاد
  if (width <= 0 || height <= 0) {
    return { valid: false, reason: "INVALID_DIMENSIONS" };
  }
  if (width > MAX_WIDTH || height > MAX_HEIGHT) {
    return {
      valid: false,
      reason: `DIMENSIONS_TOO_LARGE: ${width}x${height}`,
    };
  }

  const pixels = width * height;
  if (pixels > MAX_PIXELS) {
    return { valid: false, reason: `TOO_MANY_PIXELS: ${pixels}` };
  }

  // ۶. checksum
  const checksum = createHash("sha256").update(buffer).digest("hex");

  return {
    valid: true,
    mimeType,
    width,
    height,
    checksum,
    size: buffer.length,
  };
}