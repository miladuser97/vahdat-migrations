"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";

interface ProductGalleryProps {
  slug: string;
  fallbackImage: string | null;
}

export function ProductGallery({ slug, fallbackImage }: ProductGalleryProps) {
  const [variants, setVariants] = useState<any[]>([]);
  const [media, setMedia] = useState<any[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const imageRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/products/${slug}/media`);
        if (res.ok) {
          const data = await res.json();
          setVariants(data.variants || []);
          setMedia(data.media || []);
          
          // اگه عکس اول رنگ داشت، خودکار انتخابش کن
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

  // وقتی کاربر اسکرول می‌کنه، بفهم کدوم عکس وسط صفحه هست
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const scrollLeft = container.scrollLeft;
    const itemWidth = container.clientWidth; // عرض هر عکس (چون تمام‌صفحه هست)
    
    const activeIndex = Math.round(scrollLeft / itemWidth);
    const activeMedia = media[activeIndex];
    
    if (activeMedia && activeMedia.variantId) {
      setSelectedVariant(activeMedia.variantId);
    }
  };

  // وقتی روی دکمه رنگ کلیک می‌شه، برو به اولین عکس اون رنگ
  const handleVariantSelect = (variantId: string) => {
    setSelectedVariant(variantId);
    
    const firstIndexOfVariant = media.findIndex((m) => m.variantId === variantId);
    if (firstIndexOfVariant !== -1 && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      container.scrollTo({
        left: firstIndexOfVariant * container.clientWidth,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* گالری اسکرول افقی */}
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
              ref={(el) => { imageRefs.current[index] = el; }}
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

      {/* نشانگر عکس‌ها (نقطه‌های پایین) */}
      {media.length > 1 && (
        <div className="flex justify-center gap-1 mt-2">
          {media.map((_, index) => (
            <div 
              key={index} 
              className={`h-2 w-2 rounded-full transition-all ${
                Math.round((scrollContainerRef.current?.scrollLeft || 0) / (scrollContainerRef.current?.clientWidth || 1)) === index 
                  ? "bg-primary w-4" 
                  : "bg-gray-300"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
