"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/utils/cn";

interface PriceRangeSliderProps {
  min: number;
  max: number;
  currentMin?: number;
  currentMax?: number;
  baseUrl?: string;
  queryParams?: Record<string, string | undefined>;
  className?: string;
}

export function PriceRangeSlider({
  min,
  max,
  currentMin,
  currentMax,
  baseUrl = "/search",
  queryParams = {},
  className,
}: PriceRangeSliderProps) {
  const router = useRouter();
  const [localMin, setLocalMin] = useState(currentMin || min);
  const [localMax, setLocalMax] = useState(currentMax || max);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatPrice = (value: number) => {
    return value.toLocaleString("fa-IR") + " تومان";
  };

  const handleApply = () => {
    const params = new URLSearchParams();
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value && key !== "minPrice" && key !== "maxPrice") {
        params.set(key, value);
      }
    });
    if (localMin > min) params.set("minPrice", localMin.toString());
    if (localMax < max) params.set("maxPrice", localMax.toString());
    router.push(`${baseUrl}?${params.toString()}`);
    setIsOpen(false);
  };

  const handleReset = () => {
    setLocalMin(min);
    setLocalMax(max);
    const params = new URLSearchParams();
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value && key !== "minPrice" && key !== "maxPrice") {
        params.set(key, value);
      }
    });
    router.push(`${baseUrl}?${params.toString()}`);
    setIsOpen(false);
  };

  const isActive = currentMin !== undefined || currentMax !== undefined;

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm transition-all duration-200",
          isActive
            ? "border-primary/50 bg-primary/10 text-primary"
            : "border-border/50 hover:border-primary/30 hover:bg-primary/5"
        )}
      >
        <span>💰 قیمت</span>
        {isActive && (
          <span className="rounded-full bg-primary/20 px-1.5 text-xs text-primary">
            ✓
          </span>
        )}
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
        <Card className="absolute left-0 top-full z-20 mt-1 w-72 p-4 shadow-xl">
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">حداقل</span>
              <span className="font-medium text-text-primary">{formatPrice(localMin)}</span>
            </div>
            
            <input
              type="range"
              min={min}
              max={max}
              value={localMin}
              onChange={(e) => setLocalMin(Number(e.target.value))}
              className="w-full accent-primary"
              step={100000}
            />

            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">حداکثر</span>
              <span className="font-medium text-text-primary">{formatPrice(localMax)}</span>
            </div>
            
            <input
              type="range"
              min={min}
              max={max}
              value={localMax}
              onChange={(e) => setLocalMax(Number(e.target.value))}
              className="w-full accent-primary"
              step={100000}
            />

            <div className="flex gap-2 pt-2">
              <Button size="sm" className="flex-1" onClick={handleApply}>
                اعمال
              </Button>
              <Button size="sm" variant="outline" className="flex-1" onClick={handleReset}>
                بازنشانی
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}