"use server";

import { prisma } from "./prisma";
import { logger } from "../logger";
import { getAuthenticatedUser } from "./auth-utils";

function isAdmin(user: { role: string } | null): boolean {
  if (!user) return false;
  return user.role === "admin" || user.role === "super_admin";
}

// ============================================================
// Types
// ============================================================

export interface CategoryListItem {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  order: number;
  visible: boolean;
  showInSlider: boolean;
  image: string | null;
  icon: string | null;
  color: string | null;
}

export type GetCategoriesListResult =
  | { success: true; data: CategoryListItem[] }
  | { success: false; error: string };

// ============================================================
// getCategoriesListAction — Server Action برای پنل ادمین
// ============================================================

export async function getCategoriesListAction(): Promise<GetCategoriesListResult> {
  const user = await getAuthenticatedUser();
  if (!isAdmin(user)) {
    return { success: false, error: "دسترسی غیرمجاز." };
  }

  try {
    const categories = await prisma.category.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        order: true,
        visible: true,
        showInSlider: true,
        image: true,
        icon: true,
        color: true,
      },
    });

    return { success: true, data: categories };
  } catch (error) {
    logger.error("[Admin:Categories] List failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return { success: false, error: "خطا در بارگذاری دسته‌بندی‌ها." };
  }
}