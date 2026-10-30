-- Add pricing fields to Product
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "costPrice" DECIMAL(12,2);
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "targetPrice" DECIMAL(12,2);
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "discountPercentage" INTEGER DEFAULT 0;

-- Add price to ProductVariant
ALTER TABLE "ProductVariant" ADD COLUMN IF NOT EXISTS "price" DECIMAL(12,2);

-- Add approval fields to Order
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "approvedBy" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "approvalReason" TEXT;

-- Create PriceHistory table
CREATE TABLE IF NOT EXISTS "PriceHistory" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "oldPrice" DECIMAL(12,2),
    "newPrice" DECIMAL(12,2),
    "oldDiscountPercentage" INTEGER,
    "newDiscountPercentage" INTEGER,
    "changeType" TEXT NOT NULL DEFAULT 'PRICE',
    "source" TEXT NOT NULL DEFAULT 'MANUAL',
    "changedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceHistory_pkey" PRIMARY KEY ("id")
);

-- Add foreign keys
ALTER TABLE "PriceHistory" ADD CONSTRAINT "PriceHistory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PriceHistory" ADD CONSTRAINT "PriceHistory_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add indexes
CREATE INDEX IF NOT EXISTS "PriceHistory_productId_idx" ON "PriceHistory"("productId");
CREATE INDEX IF NOT EXISTS "PriceHistory_variantId_idx" ON "PriceHistory"("variantId");
CREATE INDEX IF NOT EXISTS "PriceHistory_createdAt_idx" ON "PriceHistory"("createdAt");
