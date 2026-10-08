"use client";

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard } from "@/features/products/components/ProductCard";
import type { Product } from "@/features/products/types";
import { cn } from "@/utils/cn";

interface ProductSliderProps {
  products: Product[];
  autoScroll?: boolean;
  showArrows?: boolean;
}

export function ProductSlider({
  products,
  autoScroll = true,
  showArrows = true,
}: ProductSliderProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    direction: "rtl",
    loop: autoScroll,
    align: "start",
    slidesToScroll: 1,
  });

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  // ✅ اسکرول خودکار
  useEffect(() => {
    if (!emblaApi || !autoScroll) return;

    const interval = setInterval(() => {
      if (emblaApi.canScrollNext()) {
        emblaApi.scrollNext();
      } else {
        emblaApi.scrollTo(0);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [emblaApi, autoScroll]);

  // ✅ بررسی دکمه‌ها
  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  if (products.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-text-secondary">محصولی برای نمایش وجود ندارد.</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* ✅ دکمه‌های ناوبری */}
      {showArrows && (
        <>
          <button
            type="button"
            onClick={scrollPrev}
            disabled={!canScrollPrev}
            aria-label="محصول قبلی"
            className={cn(
              "absolute right-0 top-1/2 -translate-y-1/2 z-10",
              "flex h-10 w-10 items-center justify-center",
              "rounded-full bg-card border border-border shadow-md",
              "text-text-primary hover:bg-brand-600 hover:text-white hover:border-brand-600",
              "transition-all",
              "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-card disabled:hover:text-text-primary",
              "hidden sm:flex"
            )}
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={scrollNext}
            disabled={!canScrollNext}
            aria-label="محصول بعدی"
            className={cn(
              "absolute left-0 top-1/2 -translate-y-1/2 z-10",
              "flex h-10 w-10 items-center justify-center",
              "rounded-full bg-card border border-border shadow-md",
              "text-text-primary hover:bg-brand-600 hover:text-white hover:border-brand-600",
              "transition-all",
              "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-card disabled:hover:text-text-primary",
              "hidden sm:flex"
            )}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        </>
      )}

      {/* ✅ اسلایدر */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-3 touch-pan-y">
          {products.map((product) => (
            <div
              key={product.id}
              className="min-w-0 shrink-0 grow-0 basis-[70%] sm:basis-[45%] md:basis-[33%] lg:basis-[25%] xl:basis-[20%]"
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}