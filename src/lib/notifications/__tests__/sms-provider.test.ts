import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sendSmsViaKavenegar } from "../sms-provider";
import { clearEnvCache } from "@/config/env";

describe("SMS provider — Kavenegar (Phase 5)", () => {
  beforeEach(() => {
    clearEnvCache();
    // getEnv() has a NODE_ENV==="test" fallback branch that ignores
    // whatever SMS_* vars are stubbed if DATABASE_URL/AUTH_SECRET
    // aren't already valid — stub them here so every test in this file
    // deterministically exercises the real EnvSchema.safeParse path
    // (and therefore actually picks up each test's own SMS_* stubs),
    // regardless of the ambient test-runner environment.
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

    const result = await sendSmsViaKavenegar("09120001122", "test message");

    expect(result.status).toBe("skipped");
    expect(result.success).toBe(false);
    // The whole point: no network call is made without configuration —
    // there is nothing to fake a response for.
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 'sent' only after the provider actually confirms acceptance", async () => {
    vi.stubEnv("SMS_API_KEY", "test-key");
    vi.stubEnv("SMS_SENDER_LINE", "30001122");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ return: { status: 200 }, entries: [{ messageid: 555, status: 1 }] }), { status: 200 })
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await sendSmsViaKavenegar("09120001122", "test message");

    expect(result).toMatchObject({ status: "sent", success: true, messageId: "555", attempts: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain("api.kavenegar.com");
    expect(url).toContain("test-key");
    expect(String(init.body)).toContain("receptor=09120001122");
  });

  it("does not retry a 4xx (non-transient) rejection", async () => {
    vi.stubEnv("SMS_API_KEY", "test-key");
    vi.stubEnv("SMS_SENDER_LINE", "30001122");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ return: { status: 400, message: "invalid receptor" } }), { status: 400 })
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await sendSmsViaKavenegar("invalid", "test message");

    expect(result.status).toBe("failed");
    expect(result.attempts).toBe(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries a 5xx (transient) failure and succeeds on the second attempt", async () => {
    vi.stubEnv("SMS_API_KEY", "test-key");
    vi.stubEnv("SMS_SENDER_LINE", "30001122");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("Internal Error", { status: 500 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ return: { status: 200 }, entries: [{ messageid: 1 }] }), { status: 200 })
      );
    vi.stubGlobal("fetch", fetchMock);

    const result = await sendSmsViaKavenegar("09120001122", "test message");

    expect(result.status).toBe("sent");
    expect(result.attempts).toBe(2);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("gives up as 'failed' after exhausting retries on a persistent 5xx", async () => {
    vi.stubEnv("SMS_API_KEY", "test-key");
    vi.stubEnv("SMS_SENDER_LINE", "30001122");
    const fetchMock = vi.fn().mockResolvedValue(new Response("Internal Error", { status: 500 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await sendSmsViaKavenegar("09120001122", "test message");

    expect(result.status).toBe("failed");
    expect(result.attempts).toBe(3); // 1 initial + 2 retries, per retry.ts's default delays
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("treats a network-level failure as retryable and eventually reports 'failed', never a fake success", async () => {
    vi.stubEnv("SMS_API_KEY", "test-key");
    vi.stubEnv("SMS_SENDER_LINE", "30001122");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("network error")));

    const result = await sendSmsViaKavenegar("09120001122", "test message");

    expect(result.status).toBe("failed");
    expect(result.success).toBe(false);
  });
});
