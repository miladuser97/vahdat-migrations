"use client";

import { createClient } from "@supabase/supabase-js";

/**
 * Supabase Client — برای استفاده توی مرورگر (Client Components)
 *
 * ⚠️ نکته: این کلاینت فقط برای کارهای عمومی استفاده می‌شه.
 * برای آپلود/حذف عکس، از کلاینت سرور (server.ts) استفاده کن.
 */
export function createBrowserSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL و NEXT_PUBLIC_SUPABASE_ANON_KEY باید تنظیم بشن."
    );
  }

  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}