export interface FAQItemProps {
  question: string;
  answer: string;
}

/**
 * FAQItem
 * A single collapsible question/answer, built from native
 * `<details>`/`<summary>` — keyboard-operable (Enter/Space) and
 * announced correctly by screen readers (expanded/collapsed state)
 * with zero JavaScript. This stays a Server Component; a custom
 * useState-based accordion would need "use client" and would only
 * reimplement what the browser already does correctly.
 */
export function FAQItem({ question, answer }: FAQItemProps) {
  return (
    <details className="group rounded-md border border-border bg-surface p-md open:bg-background">
      <summary
        className={[
          "flex cursor-pointer list-none items-center justify-between gap-sm",
          "text-body font-medium text-text-primary marker:content-none",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        ].join(" ")}
      >
        {question}
        <span
          aria-hidden="true"
          className="shrink-0 text-text-secondary transition-transform duration-base group-open:rotate-180"
        >
          ▾
        </span>
      </summary>
      <p className="mt-sm text-body-sm text-text-secondary">{answer}</p>
    </details>
  );
}
