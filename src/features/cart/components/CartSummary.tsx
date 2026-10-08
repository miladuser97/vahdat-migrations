"use client";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { buttonVariants } from "@/components/ui/button-variants";
import Link from "next/link";
import { Price } from "@/features/products/components/Price";
import type { CartItem } from "@/features/cart/types";
import { SITE_FEATURES } from "@/config/features";

export interface CartSummaryProps {
  items: CartItem[];
  /** Omit to render a read-only summary (no clear-cart button) — e.g.
   * for the checkout page's order summary. */
  onClearCart?: () => void;
}

/**
 * CartSummary ("خلاصه سفارش" / order summary)
 * Reuses Price — which does no math of its own and shows an honest
 * "قیمت نامشخص" when given no number — for both the subtotal and total
 * rows, rather than summing item prices here. This component counts
 * items (a length, not a calculation) but never adds or multiplies any
 * price.
 *
 * `onClearCart` is a forwarded callback (same convention as
 * CartItemRow's `onRemove`) — CartView passes the real `clearCart`
 * from useCart(). Optional so a read-only context (checkout) can reuse
 * this exact component instead of a near-duplicate.
 *
 * The "ثبت سفارش" (Proceed to Checkout) button is gated by 
 * CART_FEATURES.showCheckoutEntry. No coupon/gift-card/reward-points/
 * shipping-estimator rows as each needs a backend. See config.ts.
 */
export function CartSummary({ items, onClearCart }: CartSummaryProps) {
  return (
    <Card className="flex flex-col gap-md">
      <div className="flex items-center justify-between gap-sm">
        <h2 className="text-h4 font-semibold text-text-primary">خلاصه سفارش</h2>
        {onClearCart && (
          <Button type="button" variant="ghost" size="sm" onClick={onClearCart}>
            پاک کردن سبد خرید
          </Button>
        )}
      </div>

      <div className="flex items-center justify-between gap-sm">
        <span className="text-body-sm text-text-secondary">
          جمع جزء ({items.length.toLocaleString("fa-IR")} کالا)
        </span>
        <Price />
      </div>

      <div className="flex items-center justify-between gap-sm border-t border-border pt-md">
        <span className="text-body font-medium text-text-primary">مبلغ کل</span>
        <Price />
      </div>

      {SITE_FEATURES.cart.checkoutEntry.enabled && (
        <Link
          href="/checkout"
          className={buttonVariants({ variant: "default", size: "lg", className: "w-full" })}
        >
          ثبت سفارش
        </Link>
      )}
    </Card>
  );
}