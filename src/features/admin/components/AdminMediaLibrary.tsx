"use client";

import { useState, useMemo, useRef } from "react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { FormMessage } from "@/components/ui/FormMessage";
import {
  uploadMediaAction,
  getAllMediaAction,
  deleteMediaAction,
  type MediaAssetData,
} from "@/lib/server/media-actions";
import { toPersianDigits } from "@/utils/text-utils";

interface AdminMediaLibraryProps {
  initialMedia: MediaAssetData[];
  currentUserRole: string;
}

const SOURCE_LABELS: Record<string, string> = {
  MANUAL_UPLOAD: "آپلود دستی",
  ICECAT: "Icecat",
  PIXABAY: "Pixabay",
  OPENVERSE: "Openverse",
  PEXELS: "Pexels",
  UNSPLASH: "Unsplash",
  SUPPLIER: "تأمین‌کننده",
  OTHER: "سایر",
};

export function AdminMediaLibrary({
  initialMedia,
  currentUserRole,
}: AdminMediaLibraryProps) {
  const [media, setMedia] = useState(initialMedia);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [successMessage, setSuccessMessage] = useState<string | undefined>(undefined);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // فیلترها
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");

  const isSuperAdmin = currentUserRole === "super_admin";

  // فیلتر و مرتب‌سازی
  const filteredMedia = useMemo(() => {
    let result = [...media];

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (m) =>
          m.filename.toLowerCase().includes(q) ||
          (m.title && m.title.toLowerCase().includes(q)) ||
          (m.altText && m.altText.toLowerCase().includes(q))
      );
    }

    if (sourceFilter !== "all") {
      result = result.filter((m) => m.source === sourceFilter);
    }

    if (sortBy === "newest") {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === "oldest") {
      result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (sortBy === "name") {
      result.sort((a, b) => a.filename.localeCompare(b.filename));
    } else if (sortBy === "size") {
      result.sort((a, b) => b.size - a.size);
    }

    return result;
  }, [media, searchQuery, sourceFilter, sortBy]);

  // آمار
  const stats = useMemo(() => {
    const total = media.length;
    const totalSize = media.reduce((sum, m) => sum + m.size, 0);
    const manualCount = media.filter((m) => m.source === "MANUAL_UPLOAD").length;
    return { total, totalSize, manualCount };
  }, [media]);

  // آپلود
  async function handleUpload(file: File) {
    setIsUploading(true);
    setError(undefined);
    setSuccessMessage(undefined);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const result = await uploadMediaAction(formData);

      if (!result.success) {
        setError(result.error || "خطا در آپلود.");
        setIsUploading(false);
        return;
      }

      // بارگذاری مجدد لیست
      const refreshed = await getAllMediaAction();
      if (refreshed.success) {
        setMedia(refreshed.data);
      }

      setSuccessMessage("عکس با موفقیت آپلود شد.");
      setTimeout(() => setSuccessMessage(undefined), 3000);
    } catch {
      setError("خطا در آپلود عکس.");
    }

    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
  }

  // حذف
  async function handleDelete(item: MediaAssetData) {
    if (!window.confirm(`آیا از حذف «${item.filename}» مطمئن هستید؟`)) return;

    setDeletingId(item.id);
    setError(undefined);
    setSuccessMessage(undefined);

    const result = await deleteMediaAction(item.id);

    if (!result.success) {
      setError(result.error || "خطا در حذف.");
      setDeletingId(null);
      return;
    }

    setMedia((current) => current.filter((m) => m.id !== item.id));
    setSuccessMessage("عکس حذف شد.");
    setDeletingId(null);
    setTimeout(() => setSuccessMessage(undefined), 3000);
  }

  // کپی URL
  async function copyUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setSuccessMessage("آدرس عکس کپی شد.");
      setTimeout(() => setSuccessMessage(undefined), 2000);
    } catch {
      setError("خطا در کپی.");
    }
  }

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function formatDate(date: Date): string {
    return new Date(date).toLocaleDateString("fa-IR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  return (
    <div className="flex flex-col gap-md">
      {/* کارت‌های آمار */}
      <div className="grid grid-cols-3 gap-sm">
        <Card className="p-3">
          <p className="text-caption text-text-secondary">کل عکس‌ها</p>
          <p className="text-h5 font-bold text-text-primary fa-num">
            {toPersianDigits(stats.total)}
          </p>
        </Card>
        <Card className="p-3">
          <p className="text-caption text-text-secondary">آپلود دستی</p>
          <p className="text-h5 font-bold text-success fa-num">
            {toPersianDigits(stats.manualCount)}
          </p>
        </Card>
        <Card className="p-3">
          <p className="text-caption text-text-secondary">حجم کل</p>
          <p className="text-h5 font-bold text-brand-600">
            {formatSize(stats.totalSize)}
          </p>
        </Card>
      </div>

      {/* دکمه‌ی آپلود */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-body font-medium text-text-primary">
              افزودن عکس جدید
            </p>
            <p className="text-caption text-text-secondary">
              حداکثر ۵ مگابایت — فقط فایل تصویری (JPG, PNG, WebP)
            </p>
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={isUploading}
              className="hidden"
              id="media-upload"
            />
            <label htmlFor="media-upload">
              <Button
                type="button"
                variant="default"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {isUploading ? "در حال آپلود..." : "📤 آپلود عکس"}
              </Button>
            </label>
          </div>
        </div>
      </Card>

      {/* پیام‌ها */}
      {error && <FormMessage variant="error">{error}</FormMessage>}
      {successMessage && <FormMessage variant="success">{successMessage}</FormMessage>}

      {/* نوار جستجو */}
      <Card className="flex flex-col gap-sm p-4 sm:flex-row sm:items-center">
        <div className="flex-1">
          <Input
            placeholder="🔍 جستجو در نام فایل..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-sm sm:w-auto">
          <div className="flex-1 sm:w-40">
            <Select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
            >
              <option value="all">همه‌ی منابع</option>
              <option value="MANUAL_UPLOAD">آپلود دستی</option>
              <option value="ICECAT">Icecat</option>
              <option value="PIXABAY">Pixabay</option>
              <option value="OPENVERSE">Openverse</option>
            </Select>
          </div>
          <div className="flex-1 sm:w-40">
            <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="newest">جدیدترین</option>
              <option value="oldest">قدیمی‌ترین</option>
              <option value="name">نام فایل</option>
              <option value="size">حجم</option>
            </Select>
          </div>
        </div>
      </Card>

      <p className="text-body-sm text-text-secondary">
        {toPersianDigits(filteredMedia.length)} عکس نمایش داده می‌شود
        {filteredMedia.length !== media.length && (
          <span className="text-text-muted"> (از {toPersianDigits(media.length)})</span>
        )}
      </p>

      {/* گرید عکس‌ها */}
      {filteredMedia.length === 0 ? (
        <Card>
          <p className="text-body-sm text-text-secondary text-center py-lg">
            {media.length === 0
              ? "هنوز هیچ عکسی آپلود نشده است."
              : "عکسی با این فیلترها یافت نشد."}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-sm sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filteredMedia.map((item) => {
            const isDeleting = deletingId === item.id;

            return (
              <Card key={item.id} className="overflow-hidden flex flex-col">
                {/* عکس */}
                <div className="relative aspect-square bg-muted">
                  <img
                    src={item.url}
                    alt={item.altText || item.filename}
                    className="h-full w-full object-contain"
                    loading="lazy"
                  />
                </div>

                {/* اطلاعات */}
                <div className="p-2 flex flex-col gap-1">
                  <p
                    className="text-caption truncate text-text-primary font-medium"
                    title={item.filename}
                  >
                    {item.filename}
                  </p>
                  <div className="flex flex-wrap items-center gap-1">
                    <Badge variant="default" className="text-[10px]">
                      {SOURCE_LABELS[item.source] || item.source}
                    </Badge>
                    <span className="text-[10px] text-text-muted fa-num">
                      {formatSize(item.size)}
                    </span>
                  </div>

                  {/* دکمه‌ها */}
                  <div className="flex gap-1 mt-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex-1 text-[10px] h-7 px-1"
                      onClick={() => copyUrl(item.url)}
                    >
                      📋 کپی
                    </Button>
                    {isSuperAdmin && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="flex-1 text-[10px] h-7 px-1 border-red-300 text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(item)}
                        disabled={isDeleting}
                      >
                        {isDeleting ? "..." : "🗑️"}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}