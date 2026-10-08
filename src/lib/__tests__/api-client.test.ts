import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiClient, ApiError } from "../api-client";
import { z } from "zod";

describe("apiClient", () => {
  const mockSchema = z.object({ success: z.boolean() });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should throw ApiError on network failure", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network Error"));

    await expect(apiClient("/test", mockSchema, { retries: 0 }))
      .rejects.toThrow(ApiError);
  });

  it("should throw ApiError with status on non-2xx response", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ message: "Not Found" }),
    });

    try {
      await apiClient("/test", mockSchema, { retries: 0 });
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      if (error instanceof ApiError) {
        expect(error.status).toBe(404);
        expect(error.message).toBe("Not Found");
      }
    }
  });

  it("should throw ApiError on validation failure", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: "not a boolean" }),
    });

    await expect(apiClient("/test", mockSchema, { retries: 0 }))
      .rejects.toThrow("Invalid response format from server");
  });
});
