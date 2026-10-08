"use server";

import { LoginSchema, RegisterSchema } from "@/services/auth-service";
import { prisma } from "./prisma";
import { getAuthenticatedUser } from "./auth-utils";
import { notifyRegistrationWelcome, sendSms, sendEmail } from "../notification-boundary";
import { logger } from "../logger";
import type { User } from "@/features/account/types";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import crypto from "crypto";

/**
 * Server-side Authentication Actions
 */

export type RegisterResult =
  | { success: true; userId: string }
  | { success: false; error: string };

export type LoginResult =
  | { success: true; user: User }
  | { success: false; error: string };

export type LogoutResult = { success: true };

export type GetCurrentUserResult =
  | { success: true; user: User }
  | { success: false };

export type CleanupSessionsResult =
  | { success: true; count: number }
  | { success: false; error: string };

export type RequestPasswordResetResult =
  | { success: true; message: string }
  | { success: false; error: string };

export type ResetPasswordResult =
  | { success: true; message: string }
  | { success: false; error: string };

// ============================================================
// ✅ Helper: ماسک کردن ایمیل و موبایل
// ============================================================
function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "***";
  const visibleLocal = local.length > 2 ? local.slice(0, 2) : local[0] ?? "";
  return `${visibleLocal}***@${domain}`;
}

function maskMobile(mobile: string): string {
  if (mobile.length < 6) return "***";
  return `${mobile.slice(0, 4)}***${mobile.slice(-2)}`;
}

export async function registerAction(data: unknown): Promise<RegisterResult> {
  const result = RegisterSchema.safeParse(data);
  if (!result.success) {
    return { success: false, error: "ساختار ورودی صحیح نیست." };
  }

  try {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { mobileNumber: result.data.mobileNumber },
          ...(result.data.email ? [{ email: result.data.email }] : []),
        ],
      },
    });

    if (existingUser) {
      const field =
        existingUser.mobileNumber === result.data.mobileNumber
          ? "شماره موبایل"
          : "ایمیل";
      return { success: false, error: `این ${field} قبلاً ثبت شده است.` };
    }

    const hashedPassword = await bcrypt.hash(result.data.password, 12);

    const user = await prisma.user.create({
      data: {
        firstName: result.data.firstName,
        lastName: result.data.lastName,
        mobileNumber: result.data.mobileNumber,
        email: result.data.email || null,
        password: hashedPassword,
        role: "customer",
      },
    });

    try {
      const notifyResult = await notifyRegistrationWelcome(
        user.mobileNumber,
        user.firstName
      );
      if (notifyResult.status !== "sent") {
        logger.warn("[Auth:Register] Welcome notification did not send", {
          userId: user.id,
          status: notifyResult.status,
        });
      }
    } catch (notifyError) {
      logger.error("[Auth:Register] Welcome notification failed", {
        userId: user.id,
        error: String(notifyError),
      });
    }

    return { success: true, userId: user.id };
  } catch (error) {
    logger.error("[Auth:Register] Failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return { success: false, error: "خطا در ثبت‌نام." };
  }
}

// ✅ lockout حذف شد — دیگه حساب مسدود نمیشه
export async function loginAction(credentials: unknown): Promise<LoginResult> {
  const result = LoginSchema.safeParse(credentials);
  if (!result.success) {
    return { success: false, error: "ساختار ورودی صحیح نیست." };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { mobileNumber: result.data.mobileNumber },
    });

    const dummyHash =
      "$2b$12$L8M5z3gP8V.Yg.Gf3K6G.uO3zG7H1mY6S5R9K4vL3M2N1O0PqR";
    const passwordToCompare = user ? user.password : dummyHash;
    const isValid = await bcrypt.compare(
      result.data.password,
      passwordToCompare
    );

    if (!user || !isValid) {
      return {
        success: false,
        error: "شماره موبایل یا رمز عبور اشتباه است.",
      };
    }

    if (user.loginAttempts > 0 || user.lockoutUntil) {
      await prisma.user.update({
        where: { id: user.id },
        data: { loginAttempts: 0, lockoutUntil: null },
      });
    }

    const sessionToken = crypto.randomUUID();
    const hashedToken = crypto
      .createHash("sha256")
      .update(sessionToken)
      .digest("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.session.create({
      data: {
        token: hashedToken,
        userId: user.id,
        expiresAt: expiresAt,
      },
    });

    (await cookies()).set("vahdat_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    });

    return {
      success: true,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        mobileNumber: user.mobileNumber,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
      },
    };
  } catch (error) {
    logger.error("[Auth:Login] Failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return { success: false, error: "خطا در برقراری ارتباط با پایگاه داده." };
  }
}

