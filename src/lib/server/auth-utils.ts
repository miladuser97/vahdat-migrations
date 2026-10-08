"use server";

import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/server/prisma";
import { logger } from "@/lib/logger";

// ============================================================
// نام کوکی
// ============================================================
const SESSION_COOKIE_NAME = "vahdat_session";
const SESSION_DURATION_DAYS = 30;

// ============================================================
// ✅ Helper: هش کردن توکن Session (مثل auth-actions.ts)
// ============================================================
function hashSessionToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// ============================================================
// هش کردن پسورد
// ============================================================
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// ============================================================
// بررسی پسورد
// ============================================================
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// ============================================================
// ساخت توکن Session
// ============================================================
function generateSessionToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

// ============================================================
// ساخت Session جدید
// ✅ توکن رو هش می‌کنه قبل از ذخیره در DB (مثل auth-actions.ts)
// ============================================================
export async function createSession(userId: string): Promise<string> {
  const token = generateSessionToken();
  const hashedToken = hashSessionToken(token);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

  await prisma.session.create({
    data: {
      token: hashedToken,
      userId,
      expiresAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });

  return token;
}

// ============================================================
// حذف Session (خروج)
// ✅ توکن رو هش می‌کنه قبل از حذف از DB
// ============================================================
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    try {
      const hashedToken = hashSessionToken(token);
      await prisma.session.deleteMany({
        where: { token: hashedToken },
      });
    } catch (error) {
      logger.error("خطا در حذف session", { error });
    }
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}

// ============================================================
// گرفتن کاربر احراز هویت شده
// ✅ توکن خام رو از کوکی می‌گیره، هش می‌کنه، با هش توی DB می‌گرده
// ============================================================
export async function getAuthenticatedUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) return null;

    const hashedToken = hashSessionToken(token);

    const session = await prisma.session.findUnique({
      where: { token: hashedToken },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            mobileNumber: true,
            email: true,
            role: true,
            loyaltyPoints: true,
            financialTestPassed: true,
            createdAt: true,
          },
        },
      },
    });

    if (!session) return null;

    if (session.expiresAt < new Date()) {
      await prisma.session.delete({ where: { id: session.id } });
      return null;
    }

    const { createdAt, ...rest } = session.user;
    return {
      ...rest,
      createdAt: createdAt.toISOString(),
    };
  } catch (error) {
    logger.error("خطا در گرفتن کاربر احراز هویت شده", { error });
    return null;
  }
}

// ============================================================
// بررسی ادمین بودن
// ============================================================
export async function requireAdmin() {
  const user = await getAuthenticatedUser();

  if (!user) {
    throw new Error("UNAUTHORIZED");
  }

  if (user.role !== "admin" && user.role !== "super_admin") {
    throw new Error("FORBIDDEN");
  }

  return user;
}

// ============================================================
// بررسی کاربر عادی
// ============================================================
export async function requireUser() {
  const user = await getAuthenticatedUser();

  if (!user) {
    throw new Error("UNAUTHORIZED");
  }

  return user;
}