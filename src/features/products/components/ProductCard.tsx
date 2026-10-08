import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { ProductImage } from "./ProductImage";
import { ProductActions } from "./ProductActions";
import { DiscountTimer } from "./DiscountTimer";
import type { Product } from "@/features/products/types";
import { cn } from "@/utils/cn";
import { toPersianDigits } from "@/utils/text-utils";

export interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  // محاسبه‌ی درصد تخفیف
  const showDiscount =
    product.discountPrice !== undefined &&
    product.price !== undefined &&
    product.discountPrice < product.price;

  const discountPercentage = showDiscount
    ? Math.round(
        ((product.price! - product.discountPrice!) / product.price!) * 100
      )
    : 0;

  // گارانتی
  const hasWarranty = Boolean(
    product.warranty && product.warranty.trim().length > 0
  );

  // برند/دسته
  const subtitle = [product.brand, product.category]
    .filter(Boolean)
    .join(" · ");

  // ✅ محاسبه‌ی وضعیت موجودی از inventoryCount
  const inventory = product.inventoryCount ?? 0;
  const stockStatus: "in_stock" | "low_stock" | "out_of_stock" =
    inventory > 5 ? "in_stock" : inventory > 0 ? "low_stock" : "out_of_stock";

  return (
    <Card
      className={cn(
        "group relative flex flex-col overflow-hidden h-full",
        "transition-all duration-200",
        "hover:shadow-lg hover:-translate-y-0.5"
      )}
    >
      {/* ========================================== */}
      {/* Badge های گوشه‌ی عکس */}
      {/* ========================================== */}
      <div className="absolute top-2 right-2 z-10 flex flex-col gap-1 items-end">
        {/* تخفیف */}
        {showDiscount && (
          <span
            className={cn(
              "inline-flex items-center justify-center",
              "rounded-md bg-red-500 text-white",
              "px-2 py-0.5 text-[11px] font-bold fa-num",
              "shadow-sm"
            )}
          >
            ٪{toPersianDigits(discountPercentage)}-
          </span>
        )}

        {/* گارانتی */}
        {hasWarranty && (
          <span
            className={cn(
              "inline-flex items-center gap-1",
              "rounded-md bg-brand-600/95 text-white backdrop-blur-sm",
              "px-2 py-0.5 text-[10px] font-medium",
              "shadow-sm"
            )}
          >
            🛡️ گارانتی
          </span>
        )}
      </div>

      {/* ========================================== */}
      {/* تایمر تخفیف (پایین-راست عکس) */}
      {/* ========================================== */}
      {showDiscount && product.discountEndsAt && (
        <div className="absolute bottom-2 right-2 z-10">
          <DiscountTimer
            endsAt={product.discountEndsAt}
            variant="compact"
          />
        </div>
      )}

      {/* ========================================== */}
      {/* عکس */}
      {/* ========================================== */}
      <Link
        href={`/products/${product.slug}`}
        className="block relative"
        aria-label={product.title}
      >
        <div className="relative aspect-square overflow-hidden bg-muted">
          <ProductImage
            image={product.thumbnail}
            images={product.images}
            alt={product.title}
            className="border-0"
          />
        </div>
      </Link>

      {/* ========================================== */}
      {/* محتوا */}
      {/* ========================================== */}
      <div className="flex flex-col gap-1.5 p-3 flex-1">
        {/* عنوان */}
        <Link href={`/products/${product.slug}`} className="block">
          <h3
            className={cn(
              "text-[13px] font-medium leading-snug text-text-primary",
              "line-clamp-2 min-h-[2.6em]",
              "hover:text-brand-600 transition-colors"
            )}
          >
            {product.title}
          </h3>
        </Link>

        {/* برند · دسته */}
        {subtitle && (
          <p className="text-[11px] text-text-muted truncate">{subtitle}</p>
        )}

        {/* ========================================== */}
        {/* قیمت */}
        {/* ========================================== */}
        <div className="flex flex-col gap-0.5 mt-1">
          {showDiscount ? (
            <>
              <p className="text-[11px] text-text-muted line-through fa-num">
                {product.price!.toLocaleString("fa-IR")}
              </p>
              <p className="text-[15px] font-bold text-text-primary fa-num">
                {product.discountPrice!.toLocaleString("fa-IR")}
                <span className="text-[10px] font-normal text-text-muted mr-1">
                  تومان
                </span>
              </p>
            </>
          ) : (
            <p className="text-[15px] font-bold text-text-primary fa-num">
              {product.price?.toLocaleString("fa-IR") ?? "—"}
              <span className="text-[10px] font-normal text-text-muted mr-1">
                تومان
              </span>
            </p>
          )}
        </div>

        {/* ========================================== */}
        {/* دکمه‌ی سبد + وضعیت موجودی */}
        {/* ========================================== */}
        <div className="flex items-center justify-between gap-2 mt-auto pt-2">
          <StockStatusInline status={stockStatus} />
          <ProductActions compact product={product} />
        </div>
      </div>
    </Card>
  );
}

// ============================================================
// کامپوننت کمکی: وضعیت موجودی
// ============================================================
function StockStatusInline({
  status,
}: {
  status: "in_stock" | "low_stock" | "out_of_stock";
}) {
  const config = {
    in_stock: { label: "موجود", color: "text-success" },
    low_stock: { label: "محدود", color: "text-amber-500" },
    out_of_stock: { label: "ناموجود", color: "text-destructive" },
  }[status];

  return (
    <span className={cn("text-[10px] font-medium", config.color)}>
      ● {config.label}
    </span>
  );
}