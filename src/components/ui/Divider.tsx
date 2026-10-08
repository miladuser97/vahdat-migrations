import type { HTMLAttributes } from "react";
import { cn } from "@/utils/cn";

type DividerOrientation = "horizontal" | "vertical";
type DividerSpacing = "none" | "xs" | "sm" | "md" | "lg" | "xl";

export interface DividerProps extends HTMLAttributes<HTMLElement> {
  orientation?: DividerOrientation;
  spacing?: DividerSpacing;
}

const spacingStyles: Record<DividerOrientation, Record<DividerSpacing, string>> = {
  horizontal: {
    none: "",
    xs: "my-xs",
    sm: "my-sm",
    md: "my-md",
    lg: "my-lg",
    xl: "my-xl",
  },
  vertical: {
    none: "",
    xs: "mx-xs",
    sm: "mx-sm",
    md: "mx-md",
    lg: "mx-lg",
    xl: "mx-xl",
  },
};

/**
 * Divider
 * One responsibility: a visual separator line.
 *
 * `orientation="vertical"` renders inside a flex row and needs a parent
 * with a defined height (e.g. `items-stretch`) to be visible — the same
 * requirement a plain vertical border would have in that context.
 */
export function Divider({
  orientation = "horizontal",
  spacing = "md",
  className = "",
  ...props
}: DividerProps) {
  if (orientation === "vertical") {
    return (
      <div
        role="separator"
        aria-orientation="vertical"
        className={cn(
          "w-px self-stretch bg-border",
          spacingStyles.vertical[spacing],
          className,
        )}
        {...props}
      />
    );
  }

  return (
    <hr
      className={cn(
        "h-px w-full border-0 bg-border",
        spacingStyles.horizontal[spacing],
        className,
      )}
      {...props}
    />
  );
}
