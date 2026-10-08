"use client";

import { useState } from "react";
import { cn } from "@/utils/cn";

interface StarRatingProps {
  value: number;
  onChange: (rating: number) => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
}

export function StarRating({ value, onChange, disabled = false, size = "md" }: StarRatingProps) {
  const [hover, setHover] = useState(0);

  const sizeClasses = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-3xl",
  };

  const handleClick = (rating: number) => {
    if (disabled) return;
    onChange(rating);
  };

  const handleMouseEnter = (rating: number) => {
    if (disabled) return;
    setHover(rating);
  };

  const handleMouseLeave = () => {
    if (disabled) return;
    setHover(0);
  };

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => handleClick(star)}
          onMouseEnter={() => handleMouseEnter(star)}
          onMouseLeave={handleMouseLeave}
          disabled={disabled}
          className={cn(
            "transition-colors duration-200 focus:outline-none",
            disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer hover:scale-110",
            star <= (hover || value)
              ? "text-yellow-500"
              : "text-muted"
          )}
          aria-label={`${star} ستاره`}
        >
          <span className={sizeClasses[size]}>★</span>
        </button>
      ))}
      <span className="mr-2 text-sm text-text-secondary">
        {value > 0 ? `${value} از ۵` : "امتیاز دهید"}
      </span>
    </div>
  );
}