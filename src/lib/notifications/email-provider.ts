import { getEnv } from "@/config/env";
import { logger } from "../logger";
import { withRetry, type RetryableAttempt } from "./retry";
import { skipped, type NotificationResult } from "./types";

/**
 * Email Provider — Resend (isolated implementation)
 *
 * Phase 5: replaces two fake implementations that both existed before
 * this phase (src/lib/notification-boundary.ts's `sendEmail`, and the
 * separate, entirely-unreachable src/lib/email/provider.ts, deleted
 * this phase) — neither ever made a real request. This file is the
 * only place that knows Resend's request/response shape; business code
 * and notification-boundary.ts's business-facing functions go through
 * sendEmail() below, never this module directly.
 */

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

function isRetryableStatus(httpStatus: number): boolean {
  return httpStatus >= 500;
}

export async function sendEmailViaResend(payload: EmailPayload): Promise<NotificationResult> {
  const env = getEnv();

  if (!env.EMAIL_API_KEY || !env.EMAIL_FROM_ADDRESS) {
    logger.warn("[Notification:Email] Skipped — missing EMAIL_API_KEY or EMAIL_FROM_ADDRESS configuration");
    return skipped("EMAIL_PROVIDER_CONFIG_MISSING");
  }

  // Phase 8.5: `withRetry`'s type parameter is given explicitly here
  // (`<NotificationResult>`) instead of being left to inference from
  // this callback alone. The callback below has three separate
  // `return { outcome: {...} }` statements — one "sent" shape, two
  // "failed" shapes — and with no explicit target type, TypeScript's
  // generic inference tried to settle on a single shape from them
  // (effectively just the first one seen), rather than the real
  // sent-or-failed union every branch actually needs to satisfy. The
  // explicit type argument (reinforced by the callback's own return
  // type annotation) means every branch is checked against the same
  // real target — `NotificationResult` — instead of being inferred.
  const { result, attempts } = await withRetry<NotificationResult>(async (attemptNumber): Promise<RetryableAttempt<NotificationResult>> => {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.EMAIL_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: env.EMAIL_FROM_ADDRESS,
          to: payload.to,
          subject: payload.subject,
          html: payload.html,
        }),
      });

      const httpStatus = response.status;
      const data = (await response.json().catch(() => null)) as { id?: string; message?: string } | null;

      if (response.ok && data?.id) {
        return {
          outcome: {
            status: "sent" as const,
            success: true,
            attempts: attemptNumber,
            messageId: data.id,
          },
        };
      }

      const retryable = isRetryableStatus(httpStatus);
      logger.warn(
        "[Notification:Email] Provider rejected the request",
        { httpStatus, retryable, attempt: attemptNumber },
      );
      return {
        outcome: {
          status: "failed" as const,
          success: false,
          attempts: attemptNumber,
          error: `RESEND_ERROR_${httpStatus}`,
        },
        retryable,
      };
    } catch (networkError) {
      logger.warn(
        "[Notification:Email] Network error contacting provider",
        { attempt: attemptNumber, error: networkError instanceof Error ? networkError.name : "unknown" },
      );
      return {
        outcome: {
          status: "failed" as const,
          success: false,
          attempts: attemptNumber,
          error: "EMAIL_NETWORK_ERROR",
        },
        retryable: true,
      };
    }
  });

  return { ...result, attempts };
}
