"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShoppingBag,
  Grid3x3,
  Sparkles,
  Recycle,
  BookOpen,
  Info,
  Phone,
  User,
  ChevronLeft,
  LayoutDashboard,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { toPersianDigits } from "@/utils/text-utils";

export interface MobileMenuItem {
  label: string;
  href: string;
}

export interface MobileMenuProps {
  id: string;
  items: MobileMenuItem[];
  open: boolean;
  onClose: () => void;
}

// ============================================================
// نگاشت برچسب → آیکون
// ============================================================
const ICON_MAP: Record<string, React.ReactNode> = {
  "فروشگاه": <ShoppingBag className="h-5 w-5" />,
  "دسته‌بندی‌ها": <Grid3x3 className="h-5 w-5" />,
  "پیشنهاد ویژه": <Sparkles className="h-5 w-5" />,
  "کارکرده": <Recycle className="h-5 w-5" />,
  "وبلاگ": <BookOpen className="h-5 w-5" />,
  "درباره ما": <Info className="h-5 w-5" />,
  "تماس با ما": <Phone className="h-5 w-5" />,
  "حساب کاربری": <User className="h-5 w-5" />,
  "ورود / ثبت‌نام": <User className="h-5 w-5" />,
  "مدیریت": <LayoutDashboard className="h-5 w-5" />,
};

export function MobileMenu({ id, items, open, onClose }: MobileMenuProps) {
  const pathname = usePathname();
  const firstLinkRef = useRef<HTMLAnchorElement>(null);
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 200);
  }, [onClose]);

  useEffect(() => {
    if (open) {
      firstLinkRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        handleClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, handleClose]);

  if (!open) return null;

  const currentYear = new Date().getFullYear();

  return (
    <>
      <div
        onClick={handleClose}
        aria-hidden="true"
        className={cn(
          "lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm",
          "animate-fade-in",
          isClosing && "animate-fade-out"
        )}
      />

      <nav
        id={id}
        aria-label="ناوبری موبایل"
        className={cn(
          "lg:hidden fixed top-0 right-0 bottom-0 z-50",
          "w-[85%] max-w-sm",
          "bg-card border-l border-border shadow-2xl",
          "flex flex-col",
          "transition-transform duration-200",
          isClosing ? "translate-x-full" : "translate-x-0"
        )}
      >
        {/* هدر پنل */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <span className="text-base font-bold text-text-primary">
            منوی اصلی
          </span>
          <button
            type="button"
            onClick={handleClose}
            aria-label="بستن منو"
            className={cn(
              "flex items-center justify-center",
              "h-9 w-9 rounded-lg",
              "text-text-secondary hover:bg-muted",
              "transition-colors"
            )}
          >
            <ChevronLeft className="h-5 w-5 rotate-180" />
          </button>
        </div>

        {/* لینک‌های اصلی */}
        <div className="flex-1 overflow-y-auto p-2">
          <ul className="space-y-1">
            {items.map((item, index) => {
              const isActive = pathname === item.href;
              const icon = ICON_MAP[item.label];

              return (
                <li key={item.href}>
                  <Link
                    ref={index === 0 ? firstLinkRef : undefined}
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    onClick={handleClose}
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 rounded-lg",
                      "transition-colors",
                      isActive
                        ? "bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-400 font-bold"
                        : "text-text-secondary hover:bg-muted hover:text-text-primary"
                    )}
                  >
                    {icon && (
                      <span className={cn(isActive && "text-brand-600")}>
                        {icon}
                      </span>
                    )}
                    <span className="flex-1 text-sm">{item.label}</span>
                    <ChevronLeft className="h-4 w-4 opacity-50" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* فوتر پنل */}
        <div className="p-4 border-t border-border bg-muted/50">
          <p className="text-xs text-text-muted text-center fa-num">
            © {toPersianDigits(currentYear)} موبایل وحدت
          </p>
        </div>
      </nav>
    </>
  );
}