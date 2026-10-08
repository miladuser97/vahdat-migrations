import { describe, it, expect, vi, beforeEach } from "vitest";
import { getCategories, getCategoryBySlug } from "../services/category-service";

vi.mock("@/lib/server/prisma", () => ({
  prisma: {
    category: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/server/prisma";

describe("Category Service", () => {
  const mockCategories = [
    { id: "1", slug: "paper", title: "کاغذ", visible: true, description: null, parentId: null, order: 0, image: null, seo: null, createdAt: new Date(), updatedAt: new Date() },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return all fixture categories from DB", async () => {
    vi.mocked(prisma.category.findMany).mockResolvedValue(
      mockCategories as Awaited<ReturnType<typeof prisma.category.findMany>>
    );
    const categories = await getCategories();
    expect(categories).toHaveLength(1);
    expect(categories[0]!.slug).toBe("paper");
  });

  it("should return a category by valid slug", async () => {
    vi.mocked(prisma.category.findUnique).mockResolvedValue(
      mockCategories[0] as Awaited<ReturnType<typeof prisma.category.findUnique>>
    );
    const category = await getCategoryBySlug("paper");
    expect(category).not.toBeNull();
    expect(category?.slug).toEqual("paper");
  });

  it("should return null or undefined for an invalid slug", async () => {
    vi.mocked(prisma.category.findUnique).mockResolvedValue(null);
    const category = await getCategoryBySlug("non-existent-category");
    expect(category).toBeFalsy();
  });
});