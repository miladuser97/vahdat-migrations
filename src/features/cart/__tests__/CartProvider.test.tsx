import { renderHook, act } from "@testing-library/react";
import { CartProvider, useCart } from "../CartProvider";
import { describe, it, expect, beforeEach } from "vitest";
import React from "react";
import type { CartItem } from "../types";

// Helper to wrap hook with provider
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <CartProvider>{children}</CartProvider>
);

describe("CartProvider", () => {
  const mockProduct: CartItem = {
    id: "1",
    productId: "p1",
    title: "Product 1",
    slug: "product-1",
    price: 100,
    quantity: 1,
  };

  beforeEach(() => {
    localStorage.clear();
  });

  it("should start with an empty cart", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    expect(result.current.items).toEqual([]);
  });

  it("should add a new item to the cart", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    
    act(() => {
      result.current.addItem(mockProduct);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]!.quantity).toBe(1);
  });

  it("should increment quantity if same item is added again", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    
    act(() => {
      result.current.addItem(mockProduct);
    });
    act(() => {
      result.current.addItem(mockProduct);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]!.quantity).toBe(2);
  });

  it("should update item quantity", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    
    act(() => {
      result.current.addItem(mockProduct);
      result.current.updateQuantity("1", 5);
    });

    expect(result.current.items[0]!.quantity).toBe(5);
  });

  it("should remove item if quantity set to less than 1", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    
    act(() => {
      result.current.addItem(mockProduct);
      result.current.updateQuantity("1", 0);
    });

    expect(result.current.items).toHaveLength(0);
  });

  it("should remove items from the cart", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    
    act(() => {
      result.current.addItem(mockProduct);
      result.current.removeItem("1");
    });

    expect(result.current.items).toHaveLength(0);
  });

  it("should clear the cart", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    
    act(() => {
      result.current.addItem(mockProduct);
      result.current.addItem({ ...mockProduct, id: "2" });
      result.current.clearCart();
    });

    expect(result.current.items).toHaveLength(0);
  });

  it("should handle invalid quantity updates by clamping or removal", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    
    act(() => {
      result.current.addItem(mockProduct);
    });

    // Zero quantity removes item
    act(() => {
      result.current.updateQuantity("1", 0);
    });
    expect(result.current.items).toHaveLength(0);

    // Negative quantity removes item (as it is < 1)
    act(() => {
      result.current.addItem(mockProduct);
      result.current.updateQuantity("1", -5);
    });
    expect(result.current.items).toHaveLength(0);

    // Non-integer quantity is floored
    act(() => {
      result.current.addItem(mockProduct);
      result.current.updateQuantity("1", 5.7);
    });
    expect(result.current.items[0]!.quantity).toBe(5);
  });

  it("should handle invalid quantities in addItem", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    
    act(() => {
      result.current.addItem({ ...mockProduct, quantity: -5 });
    });
    // Should be clamped to 1
    expect(result.current.items[0]!.quantity).toBe(1);

    act(() => {
      result.current.clearCart();
      result.current.addItem({ ...mockProduct, quantity: 2.9 });
    });
    // Should be floored to 2
    expect(result.current.items[0]!.quantity).toBe(2);
  });
});
