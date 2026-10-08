import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { cn } from "@/utils/cn";

// ============================================================
// ✅ رنگ‌های پاستیلی برای هر دسته
// ============================================================
const PASTEL_COLORS = [
  "bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-950/50",
  "bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-950/50",
  "bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-950/50",
  "bg-purple-50 dark:bg-purple-950/30 hover:bg-purple-100 dark:hover:bg-purple-950/50",
  "bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-950/50",
  "bg-cyan-50 dark:bg-cyan-950/30 hover:bg-cyan-100 dark:hover:bg-cyan-950/50",
];

export interface CategoryShortcutProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  href: string;
  className?: string;
}

/**
 * CategoryShortcut
 * نمایش یک دسته‌بندی با آیکون و عنوان
 * 
 * ✅ اصلاح شده: رنگ‌های پاستیلی، آیکون بزرگ‌تر، افکت هاور
 */
export function CategoryShortcut({
  icon,
  title,
  description,
  href,
  className = "",
}: CategoryShortcutProps) {
  // انتخاب رنگ بر اساس index (با هش)
  const colorIndex = title.length % PASTEL_COLORS.length;
  const colorClass = PASTEL_COLORS[colorIndex] || PASTEL_COLORS[0];

  return (
    <Link href={href} className="block">
      <Card
        className={cn(
          "flex flex-col items-center gap-2 p-4 text-center transition-all duration-300",
          "border border-transparent hover:border-primary/20",
          colorClass,
          "hover:shadow-lg hover:-translate-y-1",
          className
        )}
      >
        {/* ============================================================ */}
        {/* ✅ آیکون بزرگ‌تر با رنگ برند */}
        {/* ============================================================ */}
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
          <span className="text-3xl">{icon}</span>
        </div>

        <h3 className="text-body font-semibold text-text-primary mt-1">
          {title}
        </h3>

        {description && (
          <p className="text-caption text-text-secondary line-clamp-2">
            {description}
          </p>
        )}
      </Card>
    </Link>
  );
}