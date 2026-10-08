// ============================================================
// تنظیمات محیطی پروژه
// ============================================================

function getEnvVar(key: string, required = true): string {
  const value = process.env[key];

  if (!value && required) {
    throw new Error(`متغیر محیطی ${key} تعریف نشده است`);
  }

  return value ?? "";
}

export const env = {
  // ✅ دیتابیس
  DATABASE_URL: getEnvVar("DATABASE_URL"),

  // ✅ سایت
  SITE_URL: getEnvVar("NEXT_PUBLIC_SITE_URL", false) || "http://localhost:3000",
  NEXT_PUBLIC_API_URL:
    getEnvVar("NEXT_PUBLIC_API_URL", false) || "http://localhost:3000/api",

  // ✅ API
  API_VERSION: getEnvVar("API_VERSION", false) || "v1",
  API_TIMEOUT: Number(getEnvVar("API_TIMEOUT", false)) || 10000,
  API_RETRY_COUNT: Number(getEnvVar("API_RETRY_COUNT", false)) || 3,

  // ✅ ZarinPal
  ZARINPAL_MERCHANT_ID: getEnvVar("ZARINPAL_MERCHANT_ID", false),
  ZARINPAL_CALLBACK_URL:
    getEnvVar("ZARINPAL_CALLBACK_URL", false) ||
    "http://localhost:3000/api/payment/callback",
  ZARINPAL_SANDBOX: getEnvVar("ZARINPAL_SANDBOX", false) === "true",

  // ✅ Notifications — SMS (Kavenegar)
  SMS_API_KEY: getEnvVar("SMS_API_KEY", false),
  SMS_SENDER_LINE: getEnvVar("SMS_SENDER_LINE", false),

  // ✅ Notifications — Email (Resend)
  EMAIL_API_KEY: getEnvVar("EMAIL_API_KEY", false),
  EMAIL_FROM_ADDRESS: getEnvVar("EMAIL_FROM_ADDRESS", false),

  // ✅ محیط
  NODE_ENV: getEnvVar("NODE_ENV", false) || "development",
  IS_PRODUCTION: process.env.NODE_ENV === "production",
  IS_DEVELOPMENT: process.env.NODE_ENV === "development",
} as const;

// ============================================================
// ✅ تابع getEnv() — برای سازگاری با کدهای قدیمی
// ============================================================
export function getEnv(): typeof env {
  return env;
}

// ============================================================
// ✅ clearEnvCache() — برای تست‌ها
// (چون env الان static است، این تابع فقط placeholder است)
// ============================================================
export function clearEnvCache(): void {
  // no-op: env در حال حاضر cacheable نیست (فقط const است)
}

export type Env = typeof env;