"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { cn } from "@/utils/cn";

interface SortOption {
  value: string;
  label: string;
}

interface SortDropdownProps {
  options: SortOption[];
  currentValue: string;
  baseUrl?: string;
  queryParams?: Record<string, string | undefined>;
  className?: string;
}

export function SortDropdown({
  options,
  currentValue,
  baseUrl = "/search",
  queryParams = {},
  className,
}: SortDropdownProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLabel = options.find(o => o.value === currentValue)?.label || "مرتب‌سازی";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (value: string) => {
    const params = new URLSearchParams();
    Object.entries(queryParams).forEach(([key, val]) => {
      if (val && key !== "sort") {
        params.set(key, val);
      }
    });
    if (value !== "price_asc") {
      params.set("sort", value);
    }
    router.push(`${baseUrl}?${params.toString()}`);
    setIsOpen(false);
  };

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full border border-border/50 px-4 py-1.5 text-sm transition-all duration-200 hover:border-primary/30 hover:bg-primary/5"
      >
        <span>📊 {currentLabel}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={cn(
            "h-4 w-4 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <Card className="absolute left-0 top-full z-20 mt-1 w-48 overflow-hidden p-1 shadow-xl">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className={cn(
                "w-full rounded-lg px-3 py-2 text-right text-sm transition-all duration-200",
                currentValue === option.value
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-muted"
              )}
            >
              {option.label}
            </button>
          ))}
        </Card>
      )}
    </div>
  );
}