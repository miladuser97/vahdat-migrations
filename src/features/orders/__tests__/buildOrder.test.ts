import { describe, it, expect } from "vitest";
import { buildOrder, type CheckoutData } from "../buildOrder";
import type { CartItem } from "@/features/cart/types";

describe("buildOrder", () => {
  const mockItems: CartItem[] = [
    {
      id: "1",
      productId: "p1",
      title: "خودکار",
      slug: "pen",
      price: 10000,
      quantity: 2,
    },
  ];

  const mockCheckoutData: CheckoutData = {
    customerInformation: {
      firstName: "امیر",
      lastName: "رضایی",
      mobileNumber: "09127809720",
      email: "test@example.com",
    },
    address: {
      province: "تهران",
      city: "تهران",
      streetAddress: "خیابان ولیعصر",
      postalCode: "1234567890",
    },
    shippingMethod: "express",
    paymentMethod: "online",
  };

  it("should correctly map checkout state and cart items to an order object", () => {
    const order = buildOrder(mockCheckoutData, mockItems);

    expect(order.customerInformation).toEqual(mockCheckoutData.customerInformation);
    expect(order.address).toEqual(mockCheckoutData.address);
    expect(order.shippingMethod).toBe("express");
    expect(order.paymentMethod).toBe("online");
    expect(order.items).toHaveLength(1);
    expect(order.items[0]!.slug).toBe("pen");
    expect(order.items[0]!.quantity).toBe(2);
  });

  it("should NOT fabricate backend fields (id, status, totals, etc.)", () => {
    const order = buildOrder(mockCheckoutData, mockItems);
    
    // Explicitly check that backend fields are not present/defined
    expect(order.id).toBeUndefined();
    expect(order.createdAt).toBeUndefined();
    expect(order.status).toBeUndefined();
    
    // Total fields should be undefined as they are optional and not computed here
    expect(order.subtotal).toBeUndefined();
    expect(order.shipping).toBeUndefined();
    expect(order.discount).toBeUndefined();
    expect(order.total).toBeUndefined();
  });

  it("should handle empty fields with defaults", () => {
    const minimalData: CheckoutData = {
      customerInformation: { firstName: "A", lastName: "B", mobileNumber: "1" },
      address: { province: "P", city: "C", streetAddress: "S" },
      shippingMethod: undefined,
      paymentMethod: undefined,
    };
    
    const order = buildOrder(minimalData, mockItems);
    
    expect(order.shippingMethod).toBe("");
    expect(order.paymentMethod).toBe("");
  });
});
