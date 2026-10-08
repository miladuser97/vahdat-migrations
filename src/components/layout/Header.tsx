"use client";

import { useId, useState, useEffect } from "react";
import Link from "next/link";
import {
  Heart,
  ShoppingCart,
  User,
  Phone,
  MapPin,
  Menu as MenuIcon,
  X,
  Wrench,
} from "lucide-react";
import { Container } from "@/components/layout/Container";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { MegaMenu } from "@/components/layout/MegaMenu";
import { Logo } from "@/components/shared/Logo";
import { SearchBar } from "@/components/shared/SearchBar";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Badge } from "@/components/ui/Badge";
import { useCart } from "@/features/cart/CartProvider";
import { useAuth } from "@/features/account/AuthContext";
import { MAIN_MENU, CONTACT_INFO, SOCIAL_LINKS } from "@/config/navigation/menu";
import { cn } from "@/utils/cn";
import { toPersianDigits } from "@/utils/text-utils";
import {
  InstagramBrandIcon,
  TelegramBrandIcon,
  WhatsAppBrandIcon,
  BaleBrandIcon,
} from "@/components/ui/brand-icons";

// ============================================================
// داده‌ی پیام‌رسان‌ها
// ============================================================
const SOCIAL_ITEMS = [
  {
    id: "instagram",
    label: "اینستاگرام",
    href: SOCIAL_LINKS.instagram,
    icon: <InstagramBrandIcon className="h-7 w-7" />,
  },
  {
    id: "telegram",
    label: "تلگرام",
    href: SOCIAL_LINKS.telegram,
    icon: <TelegramBrandIcon className="h-7 w-7" />,
  },
  {
    id: "whatsapp",
    label: "واتساپ",
    href: SOCIAL_LINKS.whatsapp,
    icon: <WhatsAppBrandIcon className="h-7 w-7" />,
  },
  {
    id: "bale",
    label: "بله",
    href: SOCIAL_LINKS.bale,
    icon: <BaleBrandIcon className="h-7 w-7" />,
  },
];

// ============================================================
// ✅ آیتم‌هایی که توی Bottom Nav هستن (از MobileMenu حذف می‌شن)
// ============================================================
const BOTTOM_NAV_PATHS = [
  "/",
  "/categories",
  "/cart",
  "/repair",
  "/account",
  "/login",
];

// ============================================================
// Header
// ============================================================
interface HeaderProps {
  showWhatsApp?: boolean;
  showTelegram?: boolean;
  showWishlist?: boolean;
  showDarkMode?: boolean;
  showRepair?: boolean;
}

