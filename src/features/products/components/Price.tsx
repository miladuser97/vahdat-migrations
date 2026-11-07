"use client";

import { useState, useEffect } from "react";
import { toPersianDigits } from "@/utils/text-utils";

interface PriceProps {
  price: number;
  discountPrice?: number;
  discountPercentage?: number;
  currency?: string;
  slug?: string;
}

export function Price({ price, discountPrice, discountPercentage, currency = "تومان", slug }: PriceProps) {
  const [finalPrice, setFinalPrice] = useState<number | null>(null);

  // 👈 محاسبه قیمت نهایی از API (اگه slug داشته باشیم)
  useEffect(() => {
    if (!slug) return;
    async function load() {
      try {
        const res = await fetch(`/api/products/${slug}/price`);
        if (res.ok) {
          const data = await res.json();
          setFinalPrice(Number(data.finalPrice));
        }
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, [slug]);

  const hasDiscount = (discountPercentage && discountPercentage > 0) || discountPrice;
  const displayPrice = finalPrice || price;
  const originalPrice = finalPrice && finalPrice < price ? price : null;

  return (
    <div className="space-y-1">
      {hasDiscount ? (
        <>
          {/* قیمت نهایی */}
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-red-600">
              {toPersianDigits(Math.round(displayPrice).toLocaleString())} {currency}
            </span>
            {discountPercentage && (
              <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full font-bold">
                {toPersianDigits(discountPercentage)}% تخفیف
              </span>
            )}
          </div>
          {/* قیمت قبلی (خط خورده) */}
          {originalPrice && (
            <span className="text-sm text-gray-400 line-through">
              {toPersianDigits(Math.round(originalPrice).toLocaleString())} {currency}
            </span>
          )}
        </>
      ) : (
        <span className="text-2xl font-bold text-text-primary">
          {toPersianDigits(Math.round(price).toLocaleString())} {currency}
        </span>
      )}
    </div>
  );
}
