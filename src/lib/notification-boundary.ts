import { logger } from "./logger";
import { sendSmsViaKavenegar } from "./notifications/sms-provider";
import { sendEmailViaResend, type EmailPayload } from "./notifications/email-provider";
import type { NotificationResult } from "./notifications/types";

/**
 * Notification Boundary (Phase 197, rebuilt Phase 5)
 *
 * The single door business code (commerce-actions.ts, auth-actions.ts,
 * account-actions.ts, admin-actions.ts) goes through to send anything —
 * none of those files import src/lib/notifications/sms-provider.ts or
 * email-provider.ts directly, and none of them know Kavenegar or Resend
 * exist. That isolation is enforced by convention (this is the only
 * file that imports the provider modules), not by a runtime check.
 *
 * Phase 5 replaced the previous implementation, which — in EVERY
 * environment, including when NODE_ENV === "production" — returned a
 * hardcoded `{ success: true, messageId: "sms_prod_123" }` /
 * `"email_prod_123"` without ever making a network request. No
 * function in this file can return `success: true` / `status: "sent"`
 * without a real provider having actually confirmed it — see
 * notifications/sms-provider.ts and notifications/email-provider.ts.
 *
 * Logging in this file (and the provider files) never includes a
 * phone number, email address, or message body/subject — only
 * operational metadata (status, provider error codes, order ids,
 * correlation ids). See the module comment in logger.ts for what it
 * does and does not redact; this file works within that by simply
 * never passing PII into a log call in the first place.
 */

export async function sendSms(to: string, message: string): Promise<NotificationResult> {
  return sendSmsViaKavenegar(to, message);
}

export async function sendEmail(payload: EmailPayload): Promise<NotificationResult> {
  return sendEmailViaResend(payload);
}

function logOutcome(event: string, result: NotificationResult, correlationId?: string) {
  if (result.status === "sent") {
    logger.info(`[Notification:${event}] sent`, { attempts: result.attempts }, correlationId);
  } else {
    // Phase 5: failures/skips are never silently swallowed — every
    // non-"sent" outcome is logged at warn level with a reason code,
    // even though (by design) the caller's own business action still
    // succeeds independently of notification delivery.
    logger.warn(
      `[Notification:${event}] ${result.status}`,
      { attempts: result.attempts, reason: result.error },
      correlationId,
    );
  }
}

// ---------------------------------------------------------------------------
// Business-facing notifications — one function per real business event.
// Each of these is what commerce-actions.ts / auth-actions.ts /
// account-actions.ts / admin-actions.ts actually calls.
// ---------------------------------------------------------------------------

/**
 * Fires once a payment is verified and the order transitions to "paid"
 * (see handlePaymentCallbackAction in commerce-actions.ts — the only
 * code path that can call this, unchanged this phase). Doubles as the
 * "order confirmation" notification: in this app orders aren't
 * considered real until paid (see Phase 2's order-state model), so a
 * separate order-creation-time message would fire for draft/abandoned
 * carts — deliberately not added, to avoid a second, premature message.
 */
export async function notifyOrderSuccess(mobile: string, orderId: string): Promise<NotificationResult> {
  const message = `سفارش شما با شماره ${orderId} با موفقیت ثبت شد. تحریرینو`;
  const result = await sendSms(mobile, message);
  logOutcome("OrderPaid", result, orderId);
  return result;
}

/** Fires when an admin advances an order to "shipped" (admin-actions.ts). */
export async function notifyOrderShipped(mobile: string, orderId: string): Promise<NotificationResult> {
  const message = `سفارش شما با شماره ${orderId} ارسال شد. تحریرینو`;
  const result = await sendSms(mobile, message);
  logOutcome("OrderShipped", result, orderId);
  return result;
}

/** Fires when an admin advances an order to "delivered" (admin-actions.ts). */
export async function notifyOrderDelivered(mobile: string, orderId: string): Promise<NotificationResult> {
  const message = `سفارش شما با شماره ${orderId} تحویل داده شد. از خرید شما متشکریم. تحریرینو`;
  const result = await sendSms(mobile, message);
  logOutcome("OrderDelivered", result, orderId);
  return result;
}

/** Fires once after successful registration (auth-actions.ts). */
export async function notifyRegistrationWelcome(mobile: string, firstName: string): Promise<NotificationResult> {
  const message = `${firstName} عزیز، به تحریرینو خوش آمدید!`;
  const result = await sendSms(mobile, message);
  logOutcome("RegistrationWelcome", result);
  return result;
}

/**
 * Fires after a successful password change (account-actions.ts), which
 * already invalidates every session — this is the security-notice
 * companion to that: if the person didn't make the change, this is
 * their signal something is wrong.
 */
export async function notifyPasswordChanged(mobile: string): Promise<NotificationResult> {
  const message = `رمز عبور حساب کاربری شما در تحریرینو تغییر یافت. اگر شما این تغییر را انجام نداده‌اید، فوراً با پشتیبانی تماس بگیرید.`;
  const result = await sendSms(mobile, message);
  logOutcome("PasswordChanged", result);
  return result;
}
