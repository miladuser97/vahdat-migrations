import { z } from "zod";
import {
  loginAction,
  logoutAction,
  registerAction,
  requestPasswordResetAction,
  resetPasswordAction,
} from "@/lib/server/auth-actions";

/**
 * Authentication Service (Client-side Boundary)
 */

export const LoginSchema = z.object({
  mobileNumber: z.string().regex(/^09\d{9}$/, "شماره موبایل معتبر نیست."),
  password: z.string().min(8, "رمز عبور باید حداقل ۸ کاراکتر باشد."),
});

export const RegisterSchema = z.object({
  firstName: z.string().min(2, "نام معتبر نیست."),
  lastName: z.string().min(2, "نام خانوادگی معتبر نیست."),
  mobileNumber: z.string().regex(/^09\d{9}$/, "شماره موبایل معتبر نیست."),
  email: z
    .string()
    .optional()
    .transform((val) => {
      const trimmed = val?.trim();
      return trimmed === "" ? undefined : trimmed;
    })
    .refine(
      (val) => val === undefined || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
      "ایمیل معتبر نیست."
    ),
  password: z.string().min(8, "رمز عبور باید حداقل ۸ کاراکتر باشد."),
});

export const AuthResponseSchema = z.object({
  user: z.object({
    id: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    mobileNumber: z.string(),
    email: z.string().optional(),
    role: z.enum(["customer", "staff", "admin", "super_admin"]),
    createdAt: z.string(),
  }),
  token: z.string(),
});

export async function login(credentials: z.infer<typeof LoginSchema>) {
  return loginAction(credentials);
}

export async function register(userData: unknown) {
  return registerAction(userData);
}

export async function logout() {
  return logoutAction();
}

// ✅ توابع جدید
export async function requestPasswordReset(mobileNumber: string) {
  return requestPasswordResetAction(mobileNumber);
}

export async function resetPassword(data: {
  mobileNumber: string;
  resetCode: string;
  newPassword: string;
}) {
  return resetPasswordAction(data);
}