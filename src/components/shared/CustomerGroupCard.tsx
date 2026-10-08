import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/utils/cn";

export interface CustomerGroupCardProps {
  icon: ReactNode;
  title: string;
  /** Optional extra classes for the wrapping Card. Additive only —
   * omitting it keeps every existing call site unchanged. */
  className?: string;
}

/**
 * CustomerGroupCard
 * One responsibility: display one customer-segment label with an icon.
 * Purely presentational — no link, no logic, no data of its own.
 */
export function CustomerGroupCard({ icon, title, className = "" }: CustomerGroupCardProps) {
  return (
    <Card className={cn("flex flex-col items-center gap-xs text-center", className)}>
      <div aria-hidden="true" className="text-text-primary [&>svg]:h-6 [&>svg]:w-6">
        {icon}
      </div>
      <h3 className="text-body font-medium text-text-primary">{title}</h3>
    </Card>
  );
}
