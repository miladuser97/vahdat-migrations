import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/utils/cn";

export interface RadioOptionProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
}

/**
 * RadioOption
 * A single labeled radio button, used inside a RadioGroup. Give every
 * RadioOption in a group the same `name` — native browser behavior then
 * handles mutual exclusivity and arrow-key navigation between them.
 *
 * The input is wrapped inside its own `<label>` (implicit association)
 * rather than paired via separate `htmlFor`/`id` — fewer moving parts,
 * and clicking the label text still toggles the control.
 */
export const RadioOption = forwardRef<HTMLInputElement, RadioOptionProps>(
  ({ label, className = "", ...props }, ref) => {
    return (
      <label className="flex items-center gap-xs text-body text-text-primary">
        <input
          ref={ref}
          type="radio"
          className={cn(
            "h-5 w-5 shrink-0 border border-border bg-surface text-primary accent-primary",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
          {...props}
        />
        {label}
      </label>
    );
  },
);

RadioOption.displayName = "RadioOption";
