import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach } from "vitest";
import { clearEnvCache } from "@/config/env";

// Automatically cleanup after each test case
afterEach(() => {
  cleanup();
  if (typeof window !== "undefined") {
    localStorage.clear();
  }
});

beforeEach(() => {
  process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/test?schema=public";
  process.env.AUTH_SECRET = "super-secret-at-least-32-chars-long-string";
  process.env.NEXT_PUBLIC_API_URL = "http://localhost:3000/api";
  process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";
  // Reset env cache between tests to ensure variables are picked up
  clearEnvCache();
});
