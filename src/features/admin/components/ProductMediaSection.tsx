"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { FormMessage } from "@/components/ui/FormMessage";
import { Input } from "@/components/ui/Input";
import {
  uploadMediaAction,
  attachMediaToProductAction,
  detachMediaFromProductAction,
  getProductMediaAction,
  getAllMediaAction,
  type ProductMediaData,
  type MediaAssetData,
} from "@/lib/server/media-actions";
import { toPersianDigits } from "@/utils/text-utils";
import { cn } from "@/utils/cn";

interface ProductMediaSectionProps {
  productId: string;
}

export function ProductMediaSection({ productId }: ProductMediaSectionProps) {
  // عکس‌های متصل به محصول
  const [productMedia, setProductMedia] = useState<ProductMediaData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // آرشیو کامل (برای انتخاب از موجود)
  const [libraryMedia, setLibraryMedia] = useState<MediaAssetData[]>([]);
  const [showLibrary, setShowLibrary] = useState(false);
  const [librarySearch, setLibrarySearch] = useState("");

  // وضعیت‌ها
  const [isUploading, setIsUploading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | undefined>(undefined);
  const [successMessage, setSuccessMessage] = useState<string | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // بارگذاری اولیه
  useEffect(() => {
    async function load() {
      try {
        const [productResult, libraryResult] = await Promise.all([
          getProductMediaAction(productId),
          getAllMediaAction(),
        ]);
        if (productResult.success) setProductMedia(productResult.data);
        if (libraryResult.success) setLibraryMedia(libraryResult.data);
      } catch {
        setError("خطا در بارگذاری عکس‌ها.");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [productId]);

  function showSuccess(msg: string) {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(undefined), 3000);
  }

  // ============================================================
  // آپلود عکس جدید + اتصال خودکار
  // ============================================================
  async function handleUpload(file: File) {
    setIsUploading(true);
    setError(undefined);
    setSuccessMessage(undefined);

    try {
      // ۱. آپلود
      const formData = new FormData();
      formData.append("file", file);
      const uploadResult = await uploadMediaAction(formData);

      if (!uploadResult.success) {
        setError(uploadResult.error || "خطا در آپلود.");
        setIsUploading(false);
        return;
      }

      // ۲. اتصال خودکار به محصول
      const attachResult = await attachMediaToProductAction(
        productId,
        uploadResult.data.mediaId,
        {
          isPrimary: productMedia.length === 0, // اگه اولین عکسه، primary
          displayOrder: productMedia.length,
        }
      );

      if (!attachResult.success) {
        setError(attachResult.error || "عکس آپلود شد ولی به محصول وصل نشد.");
        setIsUploading(false);
        return;
      }

      // ۳. بارگذاری مجدد
      const refreshed = await getProductMediaAction(productId);
      if (refreshed.success) setProductMedia(refreshed.data);

      // ۴. اضافه به آرشیو
      const libRefreshed = await getAllMediaAction();
      if (libRefreshed.success) setLibraryMedia(libRefreshed.data);

      showSuccess("عکس با موفقیت آپلود و به محصول متصل شد.");
    } catch {
      setError("خطا در آپلود عکس.");
    }

    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  }

  // ============================================================
  // اتصال از آرشیو
  // ============================================================
  async function handleAttachFromLibrary(mediaId: string) {
    setBusyId(mediaId);
    setError(undefined);

    const result = await attachMediaToProductAction(productId, mediaId, {
      isPrimary: productMedia.length === 0,
      displayOrder: productMedia.length,
    });

    if (!result.success) {
      setError(result.error || "خطا در اتصال.");
      setBusyId(null);
      return;
    }

    const refreshed = await getProductMediaAction(productId);
    if (refreshed.success) setProductMedia(refreshed.data);

    showSuccess("عکس به محصول متصل شد.");
    setBusyId(null);
  }

  // ============================================================
  // حذف اتصال
  // ============================================================
  async function handleDetach(productMediaId: string) {
    if (!window.confirm("این عکس از محصول حذف بشه؟ (توی آرشیو می‌مونه)")) return;

    setBusyId(productMediaId);
    setError(undefined);

    const result = await detachMediaFromProductAction(productMediaId);

    if (!result.success) {
      setError(result.error || "خطا در حذف اتصال.");
      setBusyId(null);
      return;
    }

    setProductMedia((current) => current.filter((m) => m.id !== productMediaId));
    showSuccess("عکس از محصول جدا شد.");
    setBusyId(null);
  }

  // ============================================================
  // تغییر عکس اصلی
  // ============================================================
  async function handleSetPrimary(productMediaId: string, mediaId: string) {
    setBusyId(productMediaId);
    setError(undefined);

    // حذف primary از بقیه
    for (const item of productMedia) {
      if (item.isPrimary && item.id !== productMediaId) {
        await detachMediaFromProductAction(item.id);
        await attachMediaToProductAction(productId, item.mediaId, {
          isPrimary: false,
          displayOrder: item.displayOrder,
        });
      }
    }

    // اتصال مجدد به عنوان primary
    await detachMediaFromProductAction(productMediaId);
    const result = await attachMediaToProductAction(productId, mediaId, {
      isPrimary: true,
      displayOrder: 0,
    });

    if (!result.success) {
      setError(result.error || "خطا در تغییر عکس اصلی.");
      setBusyId(null);
      return;
    }

    const refreshed = await getProductMediaAction(productId);
    if (refreshed.success) setProductMedia(refreshed.data);

    showSuccess("عکس اصلی تغییر کرد.");
    setBusyId(null);
  }

  // فیلتر آرشیو
  const filteredLibrary = libraryMedia.filter((m) => {
    if (!librarySearch.trim()) return true;
    const q = librarySearch.trim().toLowerCase();
    return (
      m.filename.toLowerCase().includes(q) ||
      (m.title && m.title.toLowerCase().includes(q))
    );
  });

  // چک: عکس توی محصول هست؟
  function isAttached(mediaId: string): boolean {
    return productMedia.some((pm) => pm.mediaId === mediaId);
  }

  if (isLoading) {
    return (
      <Card className="p-6">
        <p className="text-body-sm text-text-secondary">در حال بارگذاری عکس‌ها...</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4 border-b border-border pb-2">
        <h3 className="text-h4 font-semibold text-text-primary">
          🖼️ عکس‌های محصول ({toPersianDigits(productMedia.length)})
        </h3>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowLibrary(!showLibrary)}
          >
            {showLibrary ? "بستن آرشیو" : "📚 انتخاب از آرشیو"}
          </Button>
        </div>
      </div>

      {error && <FormMessage variant="error">{error}</FormMessage>}
      {successMessage && <FormMessage variant="success">{successMessage}</FormMessage>}

      {/* ========================================== */}
      {/* دکمه‌ی آپلود */}
      {/* ========================================== */}
      <div className="mb-4 p-4 border-2 border-dashed border-border rounded-lg text-center">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={isUploading}
          className="hidden"
          id="product-media-upload"
        />
        <label htmlFor="product-media-upload" className="cursor-pointer">
          <div className="flex flex-col items-center gap-2">
            <span className="text-3xl">📤</span>
            <p className="text-body font-medium text-text-primary">
              {isUploading ? "در حال آپلود..." : "آپلود عکس جدید"}
            </p>
            <p className="text-caption text-text-secondary">
              حداکثر ۵ مگابایت — JPG، PNG، WebP
            </p>
            <Button
              type="button"
              variant="default"
              size="sm"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="mt-2"
            >
              {isUploading ? "..." : "انتخاب فایل"}
            </Button>
          </div>
        </label>
      </div>

      {/* ========================================== */}
      {/* گالری عکس‌های متصل */}
      {/* ========================================== */}
      {productMedia.length === 0 ? (
        <p className="text-body-sm text-text-secondary text-center py-4">
          هنوز عکسی به این محصول متصل نشده.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {productMedia.map((item) => {
            const isBusy = busyId === item.id;

            return (
              <div
                key={item.id}
                className={cn(
                  "relative rounded-lg border-2 overflow-hidden",
                  item.isPrimary ? "border-brand-600" : "border-border"
                )}
              >
                {/* عکس */}
                <div className="aspect-square bg-muted relative">
                  <img
                    src={item.media.url}
                    alt={item.media.altText || item.media.filename}
                    className="h-full w-full object-contain"
                    loading="lazy"
                  />

                  {/* بج عکس اصلی */}
                  {item.isPrimary && (
                    <div className="absolute top-2 right-2">
                      <Badge variant="success">⭐ اصلی</Badge>
                    </div>
                  )}
                </div>

                {/* دکمه‌ها */}
                <div className="p-2 flex flex-col gap-1">
                  {!item.isPrimary && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full text-caption h-7"
                      onClick={() => handleSetPrimary(item.id, item.mediaId)}
                      disabled={isBusy}
                    >
                      ⭐ اصلی کن
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full text-caption h-7 border-red-300 text-red-600 hover:bg-red-50"
                    onClick={() => handleDetach(item.id)}
                    disabled={isBusy}
                  >
                    {isBusy ? "..." : "🗑️ حذف"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================== */}
      {/* آرشیو (برای انتخاب) */}
      {/* ========================================== */}
      {showLibrary && (
        <div className="mt-6 pt-4 border-t border-border">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-body font-bold text-text-primary">
              📚 آرشیو عکس‌ها
            </h4>
            <span className="text-caption text-text-secondary fa-num">
              {toPersianDigits(filteredLibrary.length)} عکس
            </span>
          </div>

          <div className="mb-3">
            <Input
              placeholder="🔍 جستجو در آرشیو..."
              value={librarySearch}
              onChange={(e) => setLibrarySearch(e.target.value)}
            />
          </div>

          {filteredLibrary.length === 0 ? (
            <p className="text-body-sm text-text-secondary text-center py-4">
              عکسی در آرشیو پیدا نشد.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 max-h-96 overflow-y-auto p-1">
              {filteredLibrary.map((item) => {
                const attached = isAttached(item.id);
                const isBusy = busyId === item.id;

                return (
                  <div
                    key={item.id}
                    className={cn(
                      "relative rounded-lg border overflow-hidden group",
                      attached ? "border-success opacity-60" : "border-border hover:border-brand-600"
                    )}
                  >
                    <div className="aspect-square bg-muted">
                      <img
                        src={item.url}
                        alt={item.altText || item.filename}
                        className="h-full w-full object-contain"
                        loading="lazy"
                      />
                    </div>

                    {/* Overlay */}
                    {!attached && (
                      <button
                        type="button"
                        onClick={() => handleAttachFromLibrary(item.id)}
                        disabled={isBusy}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      >
                        <span className="text-white text-xs font-bold bg-brand-600 px-2 py-1 rounded">
                          {isBusy ? "..." : "+ اتصال"}
                        </span>
                      </button>
                    )}

                    {attached && (
                      <div className="absolute top-1 right-1">
                        <Badge variant="success" className="text-[9px]">
                          ✓ متصل
                        </Badge>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}