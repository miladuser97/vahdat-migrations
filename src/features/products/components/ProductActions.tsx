"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { Product } from "@/features/products/types";

interface ProductActionsProps {
  product: Product;
  siteSalesEnabled?: boolean;
}

export function ProductActions({ product, siteSalesEnabled = true }: ProductActionsProps) {
  const [quantity, setQuantity] = useState(1);

  const isOutOfStock = product.stockStatus === "out_of_stock";

  // 👈 اگه فروش سایت بسته باشه
  if (siteSalesEnabled === false) {
    return (
      <div className="space-y-3">
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
          <p className="text-sm font-bold text-yellow-800">
            🔒 فروش موقتاً بسته است
          </p>
          <p className="text-xs text-yellow-600 mt-1">
            لطفاً بعداً مراجعه کنید.
          </p>
        </div>
      </div>
    );
  }

  // 👈 اگه محصول ناموجود باشه
  if (isOutOfStock) {
    return (
      <div className="space-y-3">
        <Button disabled className="w-full" size="lg">
          ناموجود
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* انتخاب تعداد */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-text-secondary">تعداد:</span>
        <div className="flex items-center border rounded-lg">
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="px-3 py-2 hover:bg-gray-100"
            disabled={quantity <= 1}
          >
            −
          </button>
          <span className="px-4 py-2 border-x">{quantity}</span>
          <button
            onClick={() => setQuantity((q) => q + 1)}
            className="px-3 py-2 hover:bg-gray-100"
          >
            +
          </button>
        </div>
      </div>

      {/* دکمه خرید */}
      <Button className="w-full" size="lg">
        🛒 افزودن به سبد خرید
      </Button>
    </div>
  );
}
