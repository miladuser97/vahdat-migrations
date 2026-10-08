import { logger } from "@/lib/logger";
import { MESSAGES } from "@/constants/messages";

// ============================================================
// تایپ پاسخ استاندارد Server Actions
// ============================================================
export type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };

// ============================================================
// استخراج پیام خطای امن
// ============================================================
export function safeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (process.env.NODE_ENV === "development") {
      return error.message;
    }
  }
  return MESSAGES.GENERIC_ERROR;
}

// ============================================================
// Wrapper برای Server Actions
// ============================================================
export async function safeAction<T>(
  actionName: string,
  fn: () => Promise<T>
): Promise<ActionResult<T>> {
  try {
    const data = await fn();
    return { success: true, data };
  } catch (error) {
    logger.error(`خطا در Server Action: ${actionName}`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return {
      success: false,
      error: safeErrorMessage(error),
    };
  }
}

// ============================================================
// ✅ createSafeAction — برای سازگاری با کدهای قدیمی
// ============================================================
export async function createSafeAction<T>(
  actionName: string,
  fn: () => Promise<T>
): Promise<ActionResult<T>> {
  return safeAction(actionName, fn);
}

// ============================================================
// بررسی معتبر بودن ورودی
// ============================================================
export function isValidMobile(mobile: string): boolean {
  const cleaned = mobile.replace(/\D/g, "");
  return /^09\d{9}$/.test(cleaned);
}

// ============================================================
// پاکسازی شماره موبایل
// ============================================================
export function normalizeMobile(mobile: string): string {
  const cleaned = mobile
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/\D/g, "");

  if (cleaned.startsWith("98")) {
    return "0" + cleaned.slice(2);
  }
  if (cleaned.startsWith("9") && cleaned.length === 10) {
    return "0" + cleaned;
  }
  return cleaned;
}