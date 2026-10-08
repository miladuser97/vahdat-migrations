/**
 * Repair Request Types
 * 
 * تایپ‌های مربوط به بخش درخواست تعمیر گوشی
 */

 export type RepairStatus = 
 | "pending"      // در انتظار بررسی
 | "reviewing"    // در حال بررسی
 | "approved"     // تأیید شده
 | "repairing"    // در حال تعمیر
 | "ready"        // آماده تحویل
 | "delivered"    // تحویل داده شد
 | "rejected";    // رد شد

export const REPAIR_STATUS_LABELS: Record<RepairStatus, string> = {
 pending: "در انتظار بررسی",
 reviewing: "در حال بررسی",
 approved: "تأیید شده",
 repairing: "در حال تعمیر",
 ready: "آماده تحویل",
 delivered: "تحویل داده شد",
 rejected: "رد شد",
};

export const REPAIR_STATUS_VARIANTS: Record<RepairStatus, "pending" | "processing" | "success" | "warning" | "muted" | "error"> = {
 pending: "warning",
 reviewing: "processing",
 approved: "success",
 repairing: "processing",
 ready: "success",
 delivered: "muted",
 rejected: "error",
};

export interface RepairRequest {
 id: string;
 trackingCode: string;
 firstName: string;
 lastName: string;
 mobileNumber: string;
 email?: string | null;
 brand: string;
 model: string;
 problemType: string;
 description: string;
 address?: string | null;
 status: RepairStatus;
 estimatedCost?: number | null;
 adminNote?: string | null;
 createdAt: Date;
 updatedAt: Date;
}

export interface CreateRepairRequestInput {
 firstName: string;
 lastName: string;
 mobileNumber: string;
 email?: string;
 brand: string;
 model: string;
 problemType: string;
 description: string;
 address?: string;
}

export interface UpdateRepairRequestInput {
 status?: RepairStatus;
 estimatedCost?: number;
 adminNote?: string;
}

export interface RepairRequestResult {
 success: boolean;
 data?: RepairRequest;
 trackingCode?: string;
 error?: string;
}

export interface RepairRequestListResult {
 success: boolean;
 data?: RepairRequest[];
 error?: string;
}