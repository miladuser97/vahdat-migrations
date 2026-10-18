-- Migration: 20261010_add_primary_unique_indexes
-- هدف: دو partial unique index برای isPrimary
--
-- ⚠️ پیش‌نیاز: audit (scripts/db/audit-primary-duplicates.ts)
--    روی دیتابیس مقصد باید اجرا بشه.
--    اگه duplicate وجود داشت → این migration اجرا نشه.
--
-- ⚠️ دو partial index جداگانه:
--    ۱. product primary: variantId IS NULL
--    ۲. variant primary: variantId IS NOT NULL
--
-- دلیل جداسازی:
--    PostgreSQL partial unique index با NULL مشکل داره
--    COALESCE(variantId, '') در index کار نمی‌کنه

BEGIN;

-- ────────────────────────────────────────
-- ۱. Product primary (variantId IS NULL)
-- ────────────────────────────────────────
CREATE UNIQUE INDEX "ProductMedia_primary_product_unique"
  ON "ProductMedia"("productId")
  WHERE "isPrimary" = true 
    AND "status" = 'APPROVED' 
    AND "variantId" IS NULL;

-- ────────────────────────────────────────
-- ۲. Variant primary (variantId IS NOT NULL)
-- ────────────────────────────────────────
CREATE UNIQUE INDEX "ProductMedia_primary_variant_unique"
  ON "ProductMedia"("productId", "variantId")
  WHERE "isPrimary" = true 
    AND "status" = 'APPROVED' 
    AND "variantId" IS NOT NULL;

COMMIT;