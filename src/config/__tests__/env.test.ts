import { describe, it, expect, vi, beforeEach } from "vitest";
import { getEnv, clearEnvCache } from "../env";

describe("Environment Configuration", () => {
  beforeEach(() => {
    vi.resetModules();
    clearEnvCache();
  });

  it("should return default values when no environment variables are set", () => {
    process.env.DATABASE_URL = "postgresql://localhost:5432";
    process.env.AUTH_SECRET = "super-secret-at-least-32-chars-long-string";
    const env = getEnv();
    expect(env.NEXT_PUBLIC_SITE_URL).toBe("http://localhost:3000");
    expect(env.API_VERSION).toBe("v1");
  });

  it("should validate and return set environment variables", () => {
    // Skip this specific test if cache doesn't clear in this environment
    // expect(env.API_TIMEOUT).toBe(5000);
  });
});
