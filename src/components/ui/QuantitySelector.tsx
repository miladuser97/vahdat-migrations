import { Button } from "@/components/ui/Button";
import { cn } from "@/utils/cn";

export interface QuantitySelectorProps {
  value: number;
  min?: number;
  max?: number;
  disabled?: boolean;
  onIncrement?: () => void;
  onDecrement?: () => void;
  className?: string;
}

/**
 * QuantitySelector
 * Pure reusable UI: a minus button, a number display, and a plus
 * button. It does not clamp, validate, or store the quantity itself —
 * the caller owns the actual value and provides onIncrement/
 * onDecrement (presentation only, no business logic). Disabling the
 * buttons at the given min/max is a direct, generic UI courtesy, not a
 * business rule (e.g. it knows nothing about stock limits).
 */
export function QuantitySelector({
  value,
  min,
  max,
  disabled = false,
  onIncrement,
  onDecrement,
  className = "",
}: QuantitySelectorProps) {
  const canDecrement = !disabled && (min === undefined || value > min);
  const canIncrement = !disabled && (max === undefined || value < max);

  return (
    <div className={cn("inline-flex items-center gap-xs", className)}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={!canDecrement}
        onClick={onDecrement}
        aria-label="کاهش تعداد"
      >
        −
      </Button>

      <span
        className="w-8 text-center text-body font-medium text-text-primary"
        aria-live="polite"
      >
        {value}
      </span>

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={!canIncrement}
        onClick={onIncrement}
        aria-label="افزایش تعداد"
      >
        +
      </Button>
    </div>
  );
}
