# Tahririno — Phase 8.2 Report: Zod 4 Type Compatibility & Vercel Build Closure

## A. Exact Root Cause

`src/features/account/validation.ts` typed `fieldErrorsFromZod`'s parameter as `z.SafeParseReturnType<unknown, unknown>`. `SafeParseReturnType` was a Zod-3-era public type alias exported from the top-level `z` namespace. The installed version — confirmed in both `package.json` (`"zod": "^4.4.3"`) and `package-lock.json` (resolved, single entry, `"version": "4.4.3"`) — does not export that name from the namespace this project imports (`import type { z } from "zod"` → Zod 4's classic API surface). This is not a Vercel-specific or environment-specific failure; it is a straightforward Zod 3 → Zod 4 API removal, exactly as the build log states (`Namespace ... has no exported member 'SafeParseReturnType'`).

## B. Exact Files Changed

1. `src/features/account/validation.ts` — the actual fix (see C).
2. `src/config/env.ts` — one `.format()` call replaced with `.issues` (see D).
3. `src/lib/api-client.ts` — same.
4. `src/lib/persistence.ts` — same.

No other file was modified. No dependency version was changed. No validation rule, message, or schema semantics were changed anywhere.

## C. Exact Fix

`fieldErrorsFromZod` no longer accepts a pre-computed parse result typed against a named Zod type alias. It now accepts the **schema** (`schema: z.ZodType`) and the **data**, and calls `schema.safeParse(data)` internally:

```ts
function fieldErrorsFromZod<TKey extends string>(
  schema: z.ZodType,
  data: unknown
): FieldErrors<TKey> {
  const result = schema.safeParse(data);
  if (result.success) return {};
  const errors: FieldErrors<TKey> = {};
  for (const issue of result.error.issues) { ... }
  return errors;
}
```

**Why this is Zod-4-compatible by construction, not by luck:** `result`'s type is never named — it is inferred directly from calling `.safeParse()` on a real, currently-installed Zod schema, the same way any other call site in this codebase (e.g. `auth-actions.ts`'s `LoginSchema.safeParse(credentials)`) already does without incident. This sidesteps the entire category of risk that broke the build: it does not depend on any Zod public type-alias name remaining stable, exported, or spelled the same way across versions. Only `z.ZodType` (the base class every Zod schema — object, string, enum, or a `.pick()`/`.extend()` result — structurally extends) is referenced by name, purely to type the parameter as "some Zod schema" rather than `unknown`; it is not the type the function's logic depends on for narrowing `result.success`/`result.error.issues`, which come from the real method call.

The three call sites were updated to match:
```ts
// before: fieldErrorsFromZod(LoginSchema.safeParse(data))
// after:
fieldErrorsFromZod(LoginSchema, data)
fieldErrorsFromZod(RegisterSchema, data)
fieldErrorsFromZod(ProfileUpdateSchema, data)
```
Each still calls `.safeParse()` exactly once, on the exact same schema, with the exact same data — only where that call happens (inside vs. outside the helper) changed.

## D. Zod Compatibility Audit

Full-repository search performed for every item on the checklist, against the actual source (not assumed):

