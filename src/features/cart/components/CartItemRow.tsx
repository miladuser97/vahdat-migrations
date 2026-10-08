"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { QuantitySelector } from "@/components/ui/QuantitySelector";
import { ProductImage } from "@/features/products/components/ProductImage";
import { Price } from "@/features/products/components/Price";
import type { CartItem } from "@/features/cart/types";

export interface CartItemRowProps {
  item: CartItem;
  /** Omit for a read-only row (no remove button) — e.g. an order
   * summary that shouldn't let the cart be edited from there. */
  onRemove?: (id: string) => void;
  /** Omit for a read-only row (plain quantity text instead of the
   * stepper) — same reasoning as onRemove. */
  onQuantityChange?: (id: string, quantity: number) => void;
}

/**
 * CartItemRow
 * One responsibility: display one cart line, optionally letting it be
 * removed or have its quantity changed. Reuses ProductImage, Price,
 * and the existing QuantitySelector rather than duplicating any of
 * that markup.
 *
 * `onRemove`/`onQuantityChange` are forwarded callbacks (same
 * convention as ActiveFilters' `onRemove`) — CartView passes the real
 * `removeItem`/`updateQuantity` from useCart(), so this component stays
 * a plain, composable presentational piece rather than reaching into
 * cart state itself. Both are optional so a read-only context (the
 * checkout order summary) can reuse this exact component instead of a
 * near-duplicate.
 *
 * Responsive: wraps onto two lines below `sm` (image+title+price on
 * one, quantity+remove on the next) instead of compressing everything
 * into one cramped row.
 */
export function CartItemRow({ item, onRemove, onQuantityChange }: CartItemRowProps) {
  return (
    <Card className="flex flex-wrap items-center gap-md">
      <Link href={`/products/${item.slug}`} className="w-20 shrink-0">
        <ProductImage alt={item.title} />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-xs">
        <Link
          href={`/products/${item.slug}`}
          className="truncate text-body font-medium text-text-primary hover:underline"
        >
          {item.title}
        </Link>
        <Price price={item.price} currency={item.currency} />
      </div>

      <div className="flex w-full items-center justify-between gap-sm sm:w-auto sm:justify-end">
        {onQuantityChange ? (
          <QuantitySelector
            value={item.quantity}
            min={1}
            onIncrement={() => onQuantityChange(item.id, item.quantity + 1)}
            onDecrement={() => onQuantityChange(item.id, item.quantity - 1)}
          />
        ) : (
          <p className="text-body-sm text-text-secondary">
            تعداد: {item.quantity.toLocaleString("fa-IR")}
          </p>
        )}

        {onRemove && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onRemove(item.id)}
            aria-label={`حذف ${item.title} از سبد خرید`}
          >
            حذف
          </Button>
        )}
      </div>
    </Card>
  );
}
