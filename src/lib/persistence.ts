"use client";

// ============================================================
// خواندن از localStorage
// ============================================================
export function getFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;

  try {
    const item = window.localStorage.getItem(key);
    if (!item) return defaultValue;
    return JSON.parse(item) as T;
  } catch {
    return defaultValue;
  }
}

// ============================================================
// ذخیره در localStorage
// ============================================================
export function setToStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // TODO: ثبت خطا در logger
  }
}

// ============================================================
// حذف از localStorage
// ============================================================
export function removeFromStorage(key: string): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(key);
  } catch {
    // TODO: ثبت خطا در logger
  }
}

// ============================================================
// پاک کردن کل localStorage
// ============================================================
export function clearStorage(): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.clear();
  } catch {
    // TODO: ثبت خطا در logger
  }
}

// ============================================================
// ✅ کلید سبد خرید در localStorage
// ============================================================
const CART_STORAGE_KEY = "vahdat_cart";

// ============================================================
// ✅ خواندن سبد خرید از localStorage
// ============================================================
export function loadCart<T = unknown>(): T[] | null {
  return getFromStorage<T[] | null>(CART_STORAGE_KEY, null);
}

// ============================================================
// ✅ ذخیره سبد خرید در localStorage
// ============================================================
export function saveCart<T>(cart: T[]): void {
  setToStorage(CART_STORAGE_KEY, cart);
}