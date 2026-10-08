import "server-only";

import { createClient } from "@supabase/supabase-js";

/**
 * Supabase Admin Client — برای استفاده توی سرور (Server Actions)
 *
 * ⚠️ این کلاینت از SERVICE_ROLE_KEY استفاده می‌کنه که دسترسی کامل داره.
 * هرگز توی Client Components استفاده نکن.
 */
export function createServerSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL و SUPABASE_SERVICE_ROLE_KEY باید تنظیم بشن."
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

// ============================================================
// نام Bucket
// ============================================================
export const PRODUCT_MEDIA_BUCKET = "product-media";