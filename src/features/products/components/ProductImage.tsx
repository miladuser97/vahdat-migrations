import Image from "next/image";
import { cn } from "@/utils/cn";
import type { ImageRef } from "@/types/media";

export interface ProductImageProps {
  image?: ImageRef;
  images?: ImageRef[];
  alt: string;
  className?: string;
}

/**
 * ProductImage
 * One responsibility: display a product's primary image, with a
 * consistent fallback when there is none, plus an optional thumbnail
 * strip when more than one image is available.
 *
 * Phase 10 note: this now covers what a separate "ProductGallery"
 * component would have done. A dedicated gallery component would have
 * exactly one real call site (the product details page) — the same
 * "prepare for a future gallery" job this component's `images` prop
 * was already designed for since Phase 7. Extending it here avoids a
 * duplicate abstraction; see the Phase 10 report.
 *
 * Uses next/image: remote patterns are now configured in
 * next.config.mjs (Supabase Storage, Vercel Blob, and general https),
 * so next/image can load and optimize real product images.
 */
export function ProductImage({ image, images, alt, className = "" }: ProductImageProps) {
  const gallery = images && images.length > 0 ? images : undefined;
  const primary = image ?? gallery?.[0];

  return (
    <div className="flex flex-col gap-sm">
      <div
        className={cn(
          "relative flex aspect-square items-center justify-center overflow-hidden rounded-md bg-muted",
          className,
        )}
      >
        {primary ? (
          <Image
            src={primary.url}
            alt={primary.alt ?? alt}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-xs text-text-secondary">
            <span className="text-3xl">🖼️</span>
            <span className="text-body-sm">تصویر محصول</span>
          </div>
        )}
      </div>

      {gallery && gallery.length > 1 && (
        <div role="list" aria-label="تصاویر بیشتر محصول" className="flex gap-xs">
          {gallery.slice(0, 5).map((thumbnail, index) => (
            <div
              key={`${thumbnail.url}-${index}`}
              role="listitem"
              className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-muted"
            >
              <Image
                src={thumbnail.url}
                alt={thumbnail.alt ?? alt}
                fill
                sizes="56px"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}