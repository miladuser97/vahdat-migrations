"use client";

import { usePathname } from "next/navigation";
import { Breadcrumb, type BreadcrumbItem } from "./Breadcrumb";

// ============================================================
// نگاشت اسلاگ صفحات به اسم فارسی
// ============================================================
const PATH_LABELS: Record<string, string> = {
  // صفحات اصلی
  "products": "فروشگاه",
  "categories": "دسته‌بندی‌ها",
  "cart": "سبد خرید",
  "checkout": "پرداخت",
  "account": "حساب کاربری",
  "about": "درباره ما",
  "contact": "تماس با ما",
  "faq": "سوالات متداول",
  "terms": "شرایط و مقررات",
  "privacy": "حریم خصوصی",
  "installment": "خرید اقساطی",
  "repair": "درخواست تعمیر",
  "search": "جستجو",
  "login": "ورود",
  "register": "ثبت‌نام",
  "forgot-password": "فراموشی رمز",
  "reset-password": "تغییر رمز",
  "blog": "وبلاگ",
  "admin": "پنل ادمین",

  // زیرصفحه‌های حساب کاربری
  "orders": "سفارش‌ها",
  "addresses": "آدرس‌ها",
  "profile": "پروفایل",
  "wishlist": "علاقه‌مندی‌ها",

  // زیرصفحه‌های پنل ادمین
  "users": "کاربران",
  "coupons": "کوپن‌ها",
  "reviews": "نظرات",
  "settings": "تنظیمات",
  "media": "کتابخانه‌ی عکس",
  "new": "افزودن جدید",
  "edit": "ویرایش",

  // زیرصفحه‌های تعمیرات
  "track": "پیگیری",
};

/**
 * AutoBreadcrumb
 * به صورت خودکار از URL، Breadcrumb می‌سازه.
 * مثال:
 *   /products/samsung-s24 → خانه > فروشگاه > samsung-s24
 *   /account/orders → خانه > حساب کاربری > سفارش‌ها
 *   /categories/laptops → خانه > دسته‌بندی‌ها > laptops
 */
export function AutoBreadcrumb() {
  const pathname = usePathname();

  // صفحه‌ی اصلی، Breadcrumb نمی‌خواد
  if (pathname === "/") return null;

  // شکستن URL به بخش‌ها
  const segments = pathname.split("/").filter(Boolean);

  const items: BreadcrumbItem[] = [];
  let currentPath = "";

  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === segments.length - 1;

    // ترجمه: اگه توی دیکشنری بود، استفاده کن، وگرنه خود اسلاگ
    const label = PATH_LABELS[segment] ?? decodeURIComponent(segment);

    items.push({
      label,
      href: isLast ? undefined : currentPath,
    });
  });

  return <Breadcrumb items={items} showHome={true} />;
}