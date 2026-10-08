import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

export interface PageHeroProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

/**
 * PageHero
 * One responsibility: a large, centered, top-of-page hero — title +
 * description + optional actions — for marketing-style pages (Home,
 * About, Business).
 *
 * Distinct from `PageHeader`: a page has one or the other, never both.
 * `PageHeader` is a compact, right-aligned utility-page header
 * (Contact, Products, Categories); `PageHero` is the larger, centered
 * treatment for pages meant to persuade rather than just orient.
 */
export function PageHero({ title, description, actions, className = "" }: PageHeroProps) {
  return (
    <div className={cn("flex flex-col items-center gap-6 py-section text-center", className)}>
      <h1 className="text-display font-bold text-text-primary">{title}</h1>
      {description && (
        <p className="max-w-md text-body-lg text-text-secondary">{description}</p>
      )}
      {actions && (
        <div className="flex flex-wrap items-center justify-center gap-sm">{actions}</div>
      )}
    </div>
  );
}
