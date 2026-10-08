import type { HTMLAttributes } from "react";
import { cn } from "@/utils/cn";

export type HelperTextProps = HTMLAttributes<HTMLParagraphElement>;

/**
 * HelperText
 * One responsibility: small supporting text under a form field.
 */
export function HelperText({ className = "", ...props }: HelperTextProps) {
  return <p className={cn("text-body-sm text-text-secondary", className)} {...props} />;
}
