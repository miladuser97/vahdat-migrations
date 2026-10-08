"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/utils/cn";
import { toPersianDigits } from "@/utils/text-utils";

interface DiscountTimerProps {
  /** تاریخ پایان تخفیف (ISO string) */
  endsAt: string | Date | null | undefined;
  /** حالت نمایش: compact (کارت) یا default (صفحه محصول) */
  variant?: "compact" | "default";
  className?: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

function calculateTimeLeft(endsAt: Date): TimeLeft {
  const diff = endsAt.getTime() - Date.now();

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
  }

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    isExpired: false,
  };
}

export function DiscountTimer({
  endsAt,
  variant = "default",
  className,
}: DiscountTimerProps) {
  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: true,
  });

  // ✅ تبدیل endsAt به Date
  const endDate = endsAt ? new Date(endsAt) : null;
  const isValidDate = endDate && !isNaN(endDate.getTime());

  useEffect(() => {
    setMounted(true);

    if (!isValidDate || !endDate) return;

    // مقدار اولیه
    setTimeLeft(calculateTimeLeft(endDate));

    // آپدیت هر ثانیه
    const interval = setInterval(() => {
      const newTimeLeft = calculateTimeLeft(endDate);
      setTimeLeft(newTimeLeft);

      if (newTimeLeft.isExpired) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [endsAt, isValidDate, endDate]);

  // قبل از mount، هیچی نشون نده (جلوگیری از hydration mismatch)
  if (!mounted) return null;

  // اگه تاریخ نداره یا منقضی شده، هیچی نشون نده
  if (!isValidDate || timeLeft.isExpired) return null;

  // ============================================================
  // حالت Compact (کارت محصول)
  // ============================================================
  if (variant === "compact") {
    // فقط ساعت:دقیقه:ثانیه اگه کمتر از ۱ روز مونده
    const showDays = timeLeft.days > 0;

    return (
      <div
        className={cn(
          "inline-flex items-center gap-1",
          "rounded-md bg-red-500/95 text-white backdrop-blur-sm",
          "px-2 py-0.5 text-[10px] font-medium",
          "shadow-sm fa-num",
          className
        )}
      >
        <Clock className="h-3 w-3" />
        {showDays ? (
          <span>
            {toPersianDigits(timeLeft.days)} روز
          </span>
        ) : (
          <span dir="ltr">
            {toPersianDigits(String(timeLeft.hours).padStart(2, "0"))}:
            {toPersianDigits(String(timeLeft.minutes).padStart(2, "0"))}:
            {toPersianDigits(String(timeLeft.seconds).padStart(2, "0"))}
          </span>
        )}
      </div>
    );
  }

  // ============================================================
  // حالت Default (صفحه محصول)
  // ============================================================
  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-900/50 dark:bg-red-950/30",
        className
      )}
    >
      <div className="flex items-center gap-2 text-sm font-medium text-red-600 dark:text-red-400">
        <Clock className="h-4 w-4" />
        <span>پایان تخفیف تا:</span>
      </div>

      <div className="flex items-center gap-2" dir="ltr">
        <TimeBox value={timeLeft.days} label="روز" />
        <TimeBox value={timeLeft.hours} label="ساعت" />
        <TimeBox value={timeLeft.minutes} label="دقیقه" />
        <TimeBox value={timeLeft.seconds} label="ثانیه" />
      </div>
    </div>
  );
}

// ============================================================
// کامپوننت کمکی: جعبه‌ی زمان
// ============================================================
function TimeBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={cn(
          "flex h-12 w-12 items-center justify-center",
          "rounded-lg bg-red-500 text-white",
          "text-xl font-bold fa-num",
          "shadow-sm"
        )}
      >
        {toPersianDigits(String(value).padStart(2, "0"))}
      </div>
      <span className="text-[10px] text-red-600 dark:text-red-400">{label}</span>
    </div>
  );
}