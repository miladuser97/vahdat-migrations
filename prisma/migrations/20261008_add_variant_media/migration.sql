-- Migration: 20261008_add_variant_media
-- هدف: اضافه کردن variant به ProductMedia + فیلدهای جدید ProductVariant + metadata به MediaCandidate + perceptualHash به MediaAsset

-- ============================================================
-- ۱. ProductVariant — اضافه کردن فیلدهای جدید
-- ============================================================

ALTER TABLE "ProductVariant"
  ADD COLUMN "slug" TEXT,
  ADD COLUMN "color" TEXT,
  ADD COLUMN "colorHex" TEXT,
  ADD COLUMN "storage" TEXT,
  ADD COLUMN "ram" TEXT,
  ADD COLUMN "isDefault" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "displayOrder" INTEGER NOT NULL DEFAULT 0;

-- چون جدول خالیه، slug رو NOT NULL کن
ALTER TABLE "ProductVariant"
  ALTER COLUMN "slug" SET NOT NULL;

-- حذف index قدیمی روی sku (چون @unique خودش index می‌سازه)
DROP INDEX IF EXISTS "ProductVariant_sku_idx";

-- اضافه کردن unique compound (productId, slug)
CREATE UNIQUE INDEX "ProductVariant_productId_slug_key"
  ON "ProductVariant"("productId", "slug");

-- اضافه کردن index ترکیبی
CREATE INDEX "ProductVariant_productId_isEnabled_idx"
  ON "ProductVariant"("productId", "isEnabled");

-- ============================================================
-- ۲. ProductMedia — اضافه کردن variantId
-- ============================================================

ALTER TABLE "ProductMedia"
  ADD COLUMN "variantId" TEXT;

-- اضافه کردن FK
ALTER TABLE "ProductMedia"
  ADD CONSTRAINT "ProductMedia_variantId_fkey"
  FOREIGN KEY ("variantId")
  REFERENCES "ProductVariant"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

-- اضافه کردن index
CREATE INDEX "ProductMedia_variantId_idx"
  ON "ProductMedia"("variantId");

-- ============================================================
-- ۳. MediaCandidate — اضافه کردن metadata
-- ============================================================

ALTER TABLE "MediaCandidate"
  ADD COLUMN "metadata" JSONB NOT NULL DEFAULT '{}';

-- ============================================================
-- ۴. MediaAsset — اضافه کردن perceptualHash
-- ============================================================

ALTER TABLE "MediaAsset"
  ADD COLUMN "perceptualHash" TEXT;

-- ============================================================
-- پایان migration
-- ============================================================