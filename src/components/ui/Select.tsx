import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "@/utils/cn";
import { fieldBaseStyles, fieldBorderStyles } from "./field-styles";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

/**
 * Select
 * One responsibility: a styled, accessible native <select>.
 *
 * Deliberately not a custom dropdown: the native element already gives
 * correct keyboard control, screen-reader support, and mobile picker
 * behavior on every platform, with zero extra code or dependencies.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ invalid = false, className = "", children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(fieldBaseStyles, "h-10", fieldBorderStyles(invalid), className)}
        {...props}
      >
        {children}
      </select>
    );
  },
);

Select.displayName = "Select";
