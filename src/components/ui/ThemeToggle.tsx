"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/providers/ThemeProvider";
import { cn } from "@/utils/cn";
import { SunIcon, MoonIcon } from "@/components/ui/icons";

/**
 * ThemeToggle
 * One responsibility: let the user switch between light and dark theme.
 *
 * آیکون:
 * - توی Light Mode → آیکون ماه 🌙 (کلیک = برو به Dark)
 * - توی Dark Mode → آیکون خورشید ☀️ (کلیک = برو به Light)
 */
export function ThemeToggle() {
  const { toggleTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      disabled={!mounted}
      aria-label={isDark ? "تغییر به پوسته‌ی روشن" : "تغییر به پوسته‌ی تاریک"}
      aria-pressed={mounted ? isDark : undefined}
      className={cn(
        "flex h-11 w-11 items-center justify-center rounded-xl border border-border/60",
        "text-text-secondary transition-all duration-200 hover:bg-primary/5 hover:border-primary/30",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-60"
      )}
    >
      {isDark ? (
        <SunIcon className="h-5 w-5" />
      ) : (
        <MoonIcon className="h-5 w-5" />
      )}
    </button>
  );
}