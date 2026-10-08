import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";

export interface ContactCardProps {
  icon: ReactNode;
  label: string;
  value: string;
}

/**
 * ContactCard
 * One responsibility: display one contact method (phone, email,
 * address, hours) with an icon, label, and value. Purely
 * presentational — no link, no logic.
 */
export function ContactCard({ icon, label, value }: ContactCardProps) {
  return (
    <Card className="flex items-start gap-sm">
      <div aria-hidden="true" className="text-text-secondary [&>svg]:h-6 [&>svg]:w-6">
        {icon}
      </div>
      <div>
        <p className="text-body-sm text-text-secondary">{label}</p>
        <p className="text-body font-medium text-text-primary">{value}</p>
      </div>
    </Card>
  );
}
