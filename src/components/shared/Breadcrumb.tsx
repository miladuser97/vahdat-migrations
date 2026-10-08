import type { HTMLAttributes } from "react";
import Link from "next/link";
import { ChevronLeft, Home } from "lucide-react";
import { cn } from "@/utils/cn";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps extends HTMLAttributes<HTMLElement> {
  items: BreadcrumbItem[];
  /** آیا صفحه‌ی اصلی (خانه) به عنوان اولین آیتم اضافه بشه؟ */
  showHome?: boolean;
}

/**
 * Breadcrumb
 * نمایش مسیر ناوبری. از next/link استفاده می‌کنه (بدون رفرش صفحه).
 */
export function Breadcrumb({
  items,
  showHome = true,
  className = "",
  ...props
}: BreadcrumbProps) {
  // اگه showHome = true و اولین آیتم خانه نیست، اضافه کن
  const allItems: BreadcrumbItem[] =
    showHome && items[0]?.href !== "/"
      ? [{ label: "خانه", href: "/" }, ...items]
      : items;

  return (
    <nav
      aria-label="مسیر دسترسی"
      className={cn("text-body-sm", className)}
      {...props}
    >
      <ol className="flex flex-wrap items-center gap-1.5 text-text-secondary">
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1;
          const isHome = item.href === "/";

          return (
            <li
              key={`${item.label}-${index}`}
              className="flex items-center gap-1.5"
            >
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1",
                    "hover:text-brand-600 transition-colors"
                  )}
                >
                  {isHome && <Home className="h-3.5 w-3.5" />}
                  <span>{item.label}</span>
                </Link>
              ) : (
                <span
                  className={cn(
                    "flex items-center gap-1",
                    isLast && "text-text-primary font-medium"
                  )}
                  aria-current={isLast ? "page" : undefined}
                >
                  {isHome && !isLast && <Home className="h-3.5 w-3.5" />}
                  <span>{item.label}</span>
                </span>
              )}

              {!isLast && (
                <ChevronLeft
                  className="h-3.5 w-3.5 text-text-muted"
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}