export async function logoutAction(): Promise<LogoutResult> {
  const cookieStore = await cookies();
  const token = cookieStore.get("vahdat_session")?.value;

  if (token) {
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");
    await prisma.session.deleteMany({
      where: { token: hashedToken },
    });
  }

  cookieStore.delete("vahdat_session");
  return { success: true };
}

export async function getCurrentUserAction(): Promise<GetCurrentUserResult> {
  const user = await getAuthenticatedUser();
  if (!user) return { success: false };
  return { success: true, user };
}

export async function cleanupExpiredSessionsAction(): Promise<CleanupSessionsResult> {
  try {
    const result = await prisma.session.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    logger.info("[Auth:Cleanup] Success", { count: result.count });
    return { success: true, count: result.count };
  } catch (error) {
    logger.error("[Auth:Cleanup] Failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return { success: false, error: "خطا در پاکسازی نشست‌های منقضی." };
  }
}

export async function scheduledCleanupAction(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const result = await cleanupExpiredSessionsAction();
    if (result.success) {
      return {
        success: true,
        message: `✅ ${result.count} نشست منقضی پاکسازی شد.`,
      };
    }
    return {
      success: false,
      message: result.error || "خطا در پاکسازی نشست‌ها.",
    };
  } catch (error) {
    logger.error("[Auth:ScheduledCleanup] Failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      success: false,
      message: "خطا در پاکسازی خودکار نشست‌ها.",
    };
  }
}

// ============================================================
// ✅ فراموشی رمز عبور
// ============================================================

/**
 * درخواست بازیابی رمز عبور
 *
 * استراتژی:
 * ۱. اول SMS (به شماره موبایل) — راحت‌ترین برای کاربر
 * ۲. اگه SMS نشد و کاربر ایمیل داشت → ایمیل
 * ۳. اگه هیچ‌کدوم نشد → کد توی console.log (برای تست)
 */
