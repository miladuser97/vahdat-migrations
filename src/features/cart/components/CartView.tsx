"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import { EmptyState } from "@/components/shared/EmptyState";
import { CartItemRow } from "@/features/cart/components/CartItemRow";
import { CartSummary } from "@/features/cart/components/CartSummary";
import { useCart } from "@/features/cart/CartProvider";

/**
 * CartView
 * Reads the shared cart state (useCart) instead of a page-local array.
 *
 * Phase 22: CartItemRow and CartSummary are now wired to the real
 * removeItem/updateQuantity/clearCart operations (added in Phase 20) —
 * every visible control here is fully functional, not a placeholder.
 * Items still starts empty in practice (no add-to-cart UI has real
 * product data yet — see ProductActions/Phase 21), but the cart is no
 * longer just an architectural stand-in: if it ever has items, a
 * person can now actually manage them.
 *
 * A Client Component (Context needs one), which is also why this logic
 * was pulled out of page.tsx rather than making the whole page client —
 * page.tsx keeps exporting `metadata`, which only a Server Component can do.
 */
export function CartView() {
  const { items, removeItem, updateQuantity, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <EmptyState
        title="سبد خرید شما خالی است"
        action={
          <Link href="/products" className={buttonVariants({ variant: "default", size: "md" })}>
            مشاهده‌ی محصولات
          </Link>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-lg lg:flex-row lg:items-start lg:gap-xl">
      <div className="flex min-w-0 flex-1 flex-col gap-md">
        {items.map((item) => (
          <CartItemRow
            key={item.id}
            item={item}
            onRemove={removeItem}
            onQuantityChange={updateQuantity}
          />
        ))}

        <Link
          href="/products"
          className={buttonVariants({ variant: "outline", size: "md", className: "self-start" })}
        >
          ادامه‌ی خرید
        </Link>
      </div>

      <div className="lg:sticky lg:top-lg lg:w-80 lg:shrink-0 lg:self-start">
        <CartSummary items={items} onClearCart={clearCart} />
      </div>
    </div>
  );
}
