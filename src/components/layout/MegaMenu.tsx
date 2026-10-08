"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Menu,
  ChevronLeft,
  Smartphone,
  Tablet,
  Watch,
  Headphones,
  Cable,
  Laptop,
  Sparkles,
  Package,
  Recycle,
} from "lucide-react";
import { cn } from "@/utils/cn";

// ============================================================
// ساختار منو
// ============================================================
interface MegaMenuCategory {
  title: string;
  slug: string;
  icon: React.ReactNode;
  children: { title: string; slug: string }[];
}

const MEGA_MENU_DATA: MegaMenuCategory[] = [
  {
    title: "گوشی‌های هوشمند",
    slug: "smartphones",
    icon: <Smartphone className="h-5 w-5" />,
    children: [
      { title: "گوشی سامسونگ", slug: "samsung-phones" },
      { title: "گوشی اپل", slug: "apple-phones" },
      { title: "گوشی شیائومی", slug: "xiaomi-phones" },
      { title: "گوشی هواوی", slug: "huawei-phones" },
    ],
  },
  {
    title: "لپ‌تاپ",
    slug: "laptops",
    icon: <Laptop className="h-5 w-5" />,
    children: [
      { title: "لپ‌تاپ ایسوس", slug: "asus-laptops" },
      { title: "لپ‌تاپ لنوو", slug: "lenovo-laptops" },
      { title: "لپ‌تاپ اپل", slug: "apple-laptops" },
      { title: "لپ‌تاپ اچ‌پی", slug: "hp-laptops" },
    ],
  },
  {
    title: "تبلت",
    slug: "tablets",
    icon: <Tablet className="h-5 w-5" />,
    children: [
      { title: "آیپد اپل", slug: "apple-ipads" },
      { title: "تبلت سامسونگ", slug: "samsung-tabs" },
    ],
  },
  {
    title: "ساعت و دستبند هوشمند",
    slug: "smartwatches",
    icon: <Watch className="h-5 w-5" />,
    children: [
      { title: "اپل واچ", slug: "apple-watches" },
      { title: "ساعت سامسونگ", slug: "samsung-watches" },
    ],
  },
  {
    title: "هدفون و هندزفری",
    slug: "headphones",
    icon: <Headphones className="h-5 w-5" />,
    children: [
      { title: "ایرپاد", slug: "airpods" },
      { title: "هدفون دور گوشی", slug: "headphones-over-ear" },
    ],
  },
  {
    title: "لوازم جانبی",
    slug: "accessories",
    icon: <Cable className="h-5 w-5" />,
    children: [
      { title: "قاب و کاور", slug: "cases" },
      { title: "شارژر", slug: "chargers" },
      { title: "پاوربانک", slug: "powerbanks" },
      { title: "کابل", slug: "cables" },
      { title: "گلس", slug: "glass" },
    ],
  },
];

// ============================================================
// لینک‌های ویژه
// ============================================================
const SPECIAL_LINKS = [
  {
    title: "پیشنهاد ویژه",
    href: "/products?filter=discounted",
    icon: <Sparkles className="h-5 w-5" />,
    color: "text-destructive",
  },
  {
    title: "جدیدترین‌ها",
    href: "/products?filter=newest",
    icon: <Package className="h-5 w-5" />,
    color: "text-success",
  },
  {
    title: "کارکرده",
    href: "/products?filter=used",
    icon: <Recycle className="h-5 w-5" />,
    color: "text-brand-600",
  },
];

// ============================================================
// کامپوننت Mega Menu
// ============================================================
export function MegaMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  return (
    <div ref={menuRef} className="relative">
      {/* ✅ دکمه */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className={cn(
          "flex items-center gap-2 h-11 px-4 rounded-lg",
          "bg-brand-600 text-white",
          "hover:bg-brand-700 active:scale-[0.98]",
          "transition-all font-medium text-sm"
        )}
      >
        <Menu className="h-5 w-5" />
        <span>دسته‌بندی محصولات</span>
        <ChevronLeft
          className={cn(
            "h-4 w-4 transition-transform",
            isOpen && "-rotate-90"
          )}
        />
      </button>

      {/* ✅ پنل */}
      {isOpen && (
        <div
          role="menu"
          className={cn(
            "absolute top-full right-0 mt-2 z-50",
            "w-[1000px] max-w-[90vw]",
            "rounded-xl border border-border bg-card shadow-2xl",
            "overflow-hidden",
            "animate-fade-in"
          )}
        >
          <div className="grid grid-cols-12">
            {/* ✅ ستون‌های دسته‌بندی */}
            <div className="col-span-9 grid grid-cols-3 gap-6 p-6">
              {MEGA_MENU_DATA.map((category) => (
                <div key={category.slug}>
                  {/* عنوان دسته */}
                  <Link
                    href={`/categories/${category.slug}`}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2 mb-3 pb-2 border-b border-border"
                  >
                    <span className="text-brand-600">{category.icon}</span>
                    <span className="font-bold text-sm text-text-primary hover:text-brand-600 transition-colors">
                      {category.title}
                    </span>
                  </Link>

                  {/* زیردسته‌ها */}
                  <ul className="space-y-2">
                    {category.children.map((child) => (
                      <li key={child.slug}>
                        <Link
                          href={`/categories/${child.slug}`}
                          onClick={() => setIsOpen(false)}
                          className="block text-sm text-text-secondary hover:text-brand-600 hover:pr-1 transition-all"
                        >
                          {child.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* ✅ لینک‌های ویژه */}
            <div className="col-span-3 bg-muted/50 p-6 space-y-4">
              <h4 className="font-bold text-sm text-text-primary mb-3">
                پیشنهادهای ویژه
              </h4>

              {SPECIAL_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg",
                    "bg-card border border-border",
                    "hover:border-brand-500 hover:shadow-md",
                    "transition-all"
                  )}
                >
                  <span className={link.color}>{link.icon}</span>
                  <span className="font-medium text-sm">{link.title}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}