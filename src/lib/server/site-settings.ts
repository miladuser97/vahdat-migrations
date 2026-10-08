"use server";

import { prisma } from "@/lib/server/prisma";
import { logger } from "@/lib/logger";
import { unstable_cache } from "next/cache";
import type { SettingKey } from "@/lib/settings-keys";

// ============================================================
// تابع داخلی — کش شده برای 60 ثانیه
// ============================================================
const _getCachedSettings = unstable_cache(
  async (): Promise<Record<string, boolean>> => {
    try {
      const settings = await prisma.siteSetting.findMany();
      const result: Record<string, boolean> = {};
      for (const s of settings) {
        const v = s.value;
        result[s.key] = typeof v === "boolean" ? v : v === "true";
      }
      return result;
    } catch (error) {
      logger.error("خطا در خواندن تنظیمات", { error });
      return {};
    }
  },
  ["site-settings"],
  { revalidate: 60, tags: ["site-settings"] }
);

// ============================================================
// خوندن یک تنظیم (با کش)
// ============================================================
export async function getSetting(
  key: SettingKey | string,
  defaultValue = false
): Promise<boolean> {
  const settings = await _getCachedSettings();
  return settings[key] ?? defaultValue;
}

// ============================================================
// خوندن همه تنظیمات (با کش)
// ============================================================
export async function getAllSettings(): Promise<Record<string, boolean>> {
  return _getCachedSettings();
}