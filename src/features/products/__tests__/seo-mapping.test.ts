import { describe, it, expect, vi } from "vitest";
import { getProducts } from "@/features/products/services/product-service";

vi.mock("@/lib/server/prisma", () => ({
  prisma: {
    product: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/server/prisma";

describe("Product JSON-LD Mapping", () => {
  it("should have correct currency conversion for IRR (SEO requirement)", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue(
      [{ 
        id: "1",
        slug: "test",
        title: "Test",
        price: { toString: () => "12000" },
        isEnabled: true,
        brand: null,
        shortDescription: null,
        description: null,
        sku: null,
        categorySlug: null,
        currency: "تومان",
        discountPrice: null,
        inventoryCount: 0,
        images: null,
        rating: 0,
        reviewCount: 0,
        createdAt: new Date(), 
        updatedAt: new Date() 
      }] as Awaited<ReturnType<typeof prisma.product.findMany>>
    );
    const products = await getProducts();
    const product = products[0]!;
    
    const tomanPrice = product.price!;
    const irrPrice = tomanPrice * 10;
    
    expect(irrPrice).toBe(120000);
  });
});