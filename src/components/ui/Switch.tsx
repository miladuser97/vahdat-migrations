import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/utils/cn";

export type SwitchProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

/**
 * Switch
 * An accessible on/off toggle built from a real (visually-hidden)
 * native checkbox plus a track/thumb driven entirely by CSS (Tailwind's
 * `peer` + `peer-checked:` variants) — no JavaScript, no external
 * library. The native checkbox provides keyboard support (Space to
 * toggle, Tab to focus) and is announced as a checkbox to screen
 * readers, the correct underlying role for a two-state switch without
 * a dedicated ARIA switch widget.
 *
 * Simplification note: the thumb's slide direction is not mirrored for
 * RTL (it always slides the same physical way). True mirroring needs a
 * transform reversed specifically for `dir="rtl"`, which isn't visually
 * verifiable without a live build in this environment — shipping an
 * unverified mirror could look worse than a consistent, un-mirrored
 * motion. Revisit if real usage shows this matters.
 */
export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ className = "", ...props }, ref) => {
    return (
      <label
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center has-[:disabled]:cursor-not-allowed",
          className,
        )}
      >
        <input ref={ref} type="checkbox" className="peer sr-only" {...props} />
        <span
          aria-hidden="true"
          className={cn(
            "absolute inset-0 rounded-full bg-muted transition-colors duration-base",
            "peer-checked:bg-primary",
            "peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring",
            "peer-disabled:opacity-50",
          )}
        />
        <span
          aria-hidden="true"
          className="relative inline-block h-4 w-4 translate-x-1 rounded-full bg-surface transition-transform duration-base peer-checked:translate-x-6"
        />
      </label>
    );
  },
);

Switch.displayName = "Switch";
