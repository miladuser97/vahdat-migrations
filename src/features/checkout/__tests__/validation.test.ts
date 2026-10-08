import { describe, it, expect } from "vitest";
import {
  validateCustomerInformation,
  validateAddress,
  validateCheckout,
  VALIDATION_MESSAGES,
} from "../validation";

describe("Checkout Validation", () => {
  describe("validateCustomerInformation", () => {
    it("should return errors for empty fields", () => {
      const errors = validateCustomerInformation({});
      expect(errors.firstName).toBe(VALIDATION_MESSAGES.required);
      expect(errors.lastName).toBe(VALIDATION_MESSAGES.required);
      expect(errors.mobileNumber).toBe(VALIDATION_MESSAGES.required);
    });

    it("should return errors for whitespace-only fields", () => {
      const errors = validateCustomerInformation({
        firstName: "  ",
        lastName: "",
        mobileNumber: "\n",
      });
      expect(errors.firstName).toBe(VALIDATION_MESSAGES.required);
      expect(errors.lastName).toBe(VALIDATION_MESSAGES.required);
      expect(errors.mobileNumber).toBe(VALIDATION_MESSAGES.required);
    });

    it("should return no errors for valid fields", () => {
      const errors = validateCustomerInformation({
        firstName: "امیر",
        lastName: "رضایی",
        mobileNumber: "09127809720",
      });
      expect(Object.keys(errors)).toHaveLength(0);
    });
  });

  describe("validateAddress", () => {
    it("should return errors for empty fields", () => {
      const errors = validateAddress({});
      expect(errors.province).toBe(VALIDATION_MESSAGES.required);
      expect(errors.city).toBe(VALIDATION_MESSAGES.required);
      expect(errors.streetAddress).toBe(VALIDATION_MESSAGES.required);
    });

    it("should return no errors for valid fields", () => {
      const errors = validateAddress({
        province: "تهران",
        city: "تهران",
        streetAddress: "خیابان ولیعصر",
      });
      expect(Object.keys(errors)).toHaveLength(0);
    });
  });

  describe("validateCheckout", () => {
    const validCustomer = {
      firstName: "M",
      lastName: "R",
      mobileNumber: "1",
    };
    const validAddress = {
      province: "P",
      city: "C",
      streetAddress: "S",
    };

    it("should return isValid: true and data when all fields are valid", () => {
      const result = validateCheckout(
        validCustomer,
        validAddress,
        "express",
        "online"
      );
      expect(result.isValid).toBe(true);
      if (result.isValid) {
        expect(result.data.customerInformation).toEqual(validCustomer);
        expect(result.data.shippingMethod).toBe("express");
      }
    });

    it("should return isValid: false and errors when any field is invalid", () => {
      const result = validateCheckout(
        {},
        validAddress,
        undefined,
        "online"
      );
      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.errors.customerInformation.firstName).toBe(VALIDATION_MESSAGES.required);
        expect(result.errors.shippingMethod).toBe(VALIDATION_MESSAGES.required);
        // address was valid
        expect(Object.keys(result.errors.address)).toHaveLength(0);
      }
    });
  });
});
