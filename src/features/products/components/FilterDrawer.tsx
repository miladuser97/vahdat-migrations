"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ProductFilters } from "./ProductFilters";

export interface FilterDrawerProps {
  activeCount?: number;
  customFilters?: ReactNode;
}

/**
 * FilterDrawer
 * Mobile-only trigger + panel for ProductFilters. A plain disclosure,
 * not a modal — no backdrop, no focus trap, no animation library — the
 * same pattern already established by Header's MobileMenu. Escape
 * closes it.
 *
 * Necessarily a Client Component: open/closed is real interactive
 * state with no native HTML equivalent here (unlike FAQItem's native
 * `<details>`).
 */
export function FilterDrawer({ activeCount, customFilters }: FilterDrawerProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <div className="lg:hidden">
      <Button
        type="button"
        variant="outline"
        size="md"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((current) => !current)}
        className="inline-flex items-center gap-xs"
      >
        فیلترها
        {!!activeCount && (
          <Badge variant="info" size="sm">
            {activeCount.toLocaleString("fa-IR")}
          </Badge>
        )}
      </Button>

      {open && (
        <div id={panelId} className="mt-sm rounded-md border border-border bg-surface p-md">
          {customFilters || <ProductFilters />}
        </div>
      )}
    </div>
  );
}
