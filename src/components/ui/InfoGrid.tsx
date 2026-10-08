import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/utils/cn";

type InfoGridColumns = 2 | 3 | 4;

export interface InfoGridProps extends HTMLAttributes<HTMLDivElement> {
  columns?: InfoGridColumns;
  children: ReactNode;
}

const COLUMN_STYLES: Record<InfoGridColumns, string> = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-2 lg:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
};

/**
 * InfoGrid
 * One responsibility: a consistent, mobile-first responsive grid (1
 * column on mobile, up to `columns` on larger screens) — the one place
 * this layout is defined, instead of the same literal grid className
 * repeated on every page that needs a card grid.
 */
export function InfoGrid({ columns = 3, className = "", children, ...props }: InfoGridProps) {
  return (
    <div className={cn("grid gap-md", COLUMN_STYLES[columns], className)} {...props}>
      {children}
    </div>
  );
}
