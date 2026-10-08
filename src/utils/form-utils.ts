/**
 * Generic, reusable form helpers.
 * No business logic here (e.g. no domain-specific rules) — validation
 * rules live separately in src/utils/validation.ts.
 */

/**
 * Builds a space-separated `aria-describedby` value from any number of
 * possibly-undefined id fragments, or `undefined` if none are present.
 * Written once so every form field wires this up the same way (see
 * components/ui/FormField.tsx).
 */
export function buildDescribedBy(...ids: Array<string | undefined>): string | undefined {
  const joined = ids.filter(Boolean).join(" ");
  return joined.length > 0 ? joined : undefined;
}

/**
 * Clamps a number between an optional min and max. Generic arithmetic,
 * not a business rule about any specific domain (e.g. not "max order
 * quantity for institutional buyers" — that would be business logic).
 */
export function clampNumber(value: number, min?: number, max?: number): number {
  let result = value;
  if (min !== undefined) {
    result = Math.max(min, result);
  }
  if (max !== undefined) {
    result = Math.min(max, result);
  }
  return result;
}
