import type { LabelHTMLAttributes } from "react";
import { cn } from "@/utils/cn";

export type LabelProps = LabelHTMLAttributes<HTMLLabelElement>;

/**
 * Label
 * One responsibility: an accessible label for a form field. Pass
 * `htmlFor` matching the field's `id` to associate them — works the
 * same way with Input, Textarea, and Select.
 */
export function Label({ className = "", ...props }: LabelProps) {
  return (
    <label
      className={cn("text-body-sm font-medium text-text-primary", className)}
      {...props}
    />
  );
}
