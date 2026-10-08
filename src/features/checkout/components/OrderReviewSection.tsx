"use client";

import { Card } from "@/components/ui/Card";
import { CartItemRow } from "@/features/cart/components/CartItemRow";
import type { CartItem } from "@/features/cart/types";
import { useCheckout } from "@/features/checkout/CheckoutProvider";

const SHIPPING_COSTS: Record<string, number> = {
  "standard-post": 35000,
  "express-post": 65000,
  "courier": 120000,
  "local-delivery": 50000,
  "store-pickup": 0,
  "free-shipping": 0,
};

export interface OrderReviewSectionProps {
  items: CartItem[];
}

export function OrderReviewSection({ items }: OrderReviewSectionProps) {
  const { shippingMethod } = useCheckout();
  
  const subtotal = items.reduce((total, item) => {
    return total + (item.price || 0) * item.quantity;
  }, 0);

  const shippingCost = shippingMethod ? (SHIPPING_COSTS[shippingMethod] || 0) : 0;
  const total = subtotal + shippingCost;

  return (
    <Card className="flex flex-col gap-md">
      <h2 className="text-h4 font-semibold text-text-primary">بازبینی سفارش</h2>

      <div className="flex flex-col gap-md">
        {items.map((item) => (
          <CartItemRow key={item.id} item={item} />
        ))}
      </div>

      <div className="flex flex-col gap-sm border-t border-border pt-md">
        <div className="flex items-center justify-between gap-sm">
          <span className="text-body-sm text-text-secondary">
            جمع جزء ({items.length.toLocaleString("fa-IR")} کالا)
          </span>
          <span className="text-body-sm font-medium text-text-primary">
            {subtotal.toLocaleString("fa-IR")} تومان
          </span>
        </div>

        <div className="flex items-center justify-between gap-sm border-t border-border/30 pt-sm">
          <span className="text-body-sm text-text-secondary">هزینه ارسال</span>
          <span className="text-body-sm font-medium text-text-primary">
            {shippingMethod ? `${shippingCost.toLocaleString("fa-IR")} تومان` : "انتخاب نشده"}
          </span>
        </div>

        <div className="flex items-center justify-between gap-sm">
          <span className="text-body-sm text-text-secondary">تخفیف</span>
          <span className="text-body-sm text-text-secondary">
            در صورت استفاده از کد تخفیف اعمال می‌شود
          </span>
        </div>

        <div className="flex items-center justify-between gap-sm border-t border-border pt-md mt-sm">
          <span className="text-body font-medium text-text-primary">مبلغ قابل پرداخت</span>
          <span className="text-body font-bold text-primary">
            {total.toLocaleString("fa-IR")} تومان
          </span>
        </div>

        <p className="text-xs text-text-secondary text-center mt-xs">
          * مبلغ نهایی پس از انتخاب روش ارسال و اعمال تخفیف‌ها محاسبه می‌شود
        </p>
      </div>
    </Card>
  );
}