export function Header({
  showWhatsApp = true,
  showTelegram = true,
  showWishlist = true,
  showDarkMode = true,
  showRepair = true,
}: HeaderProps) {
  const { items } = useCart();
  const { user, status } = useAuth();
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const mobileMenuId = useId();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isAuthenticated = status === "authenticated" && Boolean(user);
  const isAdminTier =
    isAuthenticated && (user?.role === "admin" || user?.role === "super_admin");
  const accountHref = isAuthenticated ? "/account" : "/login";
  const accountLabel = isAuthenticated
    ? user?.firstName || "حساب کاربری"
    : "ورود / ثبت‌نام";

  // ✅ فیلتر پیام‌رسان‌ها: حذف خالی + بر اساس تنظیمات
  const visibleSocialItems = SOCIAL_ITEMS.filter((item) => {
    if (!item.href || item.href.trim() === "") return false;
    if (item.id === "whatsapp") return showWhatsApp;
    if (item.id === "telegram") return showTelegram;
    return true;
  });

  // ✅ فیلتر MAIN_MENU (حذف آیتم‌هایی که توی Bottom Nav هستن)
  const filteredMainMenu = MAIN_MENU.filter(
    (item) => !BOTTOM_NAV_PATHS.includes(item.href)
  );

  const mobileNavItems = [
    ...filteredMainMenu,
    ...(isAdminTier ? [{ label: "مدیریت", href: "/admin" }] : []),
  ];

  return (
    <>
      {/* Top Bar — دسکتاپ sticky */}
      <div className="hidden lg:block sticky top-0 z-50 bg-brand-600 text-white text-xs">
        <Container>
          <div className="flex h-10 items-center justify-between">
            <div className="flex items-center gap-6">
              {CONTACT_INFO.phone && (
                <a
                  href={`tel:${CONTACT_INFO.phone}`}
                  className="flex items-center gap-1.5 hover:text-white/80 transition-colors"
                >
                  <Phone className="h-3.5 w-3.5" />
                  <span className="fa-num" dir="ltr">
                    {toPersianDigits(CONTACT_INFO.phone)}
                  </span>
                </a>
              )}
              {CONTACT_INFO.workingHours && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{CONTACT_INFO.workingHours}</span>
                </div>
              )}

              {visibleSocialItems.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="opacity-50">|</span>
                  {visibleSocialItems.map((item) => (
                    <div key={item.id} className="relative group">
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={item.label}
                        className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full hover:scale-110 transition-transform"
                      >
                        {item.icon}
                      </a>
                      <span
                        className={cn(
                          "absolute top-full left-1/2 -translate-x-1/2 mt-1",
                          "px-2 py-0.5 rounded text-[10px] whitespace-nowrap",
                          "bg-gray-900 text-white",
                          "opacity-0 invisible group-hover:opacity-100 group-hover:visible",
                          "transition-all duration-200",
                          "pointer-events-none z-50"
                        )}
                      >
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              <span>🚚 ارسال سریع به سراسر ایران</span>
              <span className="opacity-50">|</span>
              <span>✅ ضمانت اصالت کالا</span>
            </div>
          </div>
        </Container>
      </div>

      {/* Main Header */}
      <header
        className={cn(
          "sticky top-0 lg:top-10 z-40",
          "transition-all duration-300",
          isScrolled
            ? "bg-background/95 backdrop-blur-md shadow-md border-b border-border"
            : "bg-background border-b border-border/50"
        )}
      >
        <Container>
          <div className="flex h-14 lg:h-16 items-center gap-3 lg:gap-4">
            {/* دکمه منو (موبایل) */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
              aria-expanded={isMobileMenuOpen}
              aria-controls={mobileMenuId}
              aria-label={isMobileMenuOpen ? "بستن منو" : "باز کردن منو"}
              className={cn(
                "lg:hidden flex items-center justify-center shrink-0",
                "h-9 w-9 rounded-lg border border-border",
                "text-text-secondary hover:bg-muted",
                "transition-colors"
              )}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <MenuIcon className="h-5 w-5" />
              )}
            </button>

            {/* لوگو */}
            <Link
              href="/"
              className="shrink-0 hover:opacity-80 transition-opacity"
              aria-label="صفحه اصلی"
            >
              <div className="lg:hidden">
                <Logo size="sm" />
              </div>
              <div className="hidden lg:block">
                <Logo size="md" />
              </div>
            </Link>

            {/* Mega Menu (دسکتاپ) */}
            <div className="hidden lg:block shrink-0">
              <MegaMenu />
            </div>

            {/* SearchBar (دسکتاپ) */}
            <div className="hidden lg:flex flex-1 max-w-2xl">
              <SearchBar />
            </div>

            {/* آیکون‌ها */}
            <div className="flex items-center gap-1 ms-auto">
              {showDarkMode && <ThemeToggle />}

              {showWishlist && (
                <Link
                  href="/account/wishlist"
                  aria-label="علاقه‌مندی‌ها"
                  className={cn(
                    "hidden sm:flex items-center justify-center",
                    "h-10 w-10 rounded-lg",
                    "text-text-secondary hover:bg-muted hover:text-destructive",
                    "transition-colors"
                  )}
                >
                  <Heart className="h-5 w-5" />
                </Link>
              )}

              <Link
                href={accountHref}
                aria-label={
                  isAuthenticated ? `حساب ${accountLabel}` : "ورود به حساب"
                }
                className={cn(
                  "hidden lg:flex items-center justify-center",
                  "h-10 w-10 rounded-lg border border-border",
                  "text-text-secondary hover:bg-muted",
                  "transition-colors"
                )}
              >
                <User className="h-5 w-5" />
              </Link>

              <Link
                href="/cart"
                aria-label={
                  itemCount > 0
                    ? `سبد خرید، ${toPersianDigits(itemCount)} کالا`
                    : "سبد خرید خالی"
                }
                className={cn(
                  "hidden lg:flex relative items-center justify-center",
                  "h-10 w-10 rounded-lg",
                  "bg-brand-600 text-white hover:bg-brand-700",
                  "transition-colors"
                )}
              >
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <Badge
                    variant="destructive"
                    size="sm"
                    className="absolute -top-1.5 -right-1.5 fa-num min-w-[1.25rem] justify-center"
                    aria-hidden="true"
                  >
                    {toPersianDigits(itemCount)}
                  </Badge>
                )}
              </Link>

              {showRepair && (
                <Link
                  href="/repair"
                  className={cn(
                    "hidden lg:flex items-center gap-2",
                    "h-10 px-4 rounded-lg",
                    "bg-brand-600 text-white hover:bg-brand-700",
                    "transition-all font-bold text-sm shadow-sm",
                    "whitespace-nowrap"
                  )}
                  aria-label="درخواست تعمیر"
                >
                  <Wrench className="h-4 w-4" />
                  <span>درخواست تعمیر</span>
                </Link>
              )}
            </div>
          </div>

          {/* SearchBar (موبایل) */}
          <div className="lg:hidden pb-3">
            <SearchBar variant="compact" />
          </div>
        </Container>
      </header>

      <MobileMenu
        id={mobileMenuId}
        items={mobileNavItems}
        open={isMobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
    </>
  );
}