"use client";

import { useId, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/utils/cn";

export interface TabItem {
  label: string;
  content: ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  className?: string;
}

/**
 * Tabs
 * A generic, accessible tab set (WAI-ARIA Tabs pattern: roving
 * tabindex, arrow-key navigation, aria-selected/aria-controls wiring).
 *
 * This is one of the few components in the project that must be a
 * Client Component: there is no native HTML tabs element (unlike
 * FAQItem's native `<details>`), so the active-tab state and keyboard
 * handling require JavaScript. Kept generic (not product-specific) so
 * it has real reuse potential beyond the product details page.
 *
 * Arrow-key direction is mirrored for this project's permanent RTL
 * layout: ArrowLeft moves to the visually-next tab, ArrowRight to the
 * visually-previous one.
 */
export function Tabs({ items, className = "" }: TabsProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const baseId = useId();

  function focusTab(index: number) {
    setActiveIndex(index);
    document.getElementById(`${baseId}-tab-${index}`)?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      focusTab((index + 1) % items.length);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      focusTab((index - 1 + items.length) % items.length);
    } else if (event.key === "Home") {
      event.preventDefault();
      focusTab(0);
    } else if (event.key === "End") {
      event.preventDefault();
      focusTab(items.length - 1);
    }
  }

  return (
    <div className={cn("flex flex-col gap-md", className)}>
      <div
        role="tablist"
        aria-label="بخش‌های اطلاعات"
        className="flex flex-wrap gap-xs border-b border-border"
      >
        {items.map((item, index) => {
          const selected = index === activeIndex;
          return (
            <button
              key={item.label}
              id={`${baseId}-tab-${index}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${index}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActiveIndex(index)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              className={cn(
                "rounded-t-md px-md py-sm text-body-sm font-medium transition-colors duration-base",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                selected
                  ? "border-b-2 border-primary text-text-primary"
                  : "text-text-secondary hover:text-text-primary",
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {items.map((item, index) => (
        <div
          key={item.label}
          id={`${baseId}-panel-${index}`}
          role="tabpanel"
          aria-labelledby={`${baseId}-tab-${index}`}
          hidden={index !== activeIndex}
        >
          {item.content}
        </div>
      ))}
    </div>
  );
}
