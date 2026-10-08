import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

export interface PlaceholderBlockProps {
  title?: string;
  children?: ReactNode;
  className?: string;
}

const DEFAULT_MESSAGE = "این بخش پس از راه‌اندازی کامل فروشگاه تکمیل خواهد شد.";

/**
 * PlaceholderBlock
 * One responsibility: an honest inline note that a section isn't
 * finalized yet. Distinct from `EmptyState` (which is for empty lists/
 * collections, with an icon and optional action) — this is for running
 * content (a paragraph inside a legal page, a timeline, etc.). The
 * dashed border is a deliberate, cheap visual cue that this is
 * draft/placeholder content, not a finished statement.
 */
export function PlaceholderBlock({ title, children, className = "" }: PlaceholderBlockProps) {
  return (
    <div
      className={cn(
        "rounded-md border border-dashed border-border bg-surface p-md",
        className,
      )}
    >
      {title && <p className="text-body-sm font-medium text-text-primary">{title}</p>}
      <p className={cn("text-body-sm text-text-secondary", title && "mt-xs")}>
        {children ?? DEFAULT_MESSAGE}
      </p>
    </div>
  );
}
