import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/utils/cn";
import { fieldBaseStyles, fieldBorderStyles } from "./field-styles";

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

/**
 * Textarea
 * One responsibility: a styled, accessible multi-line text field.
 * Resizable vertically only (`resize-y`) — horizontal resize would let
 * it break out of the responsive layout it sits in.
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ invalid = false, className = "", rows = 4, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        rows={rows}
        aria-invalid={invalid || undefined}
        className={cn(
          fieldBaseStyles,
          "resize-y py-sm",
          fieldBorderStyles(invalid),
          className,
        )}
        {...props}
      />
    );
  },
);

Textarea.displayName = "Textarea";
