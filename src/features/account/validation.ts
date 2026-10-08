import type { z } from "zod";
import { LoginSchema, RegisterSchema } from "@/services/auth-service";

/**
 * Account (Auth) Validation
 *
 * Phase 3: field-level validation for the Login/Register forms.
 * Deliberately does NOT redefine any validation rule — it derives
 * per-field error messages from the same `LoginSchema`/`RegisterSchema`
 * zod schemas that `loginAction`/`registerAction` already validate
 * against server-side (see src/services/auth-service.ts). This keeps
 * validation rules in exactly one place; the client only decides *when*
 * to surface a given field's error (see the `touched` pattern already
 * used in features/checkout/components/CustomerInformationSection.tsx).
 *
 * Phase 6: `ProfileUpdateSchema` extends the same approach to the
 * profile-edit form — derived from `RegisterSchema` via `.pick()`
 * rather than a second, independent set of name/email rules. This is
 * the one place it's defined; both `updateProfileAction`
 * (account-actions.ts) and `validateProfileFields` below import it
 * from here.
 */

export type FieldErrors<TKey extends string> = Partial<Record<TKey, string>>;

/**
 * Phase 8.2: previously typed its parameter as `z.SafeParseReturnType<...>`
 * — a Zod-3-era public type alias that Zod 4.4.3 (the version actually
 * installed, per package.json) does not export, which is exactly what
 * broke the real Vercel build. Rather than replace it with a different
 * named Zod type (risking the same class of problem the next time
 * Zod's public type surface changes), this now takes the *schema*
 * itself and calls `.safeParse()` inside the function — so the result's
 * type is inferred directly from the real, currently-installed
 * `.safeParse()` method signature via ordinary TypeScript inference,
 * not from a separately-maintained public type-alias name at all.
 * `z.ZodType` (the base class every Zod schema extends) is used only
 * to say "some Zod schema" for the parameter — it is not itself the
 * type this function's logic depends on; `result`'s type below is
 * derived structurally, not asserted.
 */
function fieldErrorsFromZod<TKey extends string>(
  schema: z.ZodType,
  data: unknown
): FieldErrors<TKey> {
  const result = schema.safeParse(data);
  if (result.success) return {};
  const errors: FieldErrors<TKey> = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0] as TKey | undefined;
    if (key && !(key in errors)) {
      errors[key] = issue.message;
    }
  }
  return errors;
}

export interface LoginFormData {
  mobileNumber: string;
  password: string;
}

export type LoginFieldErrors = FieldErrors<keyof LoginFormData & string>;

export function validateLoginFields(data: LoginFormData): LoginFieldErrors {
  return fieldErrorsFromZod(LoginSchema, data);
}

export interface RegisterFormData {
  firstName: string;
  lastName: string;
  mobileNumber: string;
  email: string;
  password: string;
}

export type RegisterFieldErrors = FieldErrors<keyof RegisterFormData & string>;

export function validateRegisterFields(data: RegisterFormData): RegisterFieldErrors {
  return fieldErrorsFromZod(RegisterSchema, data);
}

/**
 * Client-only check (RegisterSchema has no confirmPassword field — the
 * server only ever sees `password` once). Not a "validation rule" in
 * the schema sense, just a UI safeguard against typos.
 */
export function confirmPasswordError(password: string, confirmPassword: string): string | undefined {
  if (!confirmPassword) return undefined;
  return password === confirmPassword ? undefined : "رمز عبور و تکرار آن یکسان نیستند.";
}

// ---------------------------------------------------------------------------
// Profile (Phase 6)
// ---------------------------------------------------------------------------

/**
 * Same firstName/lastName/email rules RegisterSchema already enforces
 * at signup — picked, not retyped. Mobile number is deliberately
 * excluded: this app has no phone-verification mechanism (see
 * src/lib/server/account-actions.ts's updateProfileAction doc comment
 * for why mobile number is read-only in this phase), so it is not a
 * field this schema — or the profile form — offers to change.
 */
export const ProfileUpdateSchema = RegisterSchema.pick({
  firstName: true,
  lastName: true,
  email: true,
});

export interface ProfileFormData {
  firstName: string;
  lastName: string;
  email: string;
}

export type ProfileFieldErrors = FieldErrors<keyof ProfileFormData & string>;

export function validateProfileFields(data: ProfileFormData): ProfileFieldErrors {
  return fieldErrorsFromZod(ProfileUpdateSchema, data);
}
