"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";

interface ProductGalleryProps {
  slug: string;
  fallbackImage: string | null;
}

export function ProductGallery({ slug, fallbackImage }: ProductGalleryProps) {
  const [variants, setVariants] = useState<any[]>([]);
  const [rawMedia, setRawMedia] = useState<any[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // مرتب‌سازی عکس‌ها بر اساس رنگ
  const media = useMemo(() => {
    const sorted = [...rawMedia];
    sorted.sort((a, b) => {
      if (!a.variantId && b.variantId) return 1;
      if (a.variantId && !b.variantId) return -1;
      if (a.variantId && b.variantId) {
        return a.variantId.localeCompare(b.variantId);
      }
      return 0;
    });
    return sorted;
  }, [rawMedia]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/products/${slug}/media`);
        if (res.ok) {
          const data = await res.json();
          setVariants(data.variants || []);
          setRawMedia(data.media || []);
          
          if (data.media.length > 0 && data.media[0].variantId) {
            setSelectedVariant(data.media[0].variantId);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, [slug]);

  const scrollToIndex = (index: number) => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    container.scrollTo({
      left: index * container.clientWidth,
      behavior: "smooth",
    });
    setCurrentIndex(index);
  };

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const scrollLeft = container.scrollLeft;
    const itemWidth = container.clientWidth;
    const activeIndex = Math.round(scrollLeft / itemWidth);
    
    setCurrentIndex(activeIndex);
    
    const activeMedia = media[activeIndex];
    if (activeMedia && activeMedia.variantId) {
      setSelectedVariant(activeMedia.variantId);
    }
  };

  const handleVariantSelect = (variantId: string) => {
    setSelectedVariant(variantId);
    const firstIndexOfVariant = media.findIndex((m) => m.variantId === variantId);
    if (firstIndexOfVariant !== -1) {
      scrollToIndex(firstIndexOfVariant);
    }
  };

  return (
    <div className="space-y-4">
      {/* گالری اسکرول افقی */}
      <div className="relative group">
        <div 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth rounded-lg border border-border bg-white"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {media.length > 0 ? (
            media.map((m, index) => (
              <div 
                key={m.id} 
                className="w-full flex-shrink-0 snap-center aspect-square relative"
              >
                <Image 
                  src={m.url} 
                  alt={`Product image ${index + 1}`} 
                  fill 
                  className="object-contain" 
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            ))
          ) : (
            <div className="w-full flex-shrink-0 aspect-square relative flex items-center justify-center text-gray-400">
              {fallbackImage ? (
                <Image src={fallbackImage} alt="Fallback" fill className="object-contain" />
              ) : (
                "بدون عکس"
              )}
            </div>
          )}
        </div>

        {/* دکمه‌های ناوبری (دسکتاپ) */}
        {media.length > 1 && (
          <>
            <button
              onClick={() => scrollToIndex(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 w-10 h-10 rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition disabled:opacity-0 z-10"
              aria-label="Previous image"
            >
              ‹
            </button>
            <button
              onClick={() => scrollToIndex(Math.min(media.length - 1, currentIndex + 1))}
              disabled={currentIndex === media.length - 1}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 w-10 h-10 rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition disabled:opacity-0 z-10"
              aria-label="Next image"
            >
              ›
            </button>
          </>
        )}
      </div>

      {/* دکمه‌های رنگ */}
      {variants.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-text-primary">انتخاب رنگ:</p>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => (
              <button
                key={v.id}
                onClick={() => handleVariantSelect(v.id)}
                className={`flex items-center gap-2 px-3 py-1 border rounded-full transition ${
                  selectedVariant === v.id
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-border hover:border-primary"
                }`}
              >
                <span
                  className="w-4 h-4 rounded-full border border-gray-300"
                  style={{ backgroundColor: v.colorHex || "#000000" }}
                />
                <span className="text-sm">{v.color}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* نقطه‌های راهنما */}
      {media.length > 1 && (
        <div className="flex justify-center gap-1 mt-2">
          {media.map((_, index) => (
            <button 
              key={index} 
              onClick={() => scrollToIndex(index)}
              className={`h-2 rounded-full transition-all ${
                currentIndex === index ? "bg-primary w-4" : "bg-gray-300 w-2"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
