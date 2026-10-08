import Link from "next/link";
import { cn } from "@/utils/cn";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  getHref: (page: number) => string;
}

const ELLIPSIS = "…" as const;
type PaginationEntry = number | typeof ELLIPSIS;

/**
 * Builds a truncated page range: always shows the first and last page,
 * the current page and its immediate neighbors, and collapses any gap
 * into a single "…". Resolves the technical debt noted since Phase 7
 * (every page number was rendered, which doesn't scale).
 */
function getPaginationRange(currentPage: number, totalPages: number): PaginationEntry[] {
  const delta = 1;
  const range: PaginationEntry[] = [];

  for (let page = 1; page <= totalPages; page += 1) {
    const isEdge = page === 1 || page === totalPages;
    const isNeighbor = page >= currentPage - delta && page <= currentPage + delta;

    if (isEdge || isNeighbor) {
      range.push(page);
    } else if (range[range.length - 1] !== ELLIPSIS) {
      range.push(ELLIPSIS);
    }
  }

  return range;
}

/**
 * Pagination
 * UI only: renders a page-number trail (truncated with "…" for large
 * page counts) and highlights the current page. No internal state, no
 * routing logic of its own — the caller supplies `getHref` to build
 * each page's URL (query param shape, etc. is the caller's decision,
 * kept out of this component on purpose).
 */
export function Pagination({ currentPage, totalPages, getHref }: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const entries = getPaginationRange(currentPage, totalPages);
  const isFirst = currentPage <= 1;
  const isLast = currentPage >= totalPages;

  return (
    <nav aria-label="صفحه‌بندی" className="flex flex-wrap items-center justify-center gap-xs">
      <Link
        href={getHref(Math.max(1, currentPage - 1))}
        aria-disabled={isFirst}
        tabIndex={isFirst ? -1 : undefined}
        className={cn(
          "flex h-9 min-w-9 items-center justify-center rounded-md border border-border px-xs text-body-sm",
          isFirst
            ? "pointer-events-none text-text-secondary opacity-50"
            : "text-text-primary hover:bg-muted",
        )}
      >
        قبلی
      </Link>

      {entries.map((entry, index) =>
        entry === ELLIPSIS ? (
          <span
            key={`ellipsis-${index}`}
            aria-hidden="true"
            className="flex h-9 min-w-9 items-center justify-center text-body-sm text-text-secondary"
          >
            {ELLIPSIS}
          </span>
        ) : (
          <Link
            key={entry}
            href={getHref(entry)}
            aria-current={entry === currentPage ? "page" : undefined}
            className={cn(
              "flex h-9 min-w-9 items-center justify-center rounded-md border px-xs text-body-sm",
              entry === currentPage
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-text-primary hover:bg-muted",
            )}
          >
            {entry}
          </Link>
        ),
      )}

      <Link
        href={getHref(Math.min(totalPages, currentPage + 1))}
        aria-disabled={isLast}
        tabIndex={isLast ? -1 : undefined}
        className={cn(
          "flex h-9 min-w-9 items-center justify-center rounded-md border border-border px-xs text-body-sm",
          isLast
            ? "pointer-events-none text-text-secondary opacity-50"
            : "text-text-primary hover:bg-muted",
        )}
      >
        بعدی
      </Link>
    </nav>
  );
}