| Pattern searched | Found | Verdict |
|---|---|---|
| `SafeParseReturnType` | 1 (the reported line) | **Fixed** (see C) |
| `SafeParseSuccess` / `SafeParseError` | 0 | N/A |
| `ZodTypeAny` | 0 | N/A |
| `ZodType` | 2 additional (`validation.ts`'s new fix; `features/categories/schema.ts:22`) | See below — one fixed, one reviewed and left unchanged |
| `ZodError` (as a type reference) | 0 (one match was a code comment) | N/A |
| `_def` | 0 | N/A |
| `z.infer<...>` | 13 across the codebase | All valid Zod 4 usage — `z.infer` is a core, unchanged type utility; every usage infers from a schema the project itself defines, not from a removed alias |
| `z.input<...>` / `z.output<...>` | 0 | N/A |
| `.safeParse(...)` / `.parse(...)` | ~18 call sites | All valid — foundational methods, unchanged across every Zod major version; none reference a removed type by name |
| `.flatten()` | 0 | N/A |
| `.format()` | 3 (`config/env.ts`, `lib/api-client.ts`, `lib/persistence.ts`) | **Changed defensively** — see below |
| imports from `"zod/v3"` / `"zod/v4"` / `"zod/v4/core"` | 0 | N/A |

**`features/categories/schema.ts`'s `z.ZodType<CategoryType>`** — this is Zod's own documented pattern for typing a *recursive* schema (a category referencing itself via `z.lazy()` for `children`), required in both Zod 3 and Zod 4 because TypeScript cannot infer a self-referencing schema's type automatically. `ZodType` itself is the foundational base class every Zod schema extends — nothing in this project's evidence suggests it was removed (only a narrower utility type alias, `SafeParseReturnType`, was). Judged **category 1 (valid Zod 4 usage)** and left unchanged, per the explicit instruction not to alter valid usage merely because it looks old. Flagged here plainly rather than silently: this judgment could not be confirmed against Zod 4.4.3's actual type declarations (no compiler access), so if the next build reports an error on this specific line, it should be treated as new evidence, not a surprise.

**`.format()` (3 call sites)** — all three are diagnostic `console.error`/`console.warn` calls inside an already-correctly-narrowed `if (!result.success)` block; none of them are the kind of type-alias reference that caused the reported failure. However: Zod 4's real, documented redesign of error-formatting utilities (introducing `z.treeifyError()`/`z.prettifyError()` as the new top-level functions) made this genuinely uncertain territory, and unlike `z.infer`/`.safeParse()`/`.issues` (all of which this project already relies on successfully elsewhere, and are core to Zod's design in every version), `.format()` as an *instance method* was a plausible candidate for the same kind of removal `SafeParseReturnType` underwent. Given that uncertainty could not be resolved without a compiler, and given the fix costs nothing (these are diagnostic logs, not application logic — `.issues` conveys the same information), all three were changed to `.issues`, which is unambiguously safe: it is the exact same property this project's own `fieldErrorsFromZod` already depends on, confirmed correct by definition since it's what the reported build error's surrounding code already relied on successfully.

## E. Regression Check — Why Login/Register/Profile Validation Behavior Is Unchanged

- `LoginSchema`, `RegisterSchema`, `ProfileUpdateSchema` — none were touched. Same file (`auth-service.ts`), same field rules, same error messages, same `.pick()` derivation for `ProfileUpdateSchema`.
- `validateLoginFields`, `validateRegisterFields`, `validateProfileFields` — their exported signatures (`(data: X) => XFieldErrors`) are byte-for-byte unchanged; their three call sites in `LoginForm.tsx`/`RegisterForm.tsx`/`ProfileForm.tsx` required zero edits, confirmed by re-reading each.
- The validation call itself (`schema.safeParse(data)`) still happens exactly once per invocation, with the exact same schema and data, just relocated from the call site into the shared helper — same synchronous timing, same result.
- `.issues`-based error-message extraction (`issue.path[0]`, `issue.message`, first-error-wins per field) is completely unchanged — this logic was never touched, only the type of the object it operates on.
- The `.format()` → `.issues` changes (D) are in diagnostic logging only, not in any validation decision, error message shown to a user, or control-flow branch.

## F. Build-Risk Assessment — What Remains Compiler-Unverified

Everything in this report is source-level analysis; **no `tsc`, `eslint`, or `npm run build` was run** — this environment has no network access and cannot install dependencies or invoke a compiler, the same limitation stated in every phase of this project. Specifically unverified:

- Whether `z.ZodType` (unparameterized reference in the new `validation.ts` fix, and the single-type-argument reference in `categories/schema.ts`) resolves with the exact generic signature assumed here against Zod 4.4.3's actual `.d.ts` declarations.
- Whether any other Zod 4 type-surface change exists in this codebase that doesn't match the specific patterns audited in D (the audit was thorough against the checklist given, not an exhaustive line-by-line type-check of every Zod-adjacent line in the project).
- Whether the two type-safety fixes from Phase 8/8.1 (discriminated-union result types) interact with this Zod fix in any way not anticipated — reviewed and found no overlap (they are unrelated systems: one is this project's own action-result types, the other is Zod's schema-result types), but stated explicitly rather than assumed silently.

## G. Vercel Verification Instruction

Deploy again with no other change. The build should be watched for:
1. Confirmation that `src/features/account/validation.ts:27` (or wherever the line now falls) no longer errors.
2. Any *new* TypeScript error, particularly on `src/features/categories/schema.ts:22` (the one `z.ZodType<CategoryType>` usage reviewed but not changed) or on any line touching `.format()`'s replacement — if either surfaces, treat it as this phase's audit having reached the limit of what source-level review (without a compiler) can catch, not as a new, unrelated defect.

This report does not claim the build passes. It claims the specific reported defect is fixed by removing dependence on the removed type entirely (not by finding a replacement name that might also be wrong), and that a deliberately broad — not just line-fix — audit of the same migration-defect class found and defensively addressed three related instances of genuine uncertainty. The next Vercel build is the only authoritative confirmation available.
