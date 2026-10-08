import type { ReactNode } from "react";

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

/**
 * EmptyState
 * One responsibility: honestly tell the user there is nothing here yet
 * (no products, no categories, no search results), optionally with an
 * icon and a next action — instead of a blank area or an ad hoc
 * paragraph repeated in different places.
 */
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-sm rounded-md border border-border bg-surface p-lg text-center">
      {icon && (
        <div aria-hidden="true" className="text-text-secondary [&>svg]:h-8 [&>svg]:w-8">
          {icon}
        </div>
      )}
      <p className="text-body font-medium text-text-primary">{title}</p>
      {description && (
        <p className="max-w-sm text-body-sm text-text-secondary">{description}</p>
      )}
      {action && <div className="mt-xs">{action}</div>}
    </div>
  );
}
