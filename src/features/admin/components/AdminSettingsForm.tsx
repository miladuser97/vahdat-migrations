"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { FormMessage } from "@/components/ui/FormMessage";
import { updateSettingAction } from "@/lib/server/admin-actions";

interface SettingItem {
  key: string;
  label: string;
  description: string;
}

interface SettingCategory {
  title: string;
  items: SettingItem[];
}

const SETTINGS_CATEGORIES: SettingCategory[] = [
  {
    title: "📄 صفحه اصلی",
    items: [
      { key: "trust_bar_enabled", label: "نوار اعتماد (Trust Bar)", description: "نمایش نوار ویژگی‌های اعتماد در بالای صفحه" },
      { key: "brands_slider_enabled", label: "اسلایدر برندها", description: "نمایش اسلایدر برندها در صفحه اصلی" },
      { key: "countdown_timer_enabled", label: "تایمر تخفیف", description: "نمایش تایمر شمارش معکوس برای تخفیفات" },
      { key: "blog_preview_enabled", label: "پیش‌نمایش وبلاگ", description: "نمایش آخرین مقالات وبلاگ در صفحه اصلی" },
    ],
  },
  {
    title: "🛒 سبد خرید و پرداخت",
    items: [
      { key: "zarinpal_enabled", label: "درگاه زرین‌پال", description: "فعال/غیرفعال کردن پرداخت آنلاین زرین‌پال" },
      { key: "cash_on_delivery_enabled", label: "پرداخت در محل", description: "امکان انتخاب پرداخت در محل" },
      { key: "installment_enabled", label: "خرید اقساطی", description: "امکان خرید اقساطی" },
    ],
  },
  {
    title: "👤 حساب کاربری",
    items: [
      { key: "wishlist_enabled", label: "علاقه‌مندی‌ها", description: "امکان افزودن محصول به علاقه‌مندی‌ها" },
      { key: "compare_enabled", label: "مقایسه محصولات", description: "امکان مقایسه محصولات با هم" },
      { key: "loyalty_points_enabled", label: "امتیاز وفاداری", description: "سیستم امتیازدهی به مشتریان" },
      { key: "financial_test_enabled", label: "تست مالی", description: "تست اعتبار مالی برای خرید اقساطی" },
    ],
  },
  {
    title: "📦 محصولات",
    items: [
      { key: "quick_view_enabled", label: "مشاهده سریع", description: "امکان مشاهده سریع محصول از لیست" },
      { key: "product_rating_enabled", label: "امتیازدهی محصولات", description: "امکان ثبت نظر و امتیاز برای محصولات" },
      { key: "used_products_enabled", label: "محصولات کارکرده", description: "بخش محصولات کارکرده" },
      { key: "techno_time_enabled", label: "تکنو تایم", description: "بخش پیشنهادهای لحظه‌ای" },
    ],
  },
  {
    title: "🔧 تعمیرات",
    items: [
      { key: "repair_enabled", label: "درخواست تعمیر", description: "امکان ثبت درخواست تعمیر" },
      { key: "repair_tracking_enabled", label: "پیگیری تعمیرات", description: "امکان پیگیری وضعیت تعمیر" },
    ],
  },
  {
    title: "📞 تماس و پیام‌رسان",
    items: [
      { key: "live_chat_enabled", label: "چت زنده", description: "نمایش چت زنده در سایت" },
      { key: "floating_contact_enabled", label: "Floating Contact", description: "دکمه‌ی شناور تماس" },
      { key: "whatsapp_enabled", label: "واتساپ", description: "نمایش آیکون واتساپ" },
      { key: "telegram_enabled", label: "تلگرام", description: "نمایش آیکون تلگرام" },
      { key: "google_map_enabled", label: "نقشه گوگل", description: "نمایش نقشه گوگل در صفحه تماس" },
    ],
  },
  {
    title: "🎨 سایر",
    items: [
      { key: "dark_mode_enabled", label: "دارک مود", description: "امکان تغییر تم به حالت تاریک" },
      { key: "admin_panel_enabled", label: "پنل ادمین", description: "فعال بودن پنل ادمین" },
    ],
  },
];

interface AdminSettingsFormProps {
  initialSettings: Record<string, boolean>;
}

export function AdminSettingsForm({ initialSettings }: AdminSettingsFormProps) {
  const [settings, setSettings] = useState<Record<string, boolean>>(initialSettings);
  const [error, setError] = useState<string | undefined>(undefined);
  const [successMessage, setSuccessMessage] = useState<string | undefined>(undefined);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  async function handleToggle(key: string, currentValue: boolean) {
    setError(undefined);
    setSuccessMessage(undefined);
    setBusyKey(key);

    const result = await updateSettingAction(key, !currentValue);

    if (!result.success) {
      setError(result.error || "خطا در ذخیره تنظیمات.");
      setBusyKey(null);
      return;
    }

    setSettings((current) => ({ ...current, [key]: !currentValue }));
    setSuccessMessage("تنظیمات با موفقیت ذخیره شد.");
    setBusyKey(null);
  }

  return (
    <div className="flex flex-col gap-lg">
      {error && <FormMessage variant="error">{error}</FormMessage>}
      {successMessage && <FormMessage variant="success">{successMessage}</FormMessage>}

      {SETTINGS_CATEGORIES.map((category) => (
        <Card key={category.title} className="flex flex-col gap-md">
          <h3 className="text-h5 font-bold text-text-primary border-b border-border pb-sm">
            {category.title}
          </h3>

          <div className="flex flex-col gap-sm">
            {category.items.map((item) => {
              const isEnabled = settings[item.key] ?? false;
              const isBusy = busyKey === item.key;

              return (
                <div
                  key={item.key}
                  className="flex items-center justify-between gap-md py-2 border-b border-border/50 last:border-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-text-primary text-body-sm">
                      {item.label}
                    </p>
                    <p className="text-caption text-text-secondary">
                      {item.description}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggle(item.key, isEnabled)}
                    disabled={isBusy}
                    aria-label={isEnabled ? "غیرفعال کردن" : "فعال کردن"}
                    aria-pressed={isEnabled}
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                      isEnabled ? "bg-success" : "bg-muted"
                    } ${isBusy ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                        isEnabled ? "-translate-x-1" : "-translate-x-6"
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </Card>
      ))}
    </div>
  );
}