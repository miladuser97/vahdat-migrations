/**
 * Retry helper for notification providers.
 *
 * Phase 5: only retries transient failures (network errors, 5xx
 * responses) — never 4xx responses (bad recipient, invalid payload,
 * auth failure), since retrying those wastes an attempt on something
 * that will never succeed. Isolated here so both providers (SMS/email)
 * share one retry policy instead of each re-implementing backoff.
 */

export interface RetryableAttempt<T> {
  outcome: T;
  /** Set by the attempt function to signal "this failure is transient,
   * try again" — if false/omitted, withRetry stops immediately. */
  retryable?: boolean;
}

const DEFAULT_DELAYS_MS = [300, 900];

export async function withRetry<T>(
  attempt: (attemptNumber: number) => Promise<RetryableAttempt<T>>,
  delaysMs: number[] = DEFAULT_DELAYS_MS
): Promise<{ result: T; attempts: number }> {
  let lastResult: T;

  for (let i = 0; i <= delaysMs.length; i++) {
    const attemptNumber = i + 1;
    const { outcome, retryable } = await attempt(attemptNumber);
    lastResult = outcome;

    const isLastAttempt = i === delaysMs.length;
    if (!retryable || isLastAttempt) {
      return { result: lastResult, attempts: attemptNumber };
    }

    await new Promise((resolve) => setTimeout(resolve, delaysMs[i]));
  }

  // Unreachable: the loop above always returns on its final iteration
  // (`isLastAttempt` becomes true exactly when `i === delaysMs.length`,
  // which the loop condition `i <= delaysMs.length` always reaches).
  // Throwing here — rather than returning `lastResult!` with a
  // non-null assertion the type system genuinely cannot verify —
  // means this function never asserts something it can't prove; if
  // this line is ever actually reached, that's a real logic bug worth
  // surfacing loudly, not silently working around.
  throw new Error("withRetry: reached unreachable state");
}
