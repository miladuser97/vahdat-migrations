import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/utils/cn";
import { fieldBaseStyles, fieldBorderStyles } from "./field-styles";

export interface NumberInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  invalid?: boolean;
}

/**
 * NumberInput
 * A styled native `<input type="number">`. min/max/step/disabled/
 * readOnly all work natively via the browser — no custom JS validation
 * (that would be business logic, out of scope here).
 */
export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  ({ invalid = false, className = "", ...props }, ref) => {
    return (
      <input
        ref={ref}
        type="number"
        inputMode="numeric"
        aria-invalid={invalid || undefined}
        className={cn(fieldBaseStyles, "h-10", fieldBorderStyles(invalid), className)}
        {...props}
      />
    );
  },
);

NumberInput.displayName = "NumberInput";
