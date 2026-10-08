"use server";

import { z } from "zod";
import { OrderAddressSchema } from "@/features/orders/types";
import { ProfileUpdateSchema } from "@/features/account/validation";
import { prisma } from "./prisma";

import { getAuthenticatedUser } from "./auth-utils";
import bcrypt from "bcryptjs";
import { createSafeAction } from "./action-utils";
import { notifyPasswordChanged } from "../notification-boundary";
import { logger } from "../logger";

/**
 * Account Actions (Server-side)
 *
 * Enforces ownership and isolates user data.
 */

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

const PROFILE_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  mobileNumber: true,
  email: true,
  role: true,
  createdAt: true,
} as const;

export async function getProfileAction() {
  return createSafeAction("Account:GetProfile", async () => {
    const authUser = await getAuthenticatedUser();
    if (!authUser) throw new Error("Unauthorized");

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: PROFILE_SELECT,
    });
    if (!user) throw new Error("کاربر یافت نشد.");

    return { ...user, createdAt: user.createdAt.toISOString() };
  });
}

export async function updateProfileAction(data: unknown) {
  return createSafeAction("Account:UpdateProfile", async () => {
    const authUser = await getAuthenticatedUser();
    if (!authUser) throw new Error("Unauthorized");

    const parsed = ProfileUpdateSchema.safeParse(data);
    if (!parsed.success) {
      throw new Error(parsed.error.issues[0]?.message || "اطلاعات وارد شده معتبر نیست.");
    }

    const email = parsed.data.email || undefined;

    if (email) {
      const existing = await prisma.user.findFirst({
        where: { email, NOT: { id: authUser.id } },
      });
      if (existing) {
        throw new Error("این ایمیل قبلاً توسط کاربر دیگری استفاده شده است.");
      }
    }

    const updated = await prisma.user.update({
      where: { id: authUser.id },
      data: {
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        email: email || null,
      },
      select: PROFILE_SELECT,
    });

    return { ...updated, createdAt: updated.createdAt.toISOString() };
  });
}

export async function changePasswordAction(data: { currentPassword: string; newPassword: string }) {
  return createSafeAction("Account:ChangePassword", async () => {
    const userRecord = await getAuthenticatedUser();
    if (!userRecord) throw new Error("Unauthorized");

    const user = await prisma.user.findUnique({ where: { id: userRecord.id } });
    if (!user) throw new Error("User not found");

    const isValid = await bcrypt.compare(data.currentPassword, user.password);
    if (!isValid) throw new Error("رمز عبور فعلی اشتباه است.");

    const hashedNewPassword = await bcrypt.hash(data.newPassword, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { password: hashedNewPassword },
      }),
      prisma.session.deleteMany({
        where: { userId: user.id },
      }),
    ]);

    try {
      const notifyResult = await notifyPasswordChanged(user.mobileNumber);
      if (notifyResult.status !== "sent") {
        logger.warn("[Account:ChangePassword] Notification did not send", {
          userId: user.id,
          status: notifyResult.status,
        });
      }
    } catch (notifyError) {
      logger.error("[Account:ChangePassword] Notification failed", {
        userId: user.id,
        error: String(notifyError),
      });
    }

    return { message: "رمز عبور با موفقیت تغییر یافت. لطفاً دوباره وارد شوید." };
  });
}

// ---------------------------------------------------------------------------
// Addresses
// ---------------------------------------------------------------------------

export interface AccountAddress {
  id: string;
  title: string;
  province: string;
  city: string;
  streetAddress: string;
  postalCode: string | null;
  additionalDescription: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

const AddressInputSchema = OrderAddressSchema.extend({
  title: z.string().trim().min(1, "عنوان آدرس الزامی است.").max(50, "عنوان آدرس طولانی است."),
});

export async function getAddressesAction() {
  return createSafeAction("Account:GetAddresses", async () => {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("Unauthorized");

    const addresses = await prisma.address.findMany({
      where: { userId: user.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });

    return addresses.map((address) => ({
      ...address,
      createdAt: address.createdAt.toISOString(),
      updatedAt: address.updatedAt.toISOString(),
    }));
  });
}

export async function addAddressAction(address: unknown) {
  return createSafeAction("Account:AddAddress", async () => {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("Unauthorized");

    const result = AddressInputSchema.safeParse(address);
    if (!result.success)
      throw new Error(result.error.issues[0]?.message || "اطلاعات آدرس صحیح نیست.");

    const existingCount = await prisma.address.count({ where: { userId: user.id } });

    const newAddress = await prisma.address.create({
      data: {
        userId: user.id,
        title: result.data.title,
        province: result.data.province,
        city: result.data.city,
        streetAddress: result.data.streetAddress,
        postalCode: result.data.postalCode,
        additionalDescription: result.data.additionalDescription,
        isDefault: existingCount === 0,
      },
    });
    return { id: newAddress.id };
  });
}

export async function updateAddressAction(addressId: string, address: unknown) {
  return createSafeAction("Account:UpdateAddress", async () => {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("Unauthorized");

    const existing = await prisma.address.findUnique({ where: { id: addressId } });
    if (!existing || existing.userId !== user.id) {
      throw new Error("دسترسی غیرمجاز.");
    }

    const result = AddressInputSchema.safeParse(address);
    if (!result.success)
      throw new Error(result.error.issues[0]?.message || "اطلاعات آدرس صحیح نیست.");

    const updated = await prisma.address.update({
      where: { id: addressId },
      data: {
        title: result.data.title,
        province: result.data.province,
        city: result.data.city,
        streetAddress: result.data.streetAddress,
        postalCode: result.data.postalCode,
        additionalDescription: result.data.additionalDescription,
      },
    });
    return { id: updated.id };
  });
}

export async function setDefaultAddressAction(addressId: string) {
  return createSafeAction("Account:SetDefaultAddress", async () => {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("Unauthorized");

    const existing = await prisma.address.findUnique({ where: { id: addressId } });
    if (!existing || existing.userId !== user.id) {
      throw new Error("دسترسی غیرمجاز.");
    }

    if (existing.isDefault) {
      return { success: true };
    }

    await prisma.$transaction([
      prisma.address.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false },
      }),
      prisma.address.update({
        where: { id: addressId },
        data: { isDefault: true },
      }),
    ]);

    return { success: true };
  });
}

export async function deleteAddressAction(addressId: string) {
  return createSafeAction("Account:DeleteAddress", async () => {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("Unauthorized");

    const address = await prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!address || address.userId !== user.id) {
      throw new Error("Access denied.");
    }

    await prisma.address.delete({
      where: { id: addressId },
    });

    if (address.isDefault) {
      const nextAddress = await prisma.address.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
      });
      if (nextAddress) {
        await prisma.address.update({
          where: { id: nextAddress.id },
          data: { isDefault: true },
        });
      }
    }

    return { success: true };
  });
}