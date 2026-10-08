"use server";

import { prisma } from "./prisma";
import { getAuthenticatedUser } from "./auth-utils";
import { logger } from "../logger";
import type { 
  CreateRepairRequestInput, 
  UpdateRepairRequestInput, 
  RepairRequestResult,
  RepairRequestListResult,
  RepairStatus
} from "@/features/repair/types";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";

// ============================================================
// Schema Validation
// ============================================================

const CreateRepairRequestSchema = z.object({
  firstName: z.string().min(1, "نام الزامی است").max(50),
  lastName: z.string().min(1, "نام خانوادگی الزامی است").max(50),
  mobileNumber: z.string().min(11, "شماره موبایل نامعتبر است").max(11),
  email: z.string().email("ایمیل نامعتبر است").optional().or(z.literal("")),
  brand: z.string().min(1, "برند گوشی الزامی است").max(50),
  model: z.string().min(1, "مدل گوشی الزامی است").max(50),
  problemType: z.string().min(1, "نوع مشکل الزامی است").max(100),
  description: z.string().min(10, "توضیحات باید حداقل ۱۰ کاراکتر باشد").max(1000),
  address: z.string().max(500).optional().or(z.literal("")),
});

const UpdateRepairRequestSchema = z.object({
  status: z.enum(["pending", "reviewing", "approved", "repairing", "ready", "delivered", "rejected"]).optional(),
  estimatedCost: z.number().min(0).optional(),
  adminNote: z.string().max(500).optional(),
});

// ============================================================
// Helper Functions
// ============================================================

/**
 * ✅ تولید کد پیگیری ساده — ۸ رقم فقط عددی
 * فرمت: R-12345678
 * - R = Repair
 * - ۸ رقم عددی (۱۰۰ میلیون ترکیب)
 */
function generateTrackingCode(): string {
  const numbers = Math.floor(10000000 + Math.random() * 90000000);
  return `R-${numbers}`;
}

// ✅ تابع برای تبدیل امن status
function toRepairStatus(value: string): RepairStatus {
  const validStatuses: RepairStatus[] = ["pending", "reviewing", "approved", "repairing", "ready", "delivered", "rejected"];
  if (validStatuses.includes(value as RepairStatus)) {
    return value as RepairStatus;
  }
  return "pending";
}

interface PrismaRepairRequest {
  id: string;
  trackingCode: string;
  firstName: string;
  lastName: string;
  mobileNumber: string;
  email: string | null;
  brand: string;
  model: string;
  problemType: string;
  description: string;
  address: string | null;
  status: string;
  estimatedCost: Prisma.Decimal | null;
  adminNote: string | null;
  createdAt: Date;
  updatedAt: Date;
}

