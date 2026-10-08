import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/utils/cn";

export interface PageHeaderProps extends HTMLAttributes<HTMLElement> {
  title: string;
  description?: string;
  actions?: ReactNode;
}

/**
 * PageHeader
 * One responsibility: the top-of-page title block (title + optional
 * description + optional actions), with a bottom border to separate it
 * from the page body.
 *
 * Use `Section` instead for headings that repeat further down a page —
 * PageHeader is for the single, page-level heading only.
 */
export function PageHeader({
  title,
  description,
  actions,
  className = "",
  ...props
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-sm border-b border-border pb-md sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
      {...props}
    >
      <div>
        <h1 className="text-h1 font-bold text-text-primary">{title}</h1>
        {description && (
          <p className="mt-xs text-body-lg text-text-secondary">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </header>
  );
}
