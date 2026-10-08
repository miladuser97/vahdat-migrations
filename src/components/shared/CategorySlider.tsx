"use client";

import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";
import { cn } from "@/utils/cn";
import type { Category } from "@/features/categories/schema";

interface CategorySliderProps {
  categories: Category[];
}

export function CategorySlider({ categories }: CategorySliderProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (categories.length === 0) return null;

  // ✅ اسکرول با دکمه‌ها
  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = 240;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative group">
      {/* دکمه راست */}
      <button
        type="button"
        onClick={() => scroll("right")}
        aria-label="اسکرول به راست"
        className={cn(
          "absolute right-0 top-1/2 -translate-y-1/2 z-10",
          "flex h-9 w-9 items-center justify-center",
          "rounded-full bg-card border border-border shadow-md",
          "text-text-primary hover:bg-brand-600 hover:text-white hover:border-brand-600",
          "transition-all",
          "hidden sm:flex",
          "opacity-0 group-hover:opacity-100",
          "focus:opacity-100"
        )}
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* دکمه چپ */}
      <button
        type="button"
        onClick={() => scroll("left")}
        aria-label="اسکرول به چپ"
        className={cn(
          "absolute left-0 top-1/2 -translate-y-1/2 z-10",
          "flex h-9 w-9 items-center justify-center",
          "rounded-full bg-card border border-border shadow-md",
          "text-text-primary hover:bg-brand-600 hover:text-white hover:border-brand-600",
          "transition-all",
          "hidden sm:flex",
          "opacity-0 group-hover:opacity-100",
          "focus:opacity-100"
        )}
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      {/* لیست */}
      <div
        ref={scrollRef}
        className="scroll-x flex gap-3 sm:gap-4 overflow-x-auto pb-1"
      >
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/categories/${category.slug}`}
            className={cn(
              "group/cat flex shrink-0 flex-col items-center gap-2",
              "w-[88px] sm:w-[100px] md:w-[110px]"
            )}
          >
            {/* ✅ دایره */}
            <div
              className={cn(
                "flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center",
                "rounded-full",
                "bg-muted",
                "border-2 border-transparent",
                "transition-all duration-300",
                "group-hover/cat:border-brand-500 group-hover/cat:scale-105 group-hover/cat:shadow-lg",
                "relative overflow-hidden"
              )}
              style={
                category.color
                  ? { backgroundColor: `${category.color}20` }
                  : undefined
              }
            >
              {category.image ? (
                <Image
                  src={category.image}
                  alt={category.title}
                  width={56}
                  height={56}
                  className="h-12 w-12 sm:h-14 sm:w-14 object-contain"
                />
              ) : (
                <span className="text-3xl sm:text-4xl">
                  {category.icon ?? "📦"}
                </span>
              )}
            </div>

            {/* ✅ عنوان */}
            <span
              className={cn(
                "text-center text-[11px] sm:text-xs font-medium",
                "text-text-primary line-clamp-2 leading-tight",
                "group-hover/cat:text-brand-600 transition-colors"
              )}
            >
              {category.title}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}