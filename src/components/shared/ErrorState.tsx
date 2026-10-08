import type { ReactNode } from "react";

export interface ErrorStateProps {
  title?: string;
  description?: string;
  action?: ReactNode;
}

/**
 * ErrorState
 * One responsibility: tell the user something went wrong, calmly and
 * honestly, with an optional retry/next-step action. Not wired to any
 * real error source yet — there is no data-fetching in this phase that
 * could actually fail; this exists so future data-fetching code has a
 * consistent, ready-made error UI to render.
 */
export function ErrorState({
  title = "مشکلی پیش آمد",
  description = "لطفاً دوباره تلاش کنید.",
  action,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-sm rounded-md border border-error/30 bg-error/5 p-lg text-center"
    >
      <p className="text-body font-medium text-text-primary">{title}</p>
      <p className="max-w-sm text-body-sm text-text-secondary">{description}</p>
      {action && <div className="mt-xs">{action}</div>}
    </div>
  );
}
