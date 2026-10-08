import { getEnv } from "@/config/env";
import { logger } from "../logger";
import { withRetry, type RetryableAttempt } from "./retry";
import { skipped, type NotificationResult } from "./types";

/**
 * SMS Provider — Kavenegar (isolated implementation)
 *
 * Phase 5: replaces the fake `sendSms` that previously returned a
 * hardcoded `messageId: "sms_prod_123"` / `"sms_sandbox_123"` without
 * ever making a network call, in every environment including
 * "production". This file is the *only* place in the codebase that
 * knows Kavenegar's request/response shape — business code (and even
 * notification-boundary.ts's business-facing functions) never imports
 * this module directly; everything goes through sendSms() below, which
 * notification-boundary.ts re-exports.
 *
 * Kavenegar's real REST API: POST to
 * https://api.kavenegar.com/v1/{API_KEY}/sms/send.json with
 * receptor/sender/message form fields. A 200 response with
 * `return.status === 200` means the message was accepted for sending —
 * that is what this file calls "sent"; Kavenegar does not return a
 * synchronous handset-delivery confirmation, so "sent" here means
 * "accepted by the provider," consistent with src/lib/notifications/types.ts.
 */

interface KavenegarResponse {
  return?: { status?: number; message?: string };
  entries?: Array<{ messageid?: number; status?: number; statustext?: string }>;
}

function isRetryableStatus(httpStatus: number): boolean {
  // Retry on network-level failure or server-side errors; never on 4xx
  // (bad request, invalid receptor, auth failure — retrying won't help).
  return httpStatus >= 500;
}

export async function sendSmsViaKavenegar(to: string, message: string): Promise<NotificationResult> {
  const env = getEnv();

  if (!env.SMS_API_KEY || !env.SMS_SENDER_LINE) {
    logger.warn("[Notification:SMS] Skipped — missing SMS_API_KEY or SMS_SENDER_LINE configuration");
    return skipped("SMS_PROVIDER_CONFIG_MISSING");
  }

  const url = `https://api.kavenegar.com/v1/${env.SMS_API_KEY}/sms/send.json`;
  const body = new URLSearchParams({
    receptor: to,
    sender: env.SMS_SENDER_LINE,
    message,
  });

  // Phase 8.5: see the identical fix and explanation in
  // email-provider.ts's Phase 8.5 comment — same root cause (a
  // multi-branch attempt callback with no explicit target type,
  // resolved by giving `withRetry` its type argument explicitly).
  const { result, attempts } = await withRetry<NotificationResult>(async (attemptNumber): Promise<RetryableAttempt<NotificationResult>> => {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });

      const httpStatus = response.status;
      const data = (await response.json().catch(() => null)) as KavenegarResponse | null;
      const providerStatus = data?.return?.status;

      if (response.ok && providerStatus === 200) {
        const messageId = data?.entries?.[0]?.messageid;
        return {
          outcome: {
            status: "sent" as const,
            success: true,
            attempts: attemptNumber,
            messageId: messageId !== undefined ? String(messageId) : undefined,
          },
        };
      }

      const retryable = isRetryableStatus(httpStatus);
      logger.warn(
        "[Notification:SMS] Provider rejected the request",
        { httpStatus, providerStatus, retryable, attempt: attemptNumber },
      );
      return {
        outcome: {
          status: "failed" as const,
          success: false,
          attempts: attemptNumber,
          error: `KAVENEGAR_ERROR_${providerStatus ?? httpStatus}`,
        },
        retryable,
      };
    } catch (networkError) {
      logger.warn(
        "[Notification:SMS] Network error contacting provider",
        { attempt: attemptNumber, error: networkError instanceof Error ? networkError.name : "unknown" },
      );
      return {
        outcome: {
          status: "failed" as const,
          success: false,
          attempts: attemptNumber,
          error: "SMS_NETWORK_ERROR",
        },
        retryable: true,
      };
    }
  });

  return { ...result, attempts };
}
