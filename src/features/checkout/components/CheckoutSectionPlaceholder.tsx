import { Card } from "@/components/ui/Card";
import { CHECKOUT_SECTION_NOT_READY_MESSAGE } from "@/constants/messages";

export interface CheckoutSectionPlaceholderProps {
  title: string;
}

/**
 * CheckoutSectionPlaceholder
 * One responsibility: an honest "this section isn't built yet" card
 * for a checkout section (customer information, shipping, payment).
 * No form, no inputs — matching this phase's "structure only, no
 * forms/validation" constraint. Used three times in CheckoutView,
 * which is what justifies a shared component instead of repeating the
 * same title+message Card three times.
 */
export function CheckoutSectionPlaceholder({ title }: CheckoutSectionPlaceholderProps) {
  return (
    <Card className="flex flex-col gap-xs">
      <h2 className="text-h4 font-semibold text-text-primary">{title}</h2>
      <p className="text-body-sm text-text-secondary">{CHECKOUT_SECTION_NOT_READY_MESSAGE}</p>
    </Card>
  );
}
