import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sendEmailViaResend } from "../email-provider";
import { clearEnvCache } from "@/config/env";

describe("Email provider — Resend (Phase 5)", () => {
  beforeEach(() => {
    clearEnvCache();
    // See sms-provider.test.ts for why DATABASE_URL/AUTH_SECRET are
    // stubbed here — ensures getEnv() actually reads this file's
    // EMAIL_* stubs instead of taking its NODE_ENV==="test" shortcut.
    vi.stubEnv("DATABASE_URL", "postgresql://localhost:5432/test");
    vi.stubEnv("AUTH_SECRET", "x".repeat(32));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    clearEnvCache();
  });

  it("returns 'skipped' — not a fake success — when configuration is missing", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await sendEmailViaResend({ to: "a@example.com", subject: "s", html: "<p>b</p>" });

    expect(result.status).toBe("skipped");
    expect(result.success).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 'sent' only after Resend actually confirms with a message id", async () => {
    vi.stubEnv("EMAIL_API_KEY", "test-key");
    vi.stubEnv("EMAIL_FROM_ADDRESS", "orders@tahririno.example");
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: "email_123" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await sendEmailViaResend({ to: "a@example.com", subject: "s", html: "<p>b</p>" });

    expect(result).toMatchObject({ status: "sent", success: true, messageId: "email_123", attempts: 1 });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.headers.Authorization).toBe("Bearer test-key");
    const body = JSON.parse(init.body);
    expect(body).toMatchObject({ from: "orders@tahririno.example", to: "a@example.com", subject: "s" });
  });

  it("does not retry a 4xx rejection", async () => {
    vi.stubEnv("EMAIL_API_KEY", "test-key");
    vi.stubEnv("EMAIL_FROM_ADDRESS", "orders@tahririno.example");
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: "invalid" }), { status: 422 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await sendEmailViaResend({ to: "bad", subject: "s", html: "b" });

    expect(result.status).toBe("failed");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries a 5xx failure and succeeds on the second attempt", async () => {
    vi.stubEnv("EMAIL_API_KEY", "test-key");
    vi.stubEnv("EMAIL_FROM_ADDRESS", "orders@tahririno.example");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("error", { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: "email_456" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await sendEmailViaResend({ to: "a@example.com", subject: "s", html: "b" });

    expect(result.status).toBe("sent");
    expect(result.attempts).toBe(2);
  });
});
