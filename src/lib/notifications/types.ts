/**
 * Notification Types
 *
 * Phase 5: shared vocabulary for every provider and every business-facing
 * notification function, so a caller (commerce-actions.ts,
 * auth-actions.ts, account-actions.ts, admin-actions.ts) always gets the
 * same shape back regardless of which channel (SMS/email) or which
 * provider handled the send.
 */

/**
 * - "sent": the provider accepted the message (its own API confirmed
 *   receipt). This is *not* a delivery-to-handset/inbox confirmation —
 *   no provider used here exposes that synchronously — it means "hand-off
 *   to the provider succeeded," which is the same thing most systems mean
 *   by "sent."
 * - "pending": a transient failure occurred and a retry is in progress.
 *   Never a final state returned to a caller — if you see "pending" in a
 *   final NotificationResult, that's a bug (should have resolved to
 *   "sent" or "failed" by the time the retry loop finishes).
 * - "failed": the provider was reached but rejected the request, or every
 *   retry attempt was exhausted.
 * - "skipped": no attempt was made at all, because required configuration
 *   (API key, sender identity) is missing. This is the honest replacement
 *   for the old behavior of silently returning a fake success.
 */
export type NotificationStatus = "sent" | "pending" | "failed" | "skipped";

export interface NotificationResult {
  status: NotificationStatus;
  /** True only when status === "sent". Kept alongside `status` (not
   * derived by every caller) so existing call sites that only care about
   * a boolean don't need to know the full status vocabulary. */
  success: boolean;
  messageId?: string;
  error?: string;
  /** Number of attempts made against the provider (1 = no retry needed). */
  attempts: number;
}

export function skipped(reason: string): NotificationResult {
  return { status: "skipped", success: false, error: reason, attempts: 0 };
}
