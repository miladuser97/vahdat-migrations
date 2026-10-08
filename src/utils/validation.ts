/**
 * Generic, reusable validation helpers — pure functions only, no
 * external packages (no Zod/Yup/react-hook-form/etc., per this
 * project's rules), and no business logic (e.g. no "is this SKU valid
 * for our catalog" rule — that would belong to a future feature, not
 * here). Each function returns a boolean; deciding what error message
 * to show for a failed check is left to the caller (see FormMessage).
 */

export function required(value: unknown): boolean {
  if (typeof value === "string") {
    return value.trim().length > 0;
  }
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  return value !== undefined && value !== null;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}

export function minLength(value: string, min: number): boolean {
  return value.trim().length >= min;
}

export function maxLength(value: string, max: number): boolean {
  return value.trim().length <= max;
}

/**
 * Generic phone check — deliberately loose (7 to 15 digits, optional
 * leading "+"), since there is no confirmed country/format requirement
 * yet. Tighten this once a real requirement (e.g. a specific Iranian
 * mobile format) is confirmed, rather than guessing one now.
 */
const PHONE_PATTERN = /^\+?[0-9]{7,15}$/;

export function isPhone(value: string): boolean {
  return PHONE_PATTERN.test(value.trim());
}
