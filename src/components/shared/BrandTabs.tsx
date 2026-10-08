"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/Card";
import { cn } from "@/utils/cn";
import { formatPrice } from "@/utils/text-utils";
import type { Product } from "@/features/products/types";

interface BrandTabsProps {
  brands: string[];
  products: Product[];
}

export function BrandTabs({ brands, products }: BrandTabsProps) {
  const [activeBrand, setActiveBrand] = useState<string | null>(null);

  // ✅ فیلتر محصولات بر اساس برند (memoized)
  const filteredProducts = useMemo(() => {
    if (!activeBrand) {
      return products.slice(0, 8);
    }
    return products.filter((p) => p.brand === activeBrand).slice(0, 8);
  }, [activeBrand, products]);

  if (brands.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-text-secondary">هیچ برندی یافت نشد.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ✅ تب‌های برند */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveBrand(null)}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-medium transition-all",
            !activeBrand
              ? "bg-brand-600 text-white shadow-md"
              : "bg-muted text-text-secondary hover:bg-muted/80 hover:text-text-primary"
          )}
        >
          همه برندها
        </button>

        {brands.slice(0, 10).map((brand) => (
          <button
            key={brand}
            type="button"
            onClick={() => setActiveBrand(brand)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-all",
              activeBrand === brand
                ? "bg-brand-600 text-white shadow-md"
                : "bg-muted text-text-secondary hover:bg-muted/80 hover:text-text-primary"
            )}
          >
            {brand}
          </button>
        ))}
      </div>

      {/* ✅ گرید محصولات */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filteredProducts.map((product) => {
            const firstImage = product.images?.[0]?.url;
            const finalPrice = product.discountPrice ?? product.price ?? 0;

            return (
              <Link key={product.id} href={`/products/${product.slug}`}>
                <Card className="group h-full p-3 transition-all hover:shadow-lg hover:-translate-y-1">
                  {/* ✅ تصویر — next/image */}
                  <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
                    {firstImage ? (
                      <Image
                        src={firstImage}
                        alt={product.title}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-5xl">
                        📱
                      </div>
                    )}

                    {/* برچسب تخفیف */}
                    {product.discountPrice && product.price && (
                      <div className="absolute top-2 right-2 z-10">
                        <span className="rounded-md bg-destructive px-2 py-0.5 text-[10px] font-bold text-white fa-num">
                          {Math.round(
                            ((product.price - product.discountPrice) / product.price) * 100
                          )}
                          ٪-
                        </span>
                      </div>
                    )}
                  </div>

                  {/* عنوان */}
                  <h3 className="mt-2 line-clamp-2 min-h-[2.5rem] text-sm font-medium text-text-primary group-hover:text-brand-600 transition-colors">
                    {product.title}
                  </h3>

                  {/* برند */}
                  {product.brand && (
                    <p className="mt-1 text-xs text-text-muted">{product.brand}</p>
                  )}

                  {/* قیمت */}
                  <p className="mt-2 text-sm font-bold text-brand-600">
                    {formatPrice(finalPrice, {
                      persianDigits: true,
                      withCurrency: true,
                    })}
                  </p>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="py-8 text-center">
          <p className="text-text-secondary">محصولی برای این برند یافت نشد.</p>
        </div>
      )}

      {/* ✅ لینک همه محصولات */}
      {filteredProducts.length >= 8 && (
        <div className="text-center">
          <Link
            href={`/products${activeBrand ? `?brand=${encodeURIComponent(activeBrand)}` : ""}`}
            className={cn(
              "inline-flex items-center gap-2",
              "px-6 py-2.5 rounded-lg",
              "bg-brand-600 text-white",
              "hover:bg-brand-700",
              "transition-colors text-sm font-medium"
            )}
          >
            مشاهده همه محصولات {activeBrand ? `برند ${activeBrand}` : ""}
          </Link>
        </div>
      )}
    </div>
  );
}