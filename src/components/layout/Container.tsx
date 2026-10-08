import type { ReactNode } from "react";

/**
 * Container
 * Centers content and applies a consistent max-width and horizontal
 * padding across the whole site. This is the single place that controls
 * page-width, so every page stays visually aligned.
 */
export function Container({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-container px-4 sm:px-6 lg:px-8">
      {children}
    </div>
  );
}
