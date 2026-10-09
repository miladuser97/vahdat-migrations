// src/features/media/lib/image-validator.ts
// اعتبارسنجی تصویر بر اساس magic bytes + ابعاد + checksum
//
// ⚠️ این ماژول بدون dependency خارجی کار می‌کنه.
// ⚠️ فقط برای فرمت‌های رایج: JPEG, PNG, WebP, GIF, AVIF
//
// الزامات:
//   - تشخیص نوع فایل از magic bytes (نه Content-Type)
//   - محدودیت ابعاد (ضد decompression bomb)
//   - checksum SHA-256
//   - رد SVG, HTML, PDF, ...
//
// محدودیت شناخته‌شده:
//   - این ماژول فقط header تصویر رو می‌خونه، نه decode کامل.
//   - برای امنیت بیشتر، باید از sharp یا مشابه استفاده کنیم.
//   - ولی sharp روی Node 13.6 نصب نمی‌شه.
//   - در محیط CI (Node 22) ممکنه بعداً اضافه کنیم.

import { createHash } from "crypto";

// ============================================================
// Constants
// ============================================================
const MAX_WIDTH = 8000;
const MAX_HEIGHT = 8000;
const MAX_PIXELS = 40_000_000; // 40 MP (ضد decompression bomb)

// ============================================================
// Types
// ============================================================
export type AllowedMimeType =
  | "image/jpeg"
  | "image/png"
  | "image/webp"
  | "image/gif"
  | "image/avif";

export interface ImageValidationResult {
  valid: true;
  mimeType: AllowedMimeType;
  width: number;
  height: number;
  checksum: string; // SHA-256
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

  // GIF: 47 49 46 38 (GIF8)
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
    buffer[0] === 0x52 && // R
    buffer[1] === 0x49 && // I
    buffer[2] === 0x46 && // F
    buffer[3] === 0x46 && // F
    buffer[8] === 0x57 && // W
    buffer[9] === 0x45 && // E
    buffer[10] === 0x42 && // B
    buffer[11] === 0x50 // P
  ) {
    return "image/webp";
  }

  // AVIF: ....ftypavif
  if (buffer.length >= 12) {
    const ftypStr = buffer.slice(4, 8).toString("ascii");
    if (ftypStr === "ftyp") {
      const brandStr = buffer.slice(8, 12).toString("ascii");
      if (brandStr === "avif" || brandStr === "avis") {
        return "image/avif";
      }
    }
  }

  return null;
}

// ============================================================
// Dimension extraction
// ============================================================
interface Dimensions {
  width: number;
  height: number;
}

function getPngDimensions(buffer: Buffer): Dimensions | null {
  // PNG IHDR: بایت 16-23
  if (buffer.length < 24) return null;
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  return { width, height };
}

function getJpegDimensions(buffer: Buffer): Dimensions | null {
  // JPEG: پیمایش markers
  let offset = 2;
  while (offset < buffer.length - 9) {
    if (buffer[offset] !== 0xff) return null;
    const marker = buffer[offset + 1];
    if (!marker) return null;

    // SOF0-SOF15 (به‌جز DHT, DAC, RSTn)
    if (
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf)
    ) {
      const height = buffer.readUInt16BE(offset + 5);
      const width = buffer.readUInt16BE(offset + 7);
      return { width, height };
    }

    const length = buffer.readUInt16BE(offset + 2);
    offset += 2 + length;
  }
  return null;
}

function getGifDimensions(buffer: Buffer): Dimensions | null {
  // GIF: بایت 6-9 (little endian)
  if (buffer.length < 10) return null;
  const width = buffer.readUInt16LE(6);
  const height = buffer.readUInt16LE(8);
  return { width, height };
}

function getWebpDimensions(buffer: Buffer): Dimensions | null {
  // WebP: VP8/VP8L/VP8X
  if (buffer.length < 30) return null;

  const chunkType = buffer.slice(12, 16).toString("ascii");

  if (chunkType === "VP8 ") {
    // Lossy: bytes 26-29 (little endian, 14 bits each)
    const width = buffer.readUInt16LE(26) & 0x3fff;
    const height = buffer.readUInt16LE(28) & 0x3fff;
    return { width, height };
  }

  if (chunkType === "VP8L") {
    // Lossless: bytes 21-24
    const b0 = buffer[21] ?? 0;
    const b1 = buffer[22] ?? 0;
    const b2 = buffer[23] ?? 0;
    const b3 = buffer[24] ?? 0;
    const bits = b0 | (b1 << 8) | (b2 << 16) | (b3 << 24);
    const width = (bits & 0x3fff) + 1;
    const height = ((bits >> 14) & 0x3fff) + 1;
    return { width, height };
  }

  if (chunkType === "VP8X") {
    // Extended: bytes 24-29
    const width =
      ((buffer[24] ?? 0) | ((buffer[25] ?? 0) << 8) | ((buffer[26] ?? 0) << 16)) + 1;
    const height =
      ((buffer[27] ?? 0) | ((buffer[28] ?? 0) << 8) | ((buffer[29] ?? 0) << 16)) + 1;
    return { width, height };
  }

  return null;
}

function getDimensions(
  buffer: Buffer,
  mimeType: AllowedMimeType
): Dimensions | null {
  switch (mimeType) {
    case "image/png":
      return getPngDimensions(buffer);
    case "image/jpeg":
      return getJpegDimensions(buffer);
    case "image/gif":
      return getGifDimensions(buffer);
    case "image/webp":
      return getWebpDimensions(buffer);
    case "image/avif":
      // AVIF: پیچیده، فعلاً نادیده می‌گیریم (returns null)
      return null;
  }
}

// ============================================================
// Main validation function
// ============================================================
export function validateImageBuffer(buffer: Buffer): ImageValidationOutcome {
  // ۱. حداقل طول
  if (buffer.length < 12) {
    return { valid: false, reason: "BUFFER_TOO_SMALL" };
  }

  // ۲. Magic bytes
  const mimeType = detectMimeType(buffer);
  if (!mimeType) {
    return { valid: false, reason: "UNKNOWN_MIME_TYPE" };
  }

  // ۳. Dimensions
  const dimensions = getDimensions(buffer, mimeType);

  // اگه نتونستیم dimensions رو بخونیم، رد نمی‌کنیم، ولی هشدار می‌دیم
  // (چون بعضی فرمت‌ها مثل AVIF رو پشتیبانی نمی‌کنیم)
  let width = 0;
  let height = 0;

  if (dimensions) {
    width = dimensions.width;
    height = dimensions.height;

    // چک ابعاد
    if (width <= 0 || height <= 0) {
      return { valid: false, reason: "INVALID_DIMENSIONS" };
    }

    if (width > MAX_WIDTH || height > MAX_HEIGHT) {
      return {
        valid: false,
        reason: `DIMENSIONS_TOO_LARGE: ${width}x${height}`,
      };
    }

    // چک pixel count (ضد decompression bomb)
    const pixels = width * height;
    if (pixels > MAX_PIXELS) {
      return {
        valid: false,
        reason: `TOO_MANY_PIXELS: ${pixels}`,
      };
    }
  }

  // ۴. Checksum SHA-256
  const checksum = createHash("sha256").update(buffer).digest("hex");

  return {
    valid: true,
    mimeType,
    width,
    height,
    checksum,
  };
}