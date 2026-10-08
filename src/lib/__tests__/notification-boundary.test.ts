import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  notifyOrderSuccess,
  notifyOrderShipped,
  notifyOrderDelivered,
  notifyRegistrationWelcome,
  notifyPasswordChanged,
} from "../notification-boundary";
import { sendSmsViaKavenegar } from "../notifications/sms-provider";

vi.mock("../notifications/sms-provider", () => ({
  sendSmsViaKavenegar: vi.fn(),
}));
vi.mock("../notifications/email-provider", () => ({
  sendEmailViaResend: vi.fn(),
}));

const SENT = { status: "sent" as const, success: true, attempts: 1, messageId: "m1" };
const FAILED = { status: "failed" as const, success: false, attempts: 3, error: "SMS_NETWORK_ERROR" };
const SKIPPED = { status: "skipped" as const, success: false, attempts: 0, error: "SMS_PROVIDER_CONFIG_MISSING" };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("notification-boundary — business-facing events (Phase 5)", () => {
  it("notifyOrderSuccess sends a real SMS through the provider boundary and returns its real result", async () => {
    (sendSmsViaKavenegar as any).mockResolvedValue(SENT);

    const result = await notifyOrderSuccess("09120001122", "order-1");

    expect(result).toEqual(SENT);
    expect(sendSmsViaKavenegar).toHaveBeenCalledWith("09120001122", expect.stringContaining("order-1"));
  });

  it("notifyOrderSuccess propagates a failed result rather than reporting success", async () => {
    (sendSmsViaKavenegar as any).mockResolvedValue(FAILED);

    const result = await notifyOrderSuccess("09120001122", "order-1");

    expect(result.status).toBe("failed");
    expect(result.success).toBe(false);
  });

  it("notifyOrderSuccess propagates a skipped result when configuration is missing, never fabricating success", async () => {
    (sendSmsViaKavenegar as any).mockResolvedValue(SKIPPED);

    const result = await notifyOrderSuccess("09120001122", "order-1");

    expect(result.status).toBe("skipped");
    expect(result.success).toBe(false);
  });

  it("notifyOrderShipped and notifyOrderDelivered send distinct messages", async () => {
    (sendSmsViaKavenegar as any).mockResolvedValue(SENT);

    await notifyOrderShipped("09120001122", "order-2");
    await notifyOrderDelivered("09120001122", "order-2");

    const [shippedCall, deliveredCall] = (sendSmsViaKavenegar as any).mock.calls;
    expect(shippedCall[1]).not.toBe(deliveredCall[1]);
    expect(shippedCall[1]).toContain("ارسال شد");
    expect(deliveredCall[1]).toContain("تحویل داده شد");
  });

  it("notifyRegistrationWelcome and notifyPasswordChanged each call the SMS boundary exactly once", async () => {
    (sendSmsViaKavenegar as any).mockResolvedValue(SENT);

    await notifyRegistrationWelcome("09120001122", "علی");
    await notifyPasswordChanged("09120001122");

    expect(sendSmsViaKavenegar).toHaveBeenCalledTimes(2);
  });
});
