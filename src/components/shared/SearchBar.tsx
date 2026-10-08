"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Search, X, Loader2, TrendingUp } from "lucide-react";
import { cn } from "@/utils/cn";
import { toPersianDigits } from "@/utils/text-utils";

interface Suggestion {
  id: string;
  slug: string;
  title: string;
  price?: number;
  image?: string;
  category?: string;
}

interface SearchBarProps {
  placeholder?: string;
  className?: string;
  variant?: "default" | "compact";
  showSuggestions?: boolean;
  defaultValue?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear?: () => void;
  onSearch?: (term: string) => void;
  loading?: boolean;
}

export function SearchBar({
  placeholder = "جستجوی محصولات، برند یا دسته‌بندی...",
  className,
  variant = "default",
  showSuggestions = true,
  defaultValue = "",
  value: controlledValue,
  onChange: controlledOnChange,
  onClear: controlledOnClear,
  onSearch: controlledOnSearch,
  loading: controlledLoading,
}: SearchBarProps) {
  const router = useRouter();

  const isControlled = controlledValue !== undefined;

  const [internalQuery, setInternalQuery] = useState(defaultValue);
  const query = isControlled ? controlledValue : internalQuery;

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!isControlled) {
      setInternalQuery(defaultValue);
    }
  }, [defaultValue, isControlled]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isControlled) return;
    if (query.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    if (!showSuggestions) return;

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/search/suggestions?q=${encodeURIComponent(query)}`,
          { signal: abortRef.current?.signal }
        );

        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.suggestions ?? []);
          setIsOpen(true);
        }
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          if (process.env.NODE_ENV === "development") {
            console.error("Search error:", error);
          }
        }
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, showSuggestions, isControlled]);

  const isLoadingCombined = controlledLoading ?? isLoading;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (isControlled) {
        controlledOnChange?.(e);
      } else {
        setInternalQuery(e.target.value);
      }
    },
    [isControlled, controlledOnChange]
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = query.trim();

      if (isControlled) {
        controlledOnSearch?.(trimmed);
      } else {
        if (trimmed.length > 0) {
          router.push(`/search?q=${encodeURIComponent(trimmed)}`);
          setIsOpen(false);
          inputRef.current?.blur();
        }
      }
    },
    [query, router, isControlled, controlledOnSearch]
  );

  const handleSelectSuggestion = useCallback(
    (suggestion: Suggestion) => {
      router.push(`/products/${suggestion.slug}`);
      setIsOpen(false);
      if (!isControlled) {
        setInternalQuery("");
      }
    },
    [router, isControlled]
  );

  const handleClear = useCallback(() => {
    if (isControlled) {
      controlledOnClear?.();
    } else {
      setInternalQuery("");
    }
    setSuggestions([]);
    setIsOpen(false);
    inputRef.current?.focus();
  }, [isControlled, controlledOnClear]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!isOpen || suggestions.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
      } else if (e.key === "Enter" && selectedIndex >= 0) {
        e.preventDefault();
        const selected = suggestions[selectedIndex];
        if (selected) {
          handleSelectSuggestion(selected);
        }
      } else if (e.key === "Escape") {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    },
    [isOpen, suggestions, selectedIndex, handleSelectSuggestion]
  );

  const formatPrice = (price: number) => {
    return toPersianDigits(price.toLocaleString("en-US"));
  };

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <form onSubmit={handleSubmit} role="search" className="relative">
        {/* آیکون جستجو */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
          <Search className="h-5 w-5" />
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={handleChange}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label="جستجو"
          aria-autocomplete="list"
          autoComplete="off"
          className={cn(
            "w-full rounded-lg border border-border bg-background",
            "pr-11 pl-11 text-text-primary placeholder:text-text-muted",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:border-transparent",
            "transition-all",
            variant === "default" ? "h-11 text-sm" : "h-9 text-xs"
          )}
        />

        {/* دکمه پاک کردن */}
        {query && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="پاک کردن"
            className="absolute left-11 top-1/2 -translate-y-1/2 text-text-muted hover:text-destructive transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* دکمه جستجو */}
        <button
          type="submit"
          aria-label="جستجو"
          disabled={isLoadingCombined || query.trim().length === 0}
          className={cn(
            "absolute left-1.5 top-1/2 -translate-y-1/2",
            "flex items-center justify-center",
            "rounded-md bg-brand-600 text-white",
            "hover:bg-brand-700 transition-colors",
            "disabled:opacity-40 disabled:cursor-not-allowed",
            variant === "default" ? "h-8 w-8" : "h-6 w-6"
          )}
        >
          {isLoadingCombined ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </button>
      </form>

      {/* پیشنهادها (فقط در حالت کنترل‌نشده) */}
      {!isControlled && isOpen && suggestions.length > 0 && (
        <div
          role="listbox"
          className={cn(
            "absolute top-full left-0 right-0 z-50 mt-2",
            "rounded-lg border border-border bg-card shadow-xl",
            "overflow-hidden",
            "animate-fade-in"
          )}
        >
          <div className="max-h-96 overflow-y-auto">
            {suggestions.map((suggestion, index) => {
              const isSelected = index === selectedIndex;

              return (
                <button
                  key={suggestion.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelectSuggestion(suggestion)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={cn(
                    "w-full text-right px-3 py-2.5",
                    "flex items-center gap-3",
                    "transition-colors",
                    // ✅ رنگ‌های صریح برای Light و Dark
                    isSelected
                      ? "bg-brand-50 dark:bg-brand-900/40"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800"
                  )}
                >
                  {/* تصویر */}
                  {suggestion.image && (
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-gray-100 dark:bg-gray-800">
                      <Image
                        src={suggestion.image}
                        alt={suggestion.title}
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    {/* ✅ متن صریح — همیشه قابل خونده */}
                    <p className="text-sm font-medium truncate text-gray-900 dark:text-gray-100">
                      {suggestion.title}
                    </p>
                    {suggestion.category && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {suggestion.category}
                      </p>
                    )}
                  </div>

                  {suggestion.price !== undefined && (
                    <div className="text-xs font-bold text-brand-600 dark:text-brand-400 whitespace-nowrap">
                      {formatPrice(suggestion.price)} تومان
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => {
              router.push(`/search?q=${encodeURIComponent(query)}`);
              setIsOpen(false);
            }}
            className={cn(
              "w-full px-4 py-3",
              "flex items-center justify-center gap-2",
              "border-t border-border bg-muted",
              "text-sm font-medium text-brand-600 hover:bg-muted/80",
              "transition-colors"
            )}
          >
            <TrendingUp className="h-4 w-4" />
            مشاهده همه نتایج برای «{query}»
          </button>
        </div>
      )}
    </div>
  );
}