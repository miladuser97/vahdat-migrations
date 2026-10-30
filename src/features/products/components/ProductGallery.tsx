"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface ProductGalleryProps {
  slug: string;
  fallbackImage: string | null;
  onVariantSelect?: (variantId: string | null) => void;
  activeVariantId?: string | null;
}

export function ProductGallery({ slug, fallbackImage, onVariantSelect, activeVariantId }: ProductGalleryProps) {
  const [media, setMedia] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/products/${slug}/media`);
        if (res.ok) {
          const data = await res.json();
          // مرتب‌سازی عکس‌ها بر اساس رنگ
          const sortedMedia = (data.media || []).sort((a: any, b: any) => {
            if (!a.variantId && b.variantId) return 1;
            if (a.variantId && !b.variantId) return -1;
            return (a.variantId || "").localeCompare(b.variantId || "");
          });
          setMedia(sortedMedia);
        }
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, [slug]);

  // وقتی رنگ تغییر می‌کنه، برو به اولین عکس اون رنگ
  useEffect(() => {
    if (activeVariantId) {
      const index = media.findIndex((m) => m.variantId === activeVariantId);
      if (index !== -1) {
        setCurrentIndex(index);
      }
    } else if (activeVariantId === null) {
      setCurrentIndex(0); // اگر رنگ برداشته شد، برو به عکس اول
    }
  }, [activeVariantId, media]);

  const currentImage = media[currentIndex]?.url || fallbackImage;

  return (
    <div className="flex flex-col gap-4">
      {/* عکس اصلی */}
      <div className="relative w-full aspect-square border border-border rounded-lg bg-white flex items-center justify-center overflow-hidden">
        {currentImage ? (
          <Image
            src={currentImage}
            alt="Product Image"
            fill
            className="object-contain p-2"
            sizes="(max-width: 768px) 100vw, 500px"
          />
        ) : (
          <div className="text-gray-400">بدون عکس</div>
        )}

        {/* دکمه‌های ناوبری */}
        {media.length > 1 && (
          <>
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 w-10 h-10 rounded-full shadow-lg flex items-center justify-center disabled:opacity-0 transition z-10"
            >
              ‹
            </button>
            <button
              onClick={() => setCurrentIndex((prev) => Math.min(media.length - 1, prev + 1))}
              disabled={currentIndex === media.length - 1}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 w-10 h-10 rounded-full shadow-lg flex items-center justify-center disabled:opacity-0 transition z-10"
            >
              ›
            </button>
          </>
        )}
      </div>

      {/* نوار تامبنیل‌ها */}
      {media.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {media.map((m, index) => (
            <button
              key={m.id}
              onClick={() => setCurrentIndex(index)}
              className={`relative w-16 h-16 flex-shrink-0 rounded border-2 overflow-hidden transition ${
                currentIndex === index ? "border-primary" : "border-transparent hover:border-gray-300"
              }`}
            >
              <Image src={m.url} alt={`thumbnail ${index}`} fill className="object-cover" sizes="64px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
