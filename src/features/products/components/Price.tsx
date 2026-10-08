export interface PriceProps {
  price?: number;
  discountPrice?: number;
  discountPercentage?: number;
  currency?: string;
}

const DEFAULT_CURRENCY = "تومان";

/**
 * Price
 * Presentation only — does not calculate discount percentages or do
 * any currency conversion; the caller supplies whatever numbers it
 * already has. Shows an honest "price unavailable" message when there
 * is no price, rather than a blank space.
 */
export function Price({
  price,
  discountPrice,
  discountPercentage,
  currency = DEFAULT_CURRENCY,
}: PriceProps) {
  if (price === undefined) {
    return <p className="text-body-sm text-text-secondary">قیمت نامشخص</p>;
  }

  const showDiscount = discountPrice !== undefined && discountPrice < price;

  return (
    <div className="flex flex-wrap items-baseline gap-xs">
      <p
        className={
          showDiscount
            ? "text-body-sm text-text-secondary line-through"
            : "text-body font-semibold text-text-primary"
        }
      >
        {price.toLocaleString("fa-IR")} {currency}
      </p>

      {showDiscount && discountPrice !== undefined && (
        <>
          <p className="text-body font-semibold text-text-primary">
            {discountPrice.toLocaleString("fa-IR")} {currency}
          </p>
          {discountPercentage !== undefined && (
            <span className="rounded-full bg-error/10 px-xs text-caption font-medium text-error">
              {discountPercentage}%-
            </span>
          )}
        </>
      )}
    </div>
  );
}
