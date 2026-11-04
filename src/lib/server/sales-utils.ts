import { prisma } from "./prisma";

/**
 * بررسی وضعیت فروش کل سایت
 * @returns true اگر فروش باز باشد، false اگر بسته باشد
 */
export async function isSiteSalesEnabled(): Promise<boolean> {
  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: "site_sales_enabled" },
    });
    // اگه تنظیمات وجود نداشت، پیش‌فرض true (فروش باز)
    return setting ? Boolean(setting.value) : true;
  } catch (error) {
    console.error("Error checking site sales status:", error);
    return true; // در صورت خطا، فروش را باز فرض می‌کنیم
  }
}
