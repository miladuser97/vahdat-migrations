/**
 * Shared style fragments for form-field components (Input, Textarea,
 * Select, NumberInput). Kept private to components/ui/ so these fields
 * never drift out of sync with each other.
 */
 export const fieldBaseStyles =
 "w-full rounded-md border bg-background px-md text-body text-text-primary " +
 "placeholder:text-text-muted transition-colors duration-base " +
 "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 " +
 "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted " +
 "read-only:bg-muted read-only:cursor-default";

export function fieldBorderStyles(invalid?: boolean): string {
 return invalid ? "border-destructive focus-visible:ring-destructive" : "border-border";
}