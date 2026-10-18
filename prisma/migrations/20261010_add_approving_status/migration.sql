-- Migration: 20261010_add_approving_status
-- هدف: افزودن APPROVING به MediaStatus + فیلدهای claim
--
-- ⚠️ همه در یک transaction:
--    اگه هر مرحله fail داد → rollback کامل
-- ⚠️ ۲ ستون وابسته: MediaCandidate.status, ProductMedia.status
-- ⚠️ هر دو default=PENDING، nullable=false

BEGIN;

-- ────────────────────────────────────────
-- ۱. ساخت enum جدید
-- ────────────────────────────────────────
CREATE TYPE "MediaStatus_new" AS ENUM (
  'PENDING', 'APPROVING', 'APPROVED', 'REJECTED'
);

-- ────────────────────────────────────────
-- ۲. تبدیل MediaCandidate.status
-- ────────────────────────────────────────
ALTER TABLE "MediaCandidate" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "MediaCandidate" ALTER COLUMN "status" 
  TYPE "MediaStatus_new" 
  USING ("status"::text::"MediaStatus_new");

-- ────────────────────────────────────────
-- ۳. تبدیل ProductMedia.status
-- ────────────────────────────────────────
ALTER TABLE "ProductMedia" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "ProductMedia" ALTER COLUMN "status" 
  TYPE "MediaStatus_new" 
  USING ("status"::text::"MediaStatus_new");

-- ────────────────────────────────────────
-- ۴. swap enum
-- ────────────────────────────────────────
ALTER TYPE "MediaStatus" RENAME TO "MediaStatus_old";
ALTER TYPE "MediaStatus_new" RENAME TO "MediaStatus";
DROP TYPE "MediaStatus_old";

-- ────────────────────────────────────────
-- ۵. بازگرداندن defaultها
-- ────────────────────────────────────────
ALTER TABLE "MediaCandidate" ALTER COLUMN "status" SET DEFAULT 'PENDING';
ALTER TABLE "ProductMedia" ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- ────────────────────────────────────────
-- ۶. فیلدهای claim در MediaCandidate
-- ────────────────────────────────────────
ALTER TABLE "MediaCandidate"
  ADD COLUMN "claimToken" TEXT,
  ADD COLUMN "claimExpiresAt" TIMESTAMP(3);

-- ────────────────────────────────────────
-- ۷. Indexها
-- ────────────────────────────────────────
CREATE INDEX "MediaCandidate_status_claimExpiresAt_idx"
  ON "MediaCandidate"("status", "claimExpiresAt");

CREATE INDEX "MediaCandidate_claimToken_idx"
  ON "MediaCandidate"("claimToken");

COMMIT;