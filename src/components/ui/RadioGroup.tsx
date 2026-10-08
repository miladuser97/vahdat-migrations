import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/utils/cn";

export interface RadioGroupProps extends HTMLAttributes<HTMLFieldSetElement> {
  legend?: string;
  children: ReactNode;
}

/**
 * RadioGroup
 * A `<fieldset>`/`<legend>` wrapper for a set of RadioOption children —
 * this gives screen readers the group relationship for free, instead
 * of a styled `<div>` pretending to be one. Resets the browser's
 * default fieldset border/padding to match this project's tokens.
 */
export function RadioGroup({ legend, className = "", children, ...props }: RadioGroupProps) {
  return (
    <fieldset className={cn("m-0 flex flex-col gap-xs border-0 p-0", className)} {...props}>
      {legend && (
        <legend className="mb-xs p-0 text-body-sm font-medium text-text-primary">
          {legend}
        </legend>
      )}
      {children}
    </fieldset>
  );
}
