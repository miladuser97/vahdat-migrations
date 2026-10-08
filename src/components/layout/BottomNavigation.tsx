"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Grid3x3, ShoppingCart, Wrench, User } from "lucide-react";
import { useCart } from "@/features/cart/CartProvider";
import { useAuth } from "@/features/account/AuthContext";
import { cn } from "@/utils/cn";
import { toPersianDigits } from "@/utils/text-utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  matchPaths?: string[];
}

export function BottomNavigation() {
  const pathname = usePathname();
  const { items } = useCart();
  const { user, status } = useAuth();

  const itemCount = items.reduce((total, item) => total + item.quantity, 0);

  const isAuthenticated = status === "authenticated" && Boolean(user);
  const accountHref = isAuthenticated ? "/account" : "/login";

  const navItems: NavItem[] = [
    {
      label: "خانه",
      href: "/",
      icon: <Home className="h-5 w-5" />,
      matchPaths: ["/"],
    },
    {
      label: "دسته‌بندی",
      href: "/categories",
      icon: <Grid3x3 className="h-5 w-5" />,
      matchPaths: ["/categories", "/products"],
    },
    {
      label: "سبد خرید",
      href: "/cart",
      icon: <ShoppingCart className="h-5 w-5" />,
      matchPaths: ["/cart", "/checkout"],
    },
    {
      label: "تعمیرات",
      href: "/repair",
      icon: <Wrench className="h-5 w-5" />,
      matchPaths: ["/repair"],
    },
    {
      label: isAuthenticated ? "حساب" : "ورود",
      href: accountHref,
      icon: <User className="h-5 w-5" />,
      matchPaths: ["/account", "/login", "/register"],
    },
  ];

  function isActive(item: NavItem): boolean {
    if (!item.matchPaths) return pathname === item.href;
    return item.matchPaths.some((path) => {
      if (path === "/") return pathname === "/";
      return pathname === path || pathname.startsWith(`${path}/`);
    });
  }

  return (
    <nav
      aria-label="ناوبری موبایل"
      className={cn(
        "lg:hidden fixed bottom-0 left-0 right-0 z-40",
        "bg-card/95 backdrop-blur-lg",
        "border-t border-border",
        "safe-area-bottom"
      )}
    >
      <ul className="flex items-stretch justify-around">
        {navItems.map((item) => {
          const active = isActive(item);
          const isCart = item.href === "/cart";
          const showBadge = isCart && itemCount > 0;

          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1",
                  "py-2 px-1",
                  "transition-colors",
                  active
                    ? "text-brand-600 dark:text-brand-400"
                    : "text-text-secondary hover:text-text-primary"
                )}
              >
                {/* آیکون + Badge */}
                <div className="relative">
                  {item.icon}

                  {showBadge && (
                    <span
                      className={cn(
                        "absolute -top-1.5 -right-2",
                        "flex items-center justify-center",
                        "min-w-[1.1rem] h-[1.1rem] px-1",
                        "rounded-full bg-destructive text-white",
                        "text-[10px] font-bold fa-num"
                      )}
                    >
                      {toPersianDigits(itemCount > 99 ? "99+" : itemCount)}
                    </span>
                  )}
                </div>

                {/* برچسب */}
                <span
                  className={cn(
                    "text-[10px] font-medium leading-none",
                    active && "font-bold"
                  )}
                >
                  {item.label}
                </span>

                {/* نوار فعال (بالای آیتم) */}
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-b-full bg-brand-600 dark:bg-brand-400" />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}