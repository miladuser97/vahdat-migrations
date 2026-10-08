import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/utils/cn";

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  invalid?: boolean;
}

/**
 * Checkbox
 * A styled native checkbox — keyboard and screen-reader behavior come
 * from the browser for free. Has no built-in label (same convention as
 * Input/Select/Textarea): pair it with `Label` or `FormField` for the
 * visible text.
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ invalid = false, className = "", ...props }, ref) => {
    return (
      <input
        ref={ref}
        type="checkbox"
        aria-invalid={invalid || undefined}
        className={cn(
          "h-5 w-5 shrink-0 rounded border bg-surface text-primary accent-primary",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          invalid ? "border-error" : "border-border",
          className,
        )}
        {...props}
      />
    );
  },
);

Checkbox.displayName = "Checkbox";
