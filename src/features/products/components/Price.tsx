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
  const [basePrice, setBasePrice] = useState<number | null>(null);
  const [discountPct, setDiscountPct] = useState<number | null>(null);

  useEffect(() => {
    if (!slug) return;
    async function load() {
      try {
        const res = await fetch(`/api/products/${slug}/final-price`);
        if (res.ok) {
          const data = await res.json();
          setFinalPrice(Number(data.finalPrice));
          setBasePrice(Number(data.basePrice));
          setDiscountPct(Number(data.discountPercentage));
        }
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, [slug]);

  const hasDiscount = discountPct && discountPct > 0;
  const displayPrice = finalPrice || price;
  const originalPrice = hasDiscount && basePrice ? basePrice : null;

  return (
    <div className="space-y-1">
      {hasDiscount ? (
        <>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-red-600">
              {toPersianDigits(Math.round(displayPrice).toLocaleString())} {currency}
            </span>
            <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full font-bold">
              {toPersianDigits(discountPct!)}% تخفیف
            </span>
          </div>
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
