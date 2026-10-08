import type { HTMLAttributes } from "react";
import { cn } from "@/utils/cn";

type FormMessageVariant = "error" | "success" | "warning" | "info";

export interface FormMessageProps extends HTMLAttributes<HTMLParagraphElement> {
  variant?: FormMessageVariant;
}

const VARIANT_STYLES: Record<FormMessageVariant, string> = {
  error: "text-error",
  success: "text-success",
  warning: "text-warning",
  info: "text-info",
};

/**
 * FormMessage
 * One responsibility: a small status message under a form field
 * (validation error, success confirmation, warning, or info), using
 * the existing semantic color tokens. `role="alert"` only for the
 * error variant — the others are supportive, not urgent, so they don't
 * interrupt screen-reader flow the way an alert does.
 */
export function FormMessage({
  variant = "info",
  className = "",
  ...props
}: FormMessageProps) {
  return (
    <p
      role={variant === "error" ? "alert" : undefined}
      className={cn("text-body-sm font-medium", VARIANT_STYLES[variant], className)}
      {...props}
    />
  );
}
