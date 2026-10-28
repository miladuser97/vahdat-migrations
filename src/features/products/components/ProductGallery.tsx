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
  const [mainImage, setMainImage] = useState<string>(fallbackImage || "");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/products/${slug}/media`);
        if (res.ok) {
          const data = await res.json();
          setVariants(data.variants || []);
          setMedia(data.media || []);
          
          if (data.media.length > 0) {
            setMainImage(data.media[0].url);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, [slug]);

  const handleVariantSelect = (variantId: string) => {
    if (selectedVariant === variantId) {
      setSelectedVariant(null);
      setMainImage(media[0]?.url || fallbackImage || "");
      return;
    }

    setSelectedVariant(variantId);
    const variantMedia = media.find((m) => m.variantId === variantId);
    if (variantMedia) {
      setMainImage(variantMedia.url);
    } else {
      setMainImage(media[0]?.url || fallbackImage || "");
    }
  };

  const handleThumbnailClick = (url: string) => {
    setMainImage(url);
    setSelectedVariant(null);
  };

  return (
    <div className="space-y-4">
      {/* عکس اصلی */}
      <div className="relative w-full aspect-square border border-border rounded-lg overflow-hidden bg-white">
        {mainImage ? (
          <Image
            src={mainImage}
            alt="Product Image"
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            بدون عکس
          </div>
        )}
      </div>

      {/* انتخاب رنگ */}
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

      {/* گالری کوچک (تامبنیل‌ها) */}
      {media.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {media.map((m) => (
            <button
              key={m.id}
              onClick={() => handleThumbnailClick(m.url)}
              className={`relative aspect-square border rounded-lg overflow-hidden transition ${
                mainImage === m.url ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary"
              }`}
            >
              <Image src={m.url} alt="thumbnail" fill className="object-cover" sizes="100px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
