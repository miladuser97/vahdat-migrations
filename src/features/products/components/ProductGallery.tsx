"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface ProductGalleryProps {
  slug: string;
  fallbackImage: string | null;
}

export function ProductGallery({ slug, fallbackImage }: ProductGalleryProps) {
  const [variants, setVariants] = useState<any[]>([]);
  const [media, setMedia] = useState<any[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
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
          setVariants(data.variants || []);
          setMedia(sortedMedia);
          
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
    const firstIndex = media.findIndex((m) => m.variantId === variantId);
    if (firstIndex !== -1) {
      setCurrentIndex(firstIndex);
    }
  };

  const currentImage = media[currentIndex]?.url || fallbackImage;

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* ستون سمت راست: عکس اصلی و گالری کوچک */}
      <div className="flex-1">
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
        </div>

        {/* نوار گالری کوچک */}
        {media.length > 0 && (
          <div className="flex gap-2 mt-2 overflow-x-auto pb-2" style={{ scrollbarWidth: "thin" }}>
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

      {/* ستون سمت چپ: دکمه‌های رنگ (در دسکتاپ کنار عکس، در موبایل زیر عکس) */}
      <div className="w-full lg:w-1/3 space-y-4">
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
    </div>
  );
}
