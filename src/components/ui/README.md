# components/ui/

Reserved for the smallest, generic, design-system-level building blocks
(buttons, inputs, labels, cards, icons wrappers, etc.).

## Current contents (Phase 12.5)
- `Button.tsx` — variants: primary, secondary, outline, ghost. Sizes:
  sm, md, lg. Disabled is a native HTML state, usable with any variant.
  Also exports `buttonVariants()`, so a `next/link` that must look like
  a button (e.g. a call-to-action) can share the exact same styles.
- `Card.tsx` — generic surface container (padding, border, radius,
  background). Holds no content of its own.
- `Input.tsx` — single-line field. Supports text/email/password/search
  via the native `type` attribute, plus `invalid` state.
- `Textarea.tsx` — multi-line field, vertical resize only.
- `Select.tsx` — wraps the native `<select>` (no custom dropdown), so
  keyboard/screen-reader/mobile behavior is correct for free.
- `NumberInput.tsx` — wraps the native `<input type="number">`;
  min/max/step/disabled/readOnly all work natively, no custom JS. Not
  yet used on any page — meaningful only once a real numeric-quantity
  context exists (see the Phase 12.5 report).
- `Label.tsx` — accessible label; pair with any field via matching
  `htmlFor`/`id`, or use `FormField` below for the full wiring.
- `HelperText.tsx` — small supporting text under a field.
- `FormMessage.tsx` — status message under a field: error, success,
  warning, or info. Only `error` gets `role="alert"`.
- `FormField.tsx` — wires Label + a field (as a render prop) +
  HelperText + FormMessage together with correct
  `id`/`aria-describedby`/`aria-invalid`. The one place this
  accessibility wiring is written, reused by every future form.
- `FormGroup.tsx` — lays out a set of fields: vertical, horizontal, or
  responsive (column on mobile, row from `sm` up). First real usage:
  the name/email row on the Contact page form (Phase 12.5 cleanup —
  replaced an ad hoc `grid sm:grid-cols-2` that duplicated this).
- `Checkbox.tsx` — styled native checkbox. No built-in label, same
  convention as Input/Select — pair with `Label`/`FormField`. First
  real usage: the Contact page's "I have read the privacy policy /
  terms" consent row (Phase 12.5 cleanup), disabled like the rest of
  that non-functional form.
- `RadioGroup.tsx` / `RadioOption.tsx` — a `<fieldset>`/`<legend>`
  group of labeled radio buttons (RadioOption wraps its own `<label>`).
  Not yet used on any page — no content currently needs a real choice
  between mutually-exclusive options (see the Phase 12.5 report).
- `Switch.tsx` — on/off toggle built with a hidden native checkbox and
  a CSS-only track/thumb (`peer-checked:`) — no JavaScript, no library.
  Not yet used on any page — no on/off setting exists yet to represent
  (see the Phase 12.5 report).
- `QuantitySelector.tsx` — minus button + number display + plus button.
  Presentation only; the caller owns the value and provides
  onIncrement/onDecrement. Not yet used on any page — meaningful only
  once a real per-product quantity context exists (see the Phase 12.5
  report).
- `Badge.tsx` — small status pill. Variants: primary, secondary, success,
  warning, error, info, muted. Sizes: sm, md.
- `Divider.tsx` — horizontal or vertical separator with configurable
  spacing. Not yet used on any page — `border-b`/`border-t` utility
  classes have covered every separator need so far (see the Phase 12.5
  report).
- `ThemeToggle.tsx` — real light/dark theme switch (reads/writes
  `ThemeProvider`).
- `field-styles.ts` — private shared style fragments used only by
  Input/Textarea/Select/NumberInput, so these fields never drift out of
  sync. Not a component; do not import it from outside `components/ui/`.
- `icons.tsx` — a small set of minimal inline SVG icons (no icon
  library): 7 customer-group icons, 6 category icons (Paper, Office
  Supplies, Writing Instruments, School Supplies, Printer Supplies,
  Office Equipment), and 4 contact icons (Phone, Email, Location,
  Clock).
- `Pagination.tsx` — UI-only page-number navigation, truncated with "…"
  for large page counts (Phase 11 — resolved technical debt noted
  since Phase 7). No internal state; the caller supplies a
  `getHref(page)` function, so this stays a Server Component with zero
  client-side logic.
- `InfoGrid.tsx` — canonical responsive grid wrapper (1/2/3/4 columns,
  mobile-first). Replaces the same literal grid className repeated
  across pages with one definition.
- `Tabs.tsx` — a generic, accessible tab set (WAI-ARIA pattern: roving
  tabindex, arrow-key navigation mirrored for RTL). One of the few
  Client Components in the project — no native HTML tabs element
  exists, unlike `FAQItem`'s native `<details>`. Used on the product
  details page (توضیحات/مشخصات فنی); kept generic for future reuse.

