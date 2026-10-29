"use client";

import { useState, useEffect } from "react";
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

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/products/${slug}/media`);
        if (res.ok) {
          const data = await res.json();
          // مرتب‌سازی بر اساس رنگ
          const sortedMedia = (data.media || []).sort((a: any, b: any) => {
            if (!a.variantId && b.variantId) return 1;
            if (a.variantId && !b.variantId) return -1;
            return (a.variantId || "").localeCompare(b.variantId || "");
          });
          setVariants(data.variants || []);
          setRawMedia(sortedMedia);
          
          if (sortedMedia.length > 0 && sortedMedia[0].variantId) {
            setSelectedVariant(sortedMedia[0].variantId);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, [slug]);

  const handleVariantSelect = (variantId: string) => {
    setSelectedVariant(variantId);
    const firstIndex = rawMedia.findIndex((m) => m.variantId === variantId);
    if (firstIndex !== -1) {
      setCurrentIndex(firstIndex);
    }
  };

  const currentImage = rawMedia[currentIndex]?.url || fallbackImage;

  return (
    <div className="space-y-4">
      {/* عکس اصلی با دکمه‌های ناوبری */}
      <div className="relative w-full border border-border rounded-lg bg-white flex items-center justify-center" style={{ aspectRatio: "1/1", maxHeight: "500px" }}>
        {currentImage ? (
          <Image
            src={currentImage}
            alt="Product Image"
            fill
            className="object-contain p-4"
            sizes="(max-width: 768px) 100vw, 500px"
          />
        ) : (
          <div className="text-gray-400">بدون عکس</div>
        )}

        {/* دکمه‌های چپ و راست */}
        {rawMedia.length > 1 && (
          <>
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 w-10 h-10 rounded-full shadow-lg flex items-center justify-center disabled:opacity-0 transition"
            >
              ‹
            </button>
            <button
              onClick={() => setCurrentIndex((prev) => Math.min(rawMedia.length - 1, prev + 1))}
              disabled={currentIndex === rawMedia.length - 1}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 w-10 h-10 rounded-full shadow-lg flex items-center justify-center disabled:opacity-0 transition"
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
                <span className="w-4 h-4 rounded-full border border-gray-300" style={{ backgroundColor: v.colorHex || "#000000" }} />
                <span className="text-sm">{v.color}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
