import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/utils/cn";

type FormGroupLayout = "vertical" | "horizontal" | "responsive";

export interface FormGroupProps extends HTMLAttributes<HTMLDivElement> {
  layout?: FormGroupLayout;
  children: ReactNode;
}

const LAYOUT_STYLES: Record<FormGroupLayout, string> = {
  vertical: "flex flex-col gap-md",
  horizontal: "flex flex-row flex-wrap gap-md",
  responsive: "flex flex-col gap-md sm:flex-row sm:flex-wrap",
};

/**
 * FormGroup
 * One responsibility: lay out a set of fields together — vertical,
 * horizontal, or responsive (column on mobile, row from `sm` up).
 * Controls direction and spacing only; each child sizes itself.
 */
export function FormGroup({
  layout = "vertical",
  className = "",
  children,
  ...props
}: FormGroupProps) {
  return (
    <div className={cn(LAYOUT_STYLES[layout], className)} {...props}>
      {children}
    </div>
  );
}
