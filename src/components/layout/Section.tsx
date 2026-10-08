import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/utils/cn";

export interface SectionProps extends HTMLAttributes<HTMLElement> {
  title?: string;
  description?: string;
  actions?: ReactNode;
}

/**
 * Section
 * One responsibility: consistent vertical rhythm for a block of a page,
 * with an optional title/description/actions header.
 *
 * Does not apply page-width itself — compose it with `Container` where
 * width control is also needed (they solve different problems).
 */
export function Section({
  title,
  description,
  actions,
  className = "",
  children,
  ...props
}: SectionProps) {
  const hasHeader = Boolean(title || description || actions);

  return (
    <section className={cn("py-lg sm:py-xl", className)} {...props}>
      {hasHeader && (
        <div className="mb-md flex flex-col gap-sm sm:flex-row sm:items-start sm:justify-between">
          <div>
            {title && (
              <h2 className="text-h2 font-semibold text-text-primary">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-xs text-body text-text-secondary">
                {description}
              </p>
            )}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}
