"use client";

import * as React from "react";

type Theme = "light" | "dark" | "system";

type ThemeProviderProps = {
  children: React.ReactNode;
  attribute?: "class" | "data-theme";
  defaultTheme?: Theme;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
};

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  resolvedTheme: "light" | "dark";
};

const ThemeContext = React.createContext<ThemeContextValue | undefined>(
  undefined
);

const STORAGE_KEY = "vahdat-theme";

export function ThemeProvider({
  children,
  attribute = "class",
  defaultTheme = "light",
  enableSystem = false,
  disableTransitionOnChange = false,
}: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = React.useState<"light" | "dark">(
    "light"
  );

  // ✅ خواندن تم از localStorage — اگه نبود، همیشه "light"
  React.useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;

    if (stored && (stored === "light" || stored === "dark")) {
      setThemeState(stored);
    } else if (stored === "system" && enableSystem) {
      setThemeState("system");
    } else {
      // ✅ پیش‌فرض همیشه light
      setThemeState("light");
    }
  }, [enableSystem]);

  // ✅ اعمال تم روی html
  React.useEffect(() => {
    const root = document.documentElement;

    const applyTheme = (newTheme: "light" | "dark") => {
      if (disableTransitionOnChange) {
        root.style.transition = "none";
      }

      if (attribute === "class") {
        root.classList.remove("light", "dark");
        root.classList.add(newTheme);
      } else {
        root.setAttribute(attribute, newTheme);
      }

      setResolvedTheme(newTheme);

      if (disableTransitionOnChange) {
        requestAnimationFrame(() => {
          root.style.transition = "";
        });
      }
    };

    if (theme === "system" && enableSystem) {
      const media = window.matchMedia("(prefers-color-scheme: dark)");
      applyTheme(media.matches ? "dark" : "light");

      const listener = (e: MediaQueryListEvent) => {
        applyTheme(e.matches ? "dark" : "light");
      };
      media.addEventListener("change", listener);
      return () => media.removeEventListener("change", listener);
    }

    applyTheme(theme === "dark" ? "dark" : "light");
  }, [theme, attribute, enableSystem, disableTransitionOnChange]);

  const setTheme = React.useCallback((newTheme: Theme) => {
    localStorage.setItem(STORAGE_KEY, newTheme);
    setThemeState(newTheme);
  }, []);

  const toggleTheme = React.useCallback(() => {
    const next: Theme = resolvedTheme === "dark" ? "light" : "dark";
    localStorage.setItem(STORAGE_KEY, next);
    setThemeState(next);
  }, [resolvedTheme]);

  const value = React.useMemo(
    () => ({ theme, setTheme, toggleTheme, resolvedTheme }),
    [theme, setTheme, toggleTheme, resolvedTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

// ============================================================
// Hook برای استفاده در کامپوننت‌ها
// ============================================================
export function useTheme() {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}