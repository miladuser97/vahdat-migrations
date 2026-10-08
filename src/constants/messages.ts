export const MESSAGES = {
  // ✅ خطاهای عمومی
  GENERIC_ERROR: "خطایی رخ داد. لطفاً دوباره تلاش کنید.",
  NETWORK_ERROR: "خطا در ارتباط با سرور. لطفاً اینترنت خود را بررسی کنید.",
  NOT_FOUND: "موردی که به دنبال آن بودید یافت نشد.",
  UNAUTHORIZED: "برای دسترسی به این بخش باید وارد شوید.",
  FORBIDDEN: "شما به این بخش دسترسی ندارید.",

  // ✅ احراز هویت
  LOGIN_SUCCESS: "با موفقیت وارد شدید.",
  LOGIN_FAILED: "شماره موبایل یا رمز عبور اشتباه است.",
  REGISTER_SUCCESS: "ثبت‌نام با موفقیت انجام شد.",
  REGISTER_FAILED: "خطا در ثبت‌نام. لطفاً دوباره تلاش کنید.",
  LOGOUT_SUCCESS: "با موفقیت خارج شدید.",
  INVALID_MOBILE: "شماره موبایل معتبر نیست.",
  INVALID_PASSWORD: "رمز عبور باید حداقل ۶ کاراکتر باشد.",
  MOBILE_EXISTS: "این شماره موبایل قبلاً ثبت شده است.",
  PASSWORD_MISMATCH: "رمز عبور و تکرار آن یکسان نیستند.",

  // ✅ سبد خرید
  ADD_TO_CART_SUCCESS: "محصول به سبد خرید اضافه شد.",
  ADD_TO_CART_FAILED: "خطا در افزودن به سبد خرید.",
  REMOVE_FROM_CART_SUCCESS: "محصول از سبد خرید حذف شد.",
  CART_EMPTY: "سبد خرید شما خالی است.",
  OUT_OF_STOCK: "این محصول موجود نیست.",

  // ✅ علاقه‌مندی‌ها
  ADD_TO_WISHLIST_SUCCESS: "به علاقه‌مندی‌ها اضافه شد.",
  REMOVE_FROM_WISHLIST_SUCCESS: "از علاقه‌مندی‌ها حذف شد.",

  // ✅ مقایسه
  ADD_TO_COMPARE_SUCCESS: "به لیست مقایسه اضافه شد.",
  REMOVE_FROM_COMPARE_SUCCESS: "از لیست مقایسه حذف شد.",
  COMPARE_LIMIT: "حداکثر ۴ محصول می‌توانید مقایسه کنید.",

  // ✅ سفارش
  ORDER_SUCCESS: "سفارش شما با موفقیت ثبت شد.",
  ORDER_FAILED: "خطا در ثبت سفارش. لطفاً دوباره تلاش کنید.",
  PAYMENT_SUCCESS: "پرداخت با موفقیت انجام شد.",
  PAYMENT_FAILED: "پرداخت ناموفق بود.",
  PAYMENT_CANCELLED: "پرداخت لغو شد.",

  // ✅ کوپن
  COUPON_APPLIED: "کد تخفیف اعمال شد.",
  COUPON_INVALID: "کد تخفیف معتبر نیست.",
  COUPON_EXPIRED: "کد تخفیف منقضی شده است.",

  // ✅ تعمیرات
  REPAIR_REQUEST_SUCCESS: "درخواست تعمیر ثبت شد. کد پیگیری برای شما ارسال می‌شود.",
  REPAIR_REQUEST_FAILED: "خطا در ثبت درخواست تعمیر.",

  // ✅ ادمین
  ADMIN_ACCESS_DENIED: "شما دسترسی ادمین ندارید.",
} as const;

export type MessageKey = keyof typeof MESSAGES;

// ============================================================
// ✅ پیام‌های خاص (برای سازگاری با کدهای قدیمی)
// ============================================================

// ✅ پیام "فروشگاه آماده نیست"
export const STORE_NOT_READY_MESSAGE =
  "این بخش از فروشگاه هنوز آماده نیست. لطفاً بعداً مراجعه کنید.";

// ✅ پیام "بخش Checkout آماده نیست"
export const CHECKOUT_SECTION_NOT_READY_MESSAGE =
  "این بخش از فرآیند خرید هنوز آماده نیست. لطفاً بعداً تلاش کنید.";