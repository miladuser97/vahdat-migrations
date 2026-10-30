priceimport { Prisma } from "@prisma/client";

export interface PriceCalculationInput {
  productPrice: Prisma.Decimal;
  variantPrice?: Prisma.Decimal | null;
  discountPercentage?: number | null;
  costPrice?: Prisma.Decimal | null;
}

export interface PriceCalculationResult {
  basePrice: Prisma.Decimal;
  finalPrice: Prisma.Decimal;
  discountAmount: Prisma.Decimal;
  isBelowCost: boolean;
  isBelowMinAllowed: boolean;
  minAllowedPrice: Prisma.Decimal | null;
}

const MIN_PROFIT_PERCENTAGE = 5; // حداقل ۵٪ سود

/**
 * محاسبه قیمت نهایی با احتساب تخفیف و بررسی حداقل قیمت مجاز
 */
export function calculateFinalPrice(input: PriceCalculationInput): PriceCalculationResult {
  // ۱. انتخاب قیمت پایه (variant یا product)
  const basePrice = input.variantPrice ?? input.productPrice;

  // ۲. اعتبارسنجی درصد تخفیف (۰ تا ۱۰۰)
  const discountPercentage = input.discountPercentage ?? 0;
  const validDiscount = Math.min(Math.max(discountPercentage, 0), 100);

  // ۳. محاسبه مبلغ تخفیف
  const discountAmount = basePrice.mul(validDiscount).div(100);
  const finalPrice = basePrice.sub(discountAmount);

  // ۴. گرد کردن به نزدیک‌ترین تومان (بدون اعشار)
  const roundedFinalPrice = new Prisma.Decimal(
    Math.round(finalPrice.toNumber())
  );

  // ۵. محاسبه حداقل قیمت مجاز (costPrice + 5%)
  let minAllowedPrice: Prisma.Decimal | null = null;
  if (input.costPrice) {
    const profitAmount = input.costPrice.mul(MIN_PROFIT_PERCENTAGE).div(100);
    minAllowedPrice = input.costPrice.add(profitAmount);
  }

  // ۶. بررسی شرایط
  const isBelowCost = input.costPrice
    ? roundedFinalPrice.lt(input.costPrice)
    : false;
  const isBelowMinAllowed = minAllowedPrice
    ? roundedFinalPrice.lt(minAllowedPrice)
    : false;

  return {
    basePrice,
    finalPrice: roundedFinalPrice,
    discountAmount,
    isBelowCost,
    isBelowMinAllowed,
    minAllowedPrice,
  };
}

/**
 * بررسی اینکه آیا قیمت نهایی برای فروش مجاز است یا نیاز به تأیید مدیر دارد
 */
export function requiresManagerApproval(result: PriceCalculationResult): boolean {
  return result.isBelowMinAllowed || result.isBelowCost;
}

/**
 * بررسی حداقل قیمت مجاز برای یک costPrice مشخص
 */
export function getMinAllowedPrice(costPrice: Prisma.Decimal | null): Prisma.Decimal | null {
  if (!costPrice) return null;
  const profitAmount = costPrice.mul(MIN_PROFIT_PERCENTAGE).div(100);
  return costPrice.add(profitAmount);
}-service.ts
