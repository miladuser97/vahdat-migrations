import { z } from "zod";

/**
 * ZarinPal v4 payment provider boundary.
 * Database amounts are Toman; ZarinPal amounts are Rial.
 * Never treats a locally generated value as a successful payment.
 */

const ZARINPAL_API_BASE = "https://payment.zarinpal.com/pg/v4/payment";
const ZARINPAL_SANDBOX_API_BASE = "https://sandbox.zarinpal.com/pg/v4/payment";
const DEFAULT_TIMEOUT_MS = 10_000;

export const PaymentIntentSchema = z.object({
  id: z.string().min(1),
  amount: z.number().int().positive(),
  currency: z.literal("IRR"),
  paymentUrl: z.string().url(),
});

export type PaymentIntent = z.infer<typeof PaymentIntentSchema>;

export interface PaymentRequest {
  orderId: string;
  amount: number;
  mobile?: string;
  email?: string;
  description?: string;
}

interface ZarinPalRequestResponse {
  data?: {
    code?: number;
    message?: string;
    authority?: string;
    fee_type?: string;
    fee?: number;
  };
  errors?: unknown;
}

interface ZarinPalVerifyResponse {
  data?: {
    code?: number;
    message?: string;
    ref_id?: number;
    card_hash?: string;
    fee_type?: string;
    fee?: number;
  };
  errors?: unknown;
}

function getApiBase(): string {
  return process.env.ZARINPAL_SANDBOX === "true"
    ? ZARINPAL_SANDBOX_API_BASE
    : ZARINPAL_API_BASE;
}

function getMerchantId(): string {
  const merchantId = process.env.ZARINPAL_MERCHANT_ID?.trim();
  if (!merchantId) throw new Error("ZARINPAL_MERCHANT_ID is not configured");
  return merchantId;
}

function getCallbackUrl(orderId: string): string {
  const callbackUrl = process.env.ZARINPAL_CALLBACK_URL?.trim();
  if (!callbackUrl) throw new Error("ZARINPAL_CALLBACK_URL is not configured");
  const url = new URL(callbackUrl);
  url.searchParams.set("orderId", orderId);
  return url.toString();
}

function toRial(amountToman: number): number {
  if (!Number.isFinite(amountToman) || !Number.isInteger(amountToman) || amountToman <= 0) {
    throw new Error("Payment amount must be a positive integer amount in Toman");
  }
  const amountIrr = amountToman * 10;
  if (!Number.isSafeInteger(amountIrr)) throw new Error("Payment amount exceeds safe integer range");
  return amountIrr;
}

function getErrorMessage(value: unknown): string {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return "Unknown ZarinPal error";
  }
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
      cache: "no-store",
    });
    const text = await response.text();
    let parsed: unknown;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      throw new Error(`ZarinPal returned non-JSON response (HTTP ${response.status})`);
    }
    if (!response.ok) throw new Error(`ZarinPal HTTP ${response.status}: ${getErrorMessage(parsed)}`);
    return parsed as T;
  } finally {
    clearTimeout(timeout);
  }
}

export async function initiatePayment(request: PaymentRequest): Promise<PaymentIntent> {
  const merchantId = getMerchantId();
  const amountIrr = toRial(request.amount);
  const callbackUrl = getCallbackUrl(request.orderId);

  const payload = {
    merchant_id: merchantId,
    amount: amountIrr,
    callback_url: callbackUrl,
    description: request.description || `Tahririno order ${request.orderId}`,
    metadata: {
      ...(request.mobile ? { mobile: request.mobile } : {}),
      ...(request.email ? { email: request.email } : {}),
    },
  };

  const result = await postJson<ZarinPalRequestResponse>(`${getApiBase()}/request.json`, payload);
  const data = result.data;

  if (!data || data.code !== 100 || !data.authority) {
    throw new Error(`ZarinPal payment request failed: ${data?.message || getErrorMessage(result.errors)}`);
  }

  const paymentUrl = `${process.env.ZARINPAL_SANDBOX === "true" ? "https://sandbox.zarinpal.com/pg/StartPay/" : "https://www.zarinpal.com/pg/StartPay/"}${data.authority}`;
  return PaymentIntentSchema.parse({ id: data.authority, amount: amountIrr, currency: "IRR", paymentUrl });
}

export async function verifyPayment(
  authority: string,
  amountToman: number,
): Promise<{ success: boolean; transactionId?: string; cardHash?: string; error?: string }> {
  if (!authority || authority.length > 64) return { success: false, error: "Invalid payment authority" };

  const merchantId = getMerchantId();
  const amountIrr = toRial(amountToman);

  const result = await postJson<ZarinPalVerifyResponse>(`${getApiBase()}/verify.json`, {
    merchant_id: merchantId,
    amount: amountIrr,
    authority,
  });

  const data = result.data;
  if (data?.code === 100 || data?.code === 101) {
    if (data.ref_id === undefined || data.ref_id === null) {
      return { success: false, error: "ZarinPal verification returned no reference ID" };
    }
    return {
      success: true,
      transactionId: String(data.ref_id),
      cardHash: data.card_hash,
    };
  }

  return { success: false, error: data?.message || getErrorMessage(result.errors) };
}