export async function requestPasswordResetAction(
  mobileNumber: string
): Promise<RequestPasswordResetResult> {
  try {
    if (!/^09\d{9}$/.test(mobileNumber)) {
      return { success: false, error: "شماره موبایل معتبر نیست." };
    }

    const user = await prisma.user.findUnique({
      where: { mobileNumber },
    });

    // ⚠️ امنیت: پیام یکسان برای هر دو حالت (کاربر موجود یا ناموجود)
    if (!user) {
      return {
        success: true,
        message: "اگر این شماره در سیستم ثبت شده باشد، کد بازیابی ارسال خواهد شد.",
      };
    }

    // تولید کد ۶ رقمی
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedCode = crypto
      .createHash("sha256")
      .update(resetCode)
      .digest("hex");
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // ۱۰ دقیقه

    // ذخیره‌ی کد توی دیتابیس
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: hashedCode,
        passwordResetExpiresAt: expiresAt,
      },
    });

    // ✅ استراتژی: اول SMS، بعد Email
    let sent = false;
    let sentVia: "sms" | "email" | null = null;

    // ۱. تلاش برای SMS
    try {
      const smsMessage = `کد بازیابی رمز عبور شما: ${resetCode}\nاین کد تا ۱۰ دقیقه اعتبار دارد.\nموبایل وحدت`;
      const smsResult = await sendSms(user.mobileNumber, smsMessage);

      if (smsResult.status === "sent") {
        sent = true;
        sentVia = "sms";
        logger.info("[Auth:PasswordReset] SMS sent", { userId: user.id });
      } else {
        logger.warn("[Auth:PasswordReset] SMS did not send", {
          userId: user.id,
          status: smsResult.status,
          error: smsResult.error,
        });
      }
    } catch (smsError) {
      logger.error("[Auth:PasswordReset] SMS failed", {
        userId: user.id,
        error: String(smsError),
      });
    }

    // ۲. اگه SMS نشد و کاربر ایمیل داشت → ایمیل
    if (!sent && user.email) {
      try {
        const emailHtml = `
          <div dir="rtl" style="font-family: Tahoma, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563eb;">بازیابی رمز عبور</h2>
            <p>کد بازیابی رمز عبور شما:</p>
            <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1e293b;">${resetCode}</span>
            </div>
            <p style="color: #64748b; font-size: 14px;">این کد تا ۱۰ دقیقه اعتبار دارد.</p>
            <p style="color: #64748b; font-size: 14px;">اگر شما این درخواست را نداده‌اید، این ایمیل را نادیده بگیرید.</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
            <p style="color: #94a3b8; font-size: 12px;">موبایل وحدت</p>
          </div>
        `;

        const emailResult = await sendEmail({
          to: user.email,
          subject: "بازیابی رمز عبور — موبایل وحدت",
          html: emailHtml,
        });

        if (emailResult.status === "sent") {
          sent = true;
          sentVia = "email";
          logger.info("[Auth:PasswordReset] Email sent", { userId: user.id });
        } else {
          logger.warn("[Auth:PasswordReset] Email did not send", {
            userId: user.id,
            status: emailResult.status,
            error: emailResult.error,
          });
        }
      } catch (emailError) {
        logger.error("[Auth:PasswordReset] Email failed", {
          userId: user.id,
          error: String(emailError),
        });
      }
    }

    // ۳. اگه هیچ‌کدوم نشد → log (برای تست)
    if (!sent) {
      console.log("🔐 [DEBUG] Password reset code for", mobileNumber, ":", resetCode);
      logger.warn("[Auth:PasswordReset] All providers failed — code logged to console", {
        userId: user.id,
      });
    }

    // ✅ پیام نهایی با ماسک امنیتی
    const targetLabel =
      sentVia === "email" && user.email
        ? `ایمیل ${maskEmail(user.email)}`
        : sentVia === "sms"
        ? `شماره موبایل ${maskMobile(user.mobileNumber)}`
        : null;

    return {
      success: true,
      message: targetLabel
        ? `کد بازیابی به ${targetLabel} ارسال شد.`
        : "اگر این شماره در سیستم ثبت شده باشد، کد بازیابی ارسال خواهد شد.",
    };
  } catch (error) {
    logger.error("[Auth:PasswordReset] Failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return { success: false, error: "خطا در ارسال کد بازیابی." };
  }
}

/**
 * تنظیم رمز عبور جدید با کد بازیابی
 */
export async function resetPasswordAction(data: {
  mobileNumber: string;
  resetCode: string;
  newPassword: string;
}): Promise<ResetPasswordResult> {
  try {
    if (!/^09\d{9}$/.test(data.mobileNumber)) {
      return { success: false, error: "شماره موبایل معتبر نیست." };
    }
    if (!/^\d{6}$/.test(data.resetCode)) {
      return { success: false, error: "کد بازیابی باید ۶ رقم باشد." };
    }
    if (data.newPassword.length < 8) {
      return { success: false, error: "رمز عبور باید حداقل ۸ کاراکتر باشد." };
    }

    const user = await prisma.user.findUnique({
      where: { mobileNumber: data.mobileNumber },
    });

    if (!user) {
      return { success: false, error: "کد بازیابی نامعتبر یا منقضی شده است." };
    }

    if (
      !user.passwordResetToken ||
      !user.passwordResetExpiresAt ||
      user.passwordResetExpiresAt < new Date()
    ) {
      return { success: false, error: "کد بازیابی نامعتبر یا منقضی شده است." };
    }

    const hashedInputCode = crypto
      .createHash("sha256")
      .update(data.resetCode)
      .digest("hex");

    if (hashedInputCode !== user.passwordResetToken) {
      return { success: false, error: "کد بازیابی نامعتبر یا منقضی شده است." };
    }

    const hashedNewPassword = await bcrypt.hash(data.newPassword, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedNewPassword,
          passwordResetToken: null,
          passwordResetExpiresAt: null,
          loginAttempts: 0,
          lockoutUntil: null,
        },
      }),
      prisma.session.deleteMany({
        where: { userId: user.id },
      }),
    ]);

    logger.info("[Auth:PasswordReset] Success", { userId: user.id });

    return {
      success: true,
      message: "رمز عبور با موفقیت تغییر یافت. لطفاً وارد شوید.",
    };
  } catch (error) {
    logger.error("[Auth:PasswordReset] Failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return { success: false, error: "خطا در تغییر رمز عبور." };
  }
}