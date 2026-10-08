import { afterEach, describe, expect, it, vi } from "vitest";
import { initiatePayment, verifyPayment } from "../payment-boundary";

describe("ZarinPal payment boundary", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("requests a real authority and converts Toman to Rial", async () => {
    vi.stubEnv("ZARINPAL_MERCHANT_ID", "merchant-test");
    vi.stubEnv("ZARINPAL_CALLBACK_URL", "https://example.test/api/payment/callback");
    vi.stubEnv("ZARINPAL_SANDBOX", "true");
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: { code: 100, authority: "A000000000000000000000000001" } }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await initiatePayment({ orderId: "order-1", amount: 125000 });

    expect(result.id).toBe("A000000000000000000000000001");
    expect(result.amount).toBe(1250000);
    expect(result.paymentUrl).toContain("sandbox.zarinpal.com/pg/StartPay/");
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.amount).toBe(1250000);
    expect(body.callback_url).toContain("orderId=order-1");
  });

  it("verifies against ZarinPal and returns the provider reference id", async () => {
    vi.stubEnv("ZARINPAL_MERCHANT_ID", "merchant-test");
    vi.stubEnv("ZARINPAL_CALLBACK_URL", "https://example.test/api/payment/callback");
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: { code: 100, ref_id: 987654, card_hash: "hash" } }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await verifyPayment("A000000000000000000000000001", 125000);

    expect(result).toEqual({ success: true, transactionId: "987654", cardHash: "hash" });
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body).toMatchObject({ merchant_id: "merchant-test", amount: 1250000, authority: "A000000000000000000000000001" });
  });

  it("rejects provider failure instead of fabricating success", async () => {
    vi.stubEnv("ZARINPAL_MERCHANT_ID", "merchant-test");
    vi.stubEnv("ZARINPAL_CALLBACK_URL", "https://example.test/api/payment/callback");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: { code: -9, message: "failed" } }), { status: 200 })));

    const result = await verifyPayment("A000000000000000000000000001", 125000);
    expect(result.success).toBe(false);
    expect(result.error).toBe("failed");
  });
});