function mapPrismaToRepairRequest(p: PrismaRepairRequest) {
  return {
    id: p.id,
    trackingCode: p.trackingCode,
    firstName: p.firstName,
    lastName: p.lastName,
    mobileNumber: p.mobileNumber,
    email: p.email,
    brand: p.brand,
    model: p.model,
    problemType: p.problemType,
    description: p.description,
    address: p.address,
    status: toRepairStatus(p.status),
    estimatedCost: p.estimatedCost ? Number(p.estimatedCost) : null,
    adminNote: p.adminNote,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

// ============================================================
// Server Actions
// ============================================================

/**
 * ثبت درخواست جدید تعمیر
 */
export async function createRepairRequestAction(
  input: CreateRepairRequestInput
): Promise<RepairRequestResult> {
  try {
    const validated = CreateRepairRequestSchema.safeParse(input);
    if (!validated.success) {
      const errors = validated.error.issues.map(e => e.message).join("، ");
      return { success: false, error: errors };
    }

    const data = validated.data;

    // ✅ تولید کد یکتا با retry
    let trackingCode = generateTrackingCode();
    let attempts = 0;
    while (attempts < 5) {
      const exists = await prisma.repairRequest.findUnique({
        where: { trackingCode },
      });
      if (!exists) break;
      trackingCode = generateTrackingCode();
      attempts++;
    }

    const repairRequest = await prisma.repairRequest.create({
      data: {
        trackingCode,
        firstName: data.firstName,
        lastName: data.lastName,
        mobileNumber: data.mobileNumber,
        email: data.email || null,
        brand: data.brand,
        model: data.model,
        problemType: data.problemType,
        description: data.description,
        address: data.address || null,
        status: "pending",
      },
    });

    logger.info("[Repair:Create] Success", { 
      trackingCode, 
      mobileNumber: data.mobileNumber,
      brand: data.brand,
      model: data.model,
    });

    return {
      success: true,
      data: mapPrismaToRepairRequest(repairRequest),
      trackingCode,
    };
  } catch (error) {
    logger.error("[Repair:Create] Failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return { 
      success: false, 
      error: "خطا در ثبت درخواست تعمیر. لطفاً دوباره تلاش کنید." 
    };
  }
}

/**
 * دریافت یک درخواست با کد پیگیری
 */
export async function getRepairRequestByTrackingAction(
  trackingCode: string
): Promise<RepairRequestResult> {
  try {
    if (!trackingCode || trackingCode.length < 3) {
      return { success: false, error: "کد پیگیری نامعتبر است." };
    }

    const repairRequest = await prisma.repairRequest.findUnique({
      where: { trackingCode },
    });

    if (!repairRequest) {
      return { success: false, error: "درخواست با این کد پیگیری یافت نشد." };
    }

    return {
      success: true,
      data: mapPrismaToRepairRequest(repairRequest),
    };
  } catch (error) {
    logger.error("[Repair:Get] Failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return { 
      success: false, 
      error: "خطا در دریافت اطلاعات درخواست." 
    };
  }
}

/**
 * دریافت درخواست‌های یک کاربر با شماره موبایل
 */
export async function getRepairRequestsByMobileAction(
  mobileNumber: string
): Promise<RepairRequestListResult> {
  try {
    if (!mobileNumber || mobileNumber.length < 10) {
      return { success: false, error: "شماره موبایل نامعتبر است." };
    }

    const requests = await prisma.repairRequest.findMany({
      where: { mobileNumber },
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      data: requests.map(mapPrismaToRepairRequest),
    };
  } catch (error) {
    logger.error("[Repair:List] Failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return { 
      success: false, 
      error: "خطا در دریافت لیست درخواست‌ها." 
    };
  }
}

/**
 * دریافت لیست تمام درخواست‌ها (فقط ادمین)
 */
export async function getAllRepairRequestsAction(): Promise<RepairRequestListResult> {
  const user = await getAuthenticatedUser();
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return { success: false, error: "دسترسی غیرمجاز." };
  }

  try {
    const requests = await prisma.repairRequest.findMany({
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      data: requests.map(mapPrismaToRepairRequest),
    };
  } catch (error) {
    logger.error("[Repair:GetAll] Failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return { 
      success: false, 
      error: "خطا در دریافت لیست درخواست‌ها." 
    };
  }
}

/**
 * به‌روزرسانی درخواست تعمیر (فقط ادمین)
 */
export async function updateRepairRequestAction(
  id: string,
  input: UpdateRepairRequestInput
): Promise<RepairRequestResult> {
  const user = await getAuthenticatedUser();
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return { success: false, error: "دسترسی غیرمجاز." };
  }

  try {
    const validated = UpdateRepairRequestSchema.safeParse(input);
    if (!validated.success) {
      const errors = validated.error.issues.map(e => e.message).join("، ");
      return { success: false, error: errors };
    }

    const data = validated.data;

    const existing = await prisma.repairRequest.findUnique({
      where: { id },
    });

    if (!existing) {
      return { success: false, error: "درخواست یافت نشد." };
    }

    const updateData: {
      status?: string;
      estimatedCost?: number;
      adminNote?: string;
      updatedAt?: Date;
    } = {};
    if (data.status) updateData.status = data.status;
    if (data.estimatedCost !== undefined) updateData.estimatedCost = data.estimatedCost;
    if (data.adminNote !== undefined) updateData.adminNote = data.adminNote;
    updateData.updatedAt = new Date();

    const updated = await prisma.repairRequest.update({
      where: { id },
      data: updateData,
    });

    logger.info("[Repair:Update] Success", { 
      id, 
      status: data.status,
      updatedBy: user.id,
    });

    revalidatePath("/admin/repair");
    revalidatePath("/repair/track");

    return {
      success: true,
      data: mapPrismaToRepairRequest(updated),
    };
  } catch (error) {
    logger.error("[Repair:Update] Failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return { 
      success: false, 
      error: "خطا در به‌روزرسانی درخواست." 
    };
  }
}

/**
 * حذف درخواست تعمیر (فقط ادمین)
 */
export async function deleteRepairRequestAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const user = await getAuthenticatedUser();
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return { success: false, error: "دسترسی غیرمجاز." };
  }

  try {
    await prisma.repairRequest.delete({
      where: { id },
    });

    logger.info("[Repair:Delete] Success", { id, deletedBy: user.id });

    revalidatePath("/admin/repair");

    return { success: true };
  } catch (error) {
    logger.error("[Repair:Delete] Failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return { 
      success: false, 
      error: "خطا در حذف درخواست." 
    };
  }
}