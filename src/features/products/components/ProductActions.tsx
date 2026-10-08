"use client";

import { useState } from "react";
import { Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { QuantitySelector } from "@/components/ui/QuantitySelector";
import { SITE_FEATURES } from "@/config/features";
import { useCart } from "@/features/cart/CartProvider";
import type { Product } from "@/features/products/types";
import { cn } from "@/utils/cn";

export interface ProductActionsProps {
  compact?: boolean;
  /** The product this row of actions belongs to. */
  product?: Product;
}

export function ProductActions({ compact = false, product }: ProductActionsProps) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  // ============================================================
  // Compact Mode — فقط دکمه‌ی + کوچک
  // ============================================================
  if (compact) {
    if (!product || !SITE_FEATURES.products.addToCart.enabled) {
      return null;
    }

    // اگه ناموجود، دکمه غیرفعال
    const isOutOfStock = product.stockStatus === "out_of_stock";

    function handleQuickAdd() {
      if (!product || isOutOfStock) return;

      addItem({
        id: product.id,
        productId: product.id,
        title: product.title,
        slug: product.slug,
        quantity: 1,
        price: product.discountPrice ?? product.price ?? 0,
        currency: product.currency,
      });

      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 1500);
    }

    return (
      <button
        type="button"
        onClick={handleQuickAdd}
        disabled={isOutOfStock}
        aria-label={isOutOfStock ? "ناموجود" : "افزودن به سبد خرید"}
        className={cn(
          "flex h-8 w-8 items-center justify-center shrink-0",
          "rounded-lg transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1",
          isOutOfStock
            ? "bg-muted text-text-muted cursor-not-allowed"
            : justAdded
            ? "bg-success text-white scale-110"
            : "bg-brand-600 text-white hover:bg-brand-700 active:scale-95"
        )}
      >
        {justAdded ? (
          <Check className="h-4 w-4" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
      </button>
    );
  }

  // ============================================================
  // حالت عادی — صفحه‌ی جزئیات محصول
  // ============================================================
  const handleAddToCart = () => {
    if (!product) return;
    addItem({
      id: product.id,
      productId: product.id,
      title: product.title,
      slug: product.slug,
      quantity: quantity,
      price: product.discountPrice ?? product.price ?? 0,
      currency: product.currency,
    });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  };

  return (
    <div className="flex flex-col gap-md">
      {SITE_FEATURES.products.addToCart.enabled && product && (
        <div className="flex flex-wrap items-center gap-sm">
          <QuantitySelector
            value={quantity}
            min={1}
            onIncrement={() => setQuantity((q) => q + 1)}
            onDecrement={() => setQuantity((q) => Math.max(1, q - 1))}
          />
          <Button
            type="button"
            variant={justAdded ? "success" : "default"}
            size="md"
            className="flex-1"
            onClick={handleAddToCart}
          >
            {justAdded ? (
              <>
                <Check className="h-4 w-4 ml-1" />
                به سبد اضافه شد
              </>
            ) : (
              "افزودن به سبد خرید"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}