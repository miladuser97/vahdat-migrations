// ============================================================
// تبدیل اعداد به فارسی
// ============================================================
const PERSIAN_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

export function toPersianDigits(input: string | number): string {
  return String(input).replace(/\d/g, (d) => PERSIAN_DIGITS[Number(d)] ?? d);
}

// ============================================================
// تبدیل اعداد به انگلیسی
// ============================================================
export function toEnglishDigits(input: string): string {
  return input
    .replace(/[۰-۹]/g, (d) => String(PERSIAN_DIGITS.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

// ============================================================
// فرمت قیمت با جداکننده هزارگان
// ============================================================
export function formatPrice(
  price: number | string | null | undefined,
  options?: { persianDigits?: boolean; withCurrency?: boolean }
): string {
  if (price === null || price === undefined) return "—";

  const num = typeof price === "string" ? Number(price) : price;
  if (isNaN(num)) return "—";

  const formatted = num.toLocaleString("en-US");
  const withDigits = options?.persianDigits
    ? toPersianDigits(formatted)
    : formatted;

  if (options?.withCurrency) {
    return `${withDigits} تومان`;
  }

  return withDigits;
}

// ============================================================
// کوتاه کردن متن
// ============================================================
export function truncate(text: string, maxLength: number): string {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "...";
}

// ============================================================
// ساخت اسلاگ
// ============================================================
export function slugify(text: string): string {
  return text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u0600-\u06FF-]+/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// ============================================================
// محاسبه درصد تخفیف
// ============================================================
export function calculateDiscount(
  price: number,
  discountPrice: number
): number {
  if (!price || !discountPrice || discountPrice >= price) return 0;
  return Math.round(((price - discountPrice) / price) * 100);
}

// ============================================================
// ✅ نرمال‌سازی متن فارسی (برای جستجو)
// ============================================================
export function normalizePersian(text: string): string {
  if (!text) return "";

  return text
    // تبدیل اعداد فارسی/عربی به انگلیسی
    .replace(/[۰-۹]/g, (d) => String(PERSIAN_DIGITS.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    // یکسان‌سازی ی و ک عربی به فارسی
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    // حذف اعراب
    .replace(/[\u064B-\u0652]/g, "")
    // یکسان‌سازی همزه
    .replace(/أ|إ|آ/g, "ا")
    // حذف نیم‌فاصله و جایگزینی با فاصله
    .replace(/\u200c/g, " ")
    // حذف فاصله‌های اضافی
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}