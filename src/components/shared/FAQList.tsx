import { FAQItem } from "@/components/shared/FAQItem";

export interface FAQListItem {
  question: string;
  answer: string;
  category?: string;
}

export interface FAQListProps {
  items: FAQListItem[];
}

/**
 * FAQList
 * Renders a list of FAQItem accordions, optionally grouped under a
 * category heading when items include a `category`.
 *
 * A separate "FAQCategory" component was considered (as suggested) but
 * folded into this component instead: grouping is the only thing it
 * would do, for exactly one consumer (this list) — a dedicated
 * component would be an abstraction with no second use case yet. If a
 * second real consumer appears later, extracting it then costs little
 * and would be based on real, not guessed, requirements.
 */
export function FAQList({ items }: FAQListProps) {
  const categories = Array.from(
    new Set(items.map((item) => item.category).filter((value): value is string => Boolean(value))),
  );
  const uncategorized = items.filter((item) => !item.category);

  if (categories.length === 0) {
    return (
      <div className="flex flex-col gap-sm">
        {items.map((item) => (
          <FAQItem key={item.question} question={item.question} answer={item.answer} />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-lg">
      {categories.map((category) => (
        <div key={category} className="flex flex-col gap-sm">
          <h3 className="text-h4 font-medium text-text-primary">{category}</h3>
          {items
            .filter((item) => item.category === category)
            .map((item) => (
              <FAQItem key={item.question} question={item.question} answer={item.answer} />
            ))}
        </div>
      ))}

      {uncategorized.length > 0 && (
        <div className="flex flex-col gap-sm">
          {uncategorized.map((item) => (
            <FAQItem key={item.question} question={item.question} answer={item.answer} />
          ))}
        </div>
      )}
    </div>
  );
}
