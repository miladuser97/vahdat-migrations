"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { OrderAddress, OrderCustomerInformation } from "@/features/orders/types";

// ============================================================
// کلیدهای ذخیره‌سازی در localStorage
// ============================================================

const STORAGE_KEYS = {
  customerInformation: "vahdat_checkout_customer",
  address: "vahdat_checkout_address",
  shippingMethod: "vahdat_checkout_shipping",
  paymentMethod: "vahdat_checkout_payment",
};

export interface CheckoutContextValue {
  customerInformation: Partial<OrderCustomerInformation>;
  updateCustomerInformation: (patch: Partial<OrderCustomerInformation>) => void;
  address: Partial<OrderAddress>;
  updateAddress: (patch: Partial<OrderAddress>) => void;
  shippingMethod: string | undefined;
  setShippingMethod: (value: string) => void;
  paymentMethod: string | undefined;
  setPaymentMethod: (value: string) => void;
  showAllErrors: boolean;
  setShowAllErrors: (value: boolean) => void;
  clearCheckout: () => void;
}

const CheckoutContext = createContext<CheckoutContextValue | undefined>(undefined);

// ============================================================
// توابع کمکی برای ذخیره و بارگذاری
// ============================================================

function loadFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // اگر storage پر بود، نادیده بگیر
  }
}

/**
 * CheckoutProvider
 * One responsibility: hold the checkout form fields (customer
 * information, address, selected shipping method, selected payment
 * method) as real React state, so CustomerInformationSection,
 * AddressSection, ShippingSection, and PaymentSection read/write one
 * shared place instead of each being an island of uncontrolled,
 * unreadable DOM state.
 *
 * ✅ اصلاح شده: اطلاعات در localStorage ذخیره میشه تا بعد از Refresh از بین نره
 */
export function CheckoutProvider({ children }: { children: ReactNode }) {
  // ============================================================
  // بارگذاری اطلاعات از localStorage
  // ============================================================
  const [customerInformation, setCustomerInformation] = useState<Partial<OrderCustomerInformation>>(() =>
    loadFromStorage(STORAGE_KEYS.customerInformation, {})
  );
  const [address, setAddress] = useState<Partial<OrderAddress>>(() =>
    loadFromStorage(STORAGE_KEYS.address, {})
  );
  const [shippingMethod, setShippingMethod] = useState<string | undefined>(() =>
    loadFromStorage(STORAGE_KEYS.shippingMethod, undefined)
  );
  const [paymentMethod, setPaymentMethod] = useState<string | undefined>(() =>
    loadFromStorage(STORAGE_KEYS.paymentMethod, undefined)
  );
  const [showAllErrors, setShowAllErrors] = useState(false);

  // ============================================================
  // ذخیره خودکار در localStorage
  // ============================================================
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.customerInformation, customerInformation);
  }, [customerInformation]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.address, address);
  }, [address]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.shippingMethod, shippingMethod);
  }, [shippingMethod]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.paymentMethod, paymentMethod);
  }, [paymentMethod]);

  const updateCustomerInformation = useCallback((patch: Partial<OrderCustomerInformation>) => {
    setCustomerInformation((current) => ({ ...current, ...patch }));
  }, []);

  const updateAddress = useCallback((patch: Partial<OrderAddress>) => {
    setAddress((current) => ({ ...current, ...patch }));
  }, []);

  // ============================================================
  // پاک کردن اطلاعات (بعد از ثبت موفق سفارش)
  // ============================================================
  const clearCheckout = useCallback(() => {
    setCustomerInformation({});
    setAddress({});
    setShippingMethod(undefined);
    setPaymentMethod(undefined);
    // پاک کردن از localStorage
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
  }, []);

  const value = useMemo(
    () => ({
      customerInformation,
      updateCustomerInformation,
      address,
      updateAddress,
      shippingMethod,
      setShippingMethod,
      paymentMethod,
      setPaymentMethod,
      showAllErrors,
      setShowAllErrors,
      clearCheckout,
    }),
    [
      customerInformation,
      updateCustomerInformation,
      address,
      updateAddress,
      shippingMethod,
      paymentMethod,
      showAllErrors,
      clearCheckout,
    ],
  );

  return <CheckoutContext.Provider value={value}>{children}</CheckoutContext.Provider>;
}

export function useCheckout(): CheckoutContextValue {
  const context = useContext(CheckoutContext);
  if (!context) {
    throw new Error("useCheckout must be used within a CheckoutProvider");
  }
  return context;
}