"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { cn } from "@/utils/cn";

// ============================================================
// اسلایدها
// ============================================================
interface HeroSlide {
  id: string;
  image?: string;
  gradient: string; // ✅ پس‌زمینه گرادیانت
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref: string;
  emoji?: string;
}

const DEFAULT_SLIDES: HeroSlide[] = [
  {
    id: "1",
    gradient: "from-brand-600 via-brand-700 to-brand-900",
    title: "جدیدترین گوشی‌های هوشمند",
    subtitle: "با بهترین قیمت و ضمانت اصالت کالا",
    ctaLabel: "مشاهده محصولات",
    ctaHref: "/products",
    emoji: "📱",
  },
  {
    id: "2",
    gradient: "from-purple-600 via-purple-700 to-indigo-900",
    title: "لوازم جانبی اورجینال",
    subtitle: "شارژر، هدفون، پاوربانک و ...",
    ctaLabel: "خرید کنید",
    ctaHref: "/categories/accessories",
    emoji: "🎧",
  },
  {
    id: "3",
    gradient: "from-rose-600 via-red-600 to-orange-700",
    title: "تخفیفات شگفت‌انگیز",
    subtitle: "تا ۵۰٪ تخفیف روی محصولات منتخب",
    ctaLabel: "مشاهده تخفیف‌ها",
    ctaHref: "/products?filter=discounted",
    emoji: "🔥",
  },
];

interface HeroSliderProps {
  slides?: HeroSlide[];
}

export function HeroSlider({ slides = DEFAULT_SLIDES }: HeroSliderProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    direction: "rtl",
    loop: true,
    align: "start",
  });

  const [selectedIndex, setSelectedIndex] = useState(0);

  // ✅ اسکرول خودکار
  useEffect(() => {
    if (!emblaApi) return;

    const interval = setInterval(() => {
      emblaApi.scrollNext();
    }, 5000);

    return () => clearInterval(interval);
  }, [emblaApi]);

  // ✅ پیگیری اسلاید فعال
  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
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
  const scrollTo = useCallback(
    (index: number) => emblaApi?.scrollTo(index),
    [emblaApi]
  );

  if (slides.length === 0) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl shadow-xl">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex touch-pan-y">
          {slides.map((slide) => (
            <div
              key={slide.id}
              className="min-w-0 shrink-0 grow-0 basis-full"
            >
              <Link
                href={slide.ctaHref}
                className={cn(
                  "block relative aspect-[16/9] sm:aspect-[2.5/1] lg:aspect-[3/1] w-full",
                  "bg-gradient-to-br",
                  slide.gradient
                )}
              >
                {/* ✅ الگوی SVG پس‌زمینه */}
                <svg
                  className="absolute inset-0 h-full w-full opacity-10"
                  viewBox="0 0 800 400"
                  fill="none"
                  preserveAspectRatio="xMidYMid slice"
                >
                  <circle cx="150" cy="100" r="80" stroke="white" strokeWidth="1" />
                  <circle cx="650" cy="300" r="120" stroke="white" strokeWidth="1" />
                  <circle cx="400" cy="200" r="60" stroke="white" strokeWidth="1" />
                  <rect x="600" y="50" width="100" height="100" rx="20" stroke="white" strokeWidth="1" />
                  <rect x="100" y="280" width="120" height="80" rx="15" stroke="white" strokeWidth="1" />
                  <path d="M0 350 Q200 300 400 350 T800 350" stroke="white" strokeWidth="0.8" opacity="0.5" />
                </svg>

                {/* ✅ محتوا */}
                <div className="absolute inset-0 flex items-center">
                  <div className="container mx-auto px-6 sm:px-12">
                    <div className="flex items-center gap-6 max-w-3xl">
                      {/* Emoji بزرگ */}
                      <div className="hidden sm:flex shrink-0 h-24 w-24 lg:h-32 lg:w-32 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
                        <span className="text-5xl lg:text-6xl">{slide.emoji}</span>
                      </div>

                      {/* متن */}
                      <div className="text-white">
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-sm px-3 py-1 text-xs font-medium mb-3">
                          <Sparkles className="h-3 w-3" />
                          <span>پیشنهاد ویژه</span>
                        </div>

                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold leading-tight mb-2">
                          {slide.title}
                        </h2>

                        {slide.subtitle && (
                          <p className="text-sm sm:text-base lg:text-lg text-white/90 mb-4 sm:mb-6">
                            {slide.subtitle}
                          </p>
                        )}

                        {slide.ctaLabel && (
                          <span className="inline-flex items-center gap-2 rounded-lg bg-white px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-bold text-brand-700 hover:bg-white/90 transition-colors">
                            {slide.ctaLabel}
                            <ChevronLeft className="h-4 w-4" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* دکمه قبلی */}
      <button
        type="button"
        onClick={scrollPrev}
        aria-label="اسلاید قبلی"
        className={cn(
          "absolute right-4 top-1/2 -translate-y-1/2",
          "flex h-10 w-10 items-center justify-center",
          "rounded-full bg-white/20 backdrop-blur-sm text-white",
          "hover:bg-white/30 transition-colors",
          "hidden sm:flex"
        )}
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* دکمه بعدی */}
      <button
        type="button"
        onClick={scrollNext}
        aria-label="اسلاید بعدی"
        className={cn(
          "absolute left-4 top-1/2 -translate-y-1/2",
          "flex h-10 w-10 items-center justify-center",
          "rounded-full bg-white/20 backdrop-blur-sm text-white",
          "hover:bg-white/30 transition-colors",
          "hidden sm:flex"
        )}
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      {/* نقطه‌ها */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            onClick={() => scrollTo(index)}
            aria-label={`رفتن به اسلاید ${index + 1}`}
            className={cn(
              "h-2 rounded-full transition-all",
              selectedIndex === index
                ? "w-8 bg-white"
                : "w-2 bg-white/50 hover:bg-white/70"
            )}
          />
        ))}
      </div>
    </div>
  );
}