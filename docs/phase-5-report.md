# Tahririno — Phase 5 Report: Notifications (SMS / Email / User Messaging)

**Scope:** Notification subsystem only. Payment, Checkout, Inventory, Authentication, Authorization, RBAC, and `prisma/schema.prisma` were not modified beyond four narrow, explicitly-justified exceptions (one line each) detailed in §5 and §6 — every one of them adds a notification call after an already-successful business event, and touches nothing else in the surrounding function.

---

## 1. Executive Summary

Before this phase, Tahririno's notification system was two separate fake implementations. `notification-boundary.ts`'s `sendSms`/`sendEmail` returned a hardcoded `messageId` in **every environment, including when `NODE_ENV === "production"`**, without ever making a network request. A second, entirely dead file, `src/lib/email/provider.ts`, duplicated the email boundary with a different interface and zero callers. The only notification that ever actually fired in production was an SMS on successful payment (`notifyOrderSuccess`, called from Phase 2's `handlePaymentCallbackAction`) — and even that call's result was discarded: a failed or skipped send was indistinguishable from a successful one to the caller.

This phase replaced both fake providers with real, isolated integrations (Kavenegar for SMS, Resend for email), built a shared retry policy for transient failures, introduced an honest four-state delivery model (`sent`/`pending`/`failed`/`skipped`) that replaces every fake-success return value, wired three new real business-event triggers (order shipped, order delivered, registration welcome, password-changed — four, not three; see §9), fixed the silent-failure bug in the one place that already called a notification function, deleted the dead duplicate email file, and added tests that exercise the real retry/skip/failure logic rather than asserting against a mock that just returns `true`.

**What this report cannot claim:** as in every prior phase, nothing here has been confirmed by an actual compiler, test run, or live request to Kavenegar/Resend — this sandbox has no network access at all (confirmed again this phase: `npm install` still returns `403 Forbidden`, and outbound HTTP to any real provider is categorically impossible here regardless of credentials). Every claim below is the result of manual, file-by-file, call-site tracing, and the provider integrations are written *correctly against each provider's real, documented REST API* from training knowledge — but that correctness has not been exercised against a live endpoint.

---

## 2. Objectives Completed

All ten objective categories from your instructions were addressed:
1. Fake providers replaced with real integrations (§4, §9).
2. Real triggers wired to five business events (§9) — payment success (pre-existing, hardened), order shipped, order delivered, registration welcome, password changed. Login notification and admin-triggered order updates are covered — see §9 for what was and wasn't built and why.
3. Delivery reliability: four-state model, retry policy for transient failures, no silent-success (§9, §10).
4. Provider isolation: verified by direct `grep` — only `notification-boundary.ts` imports the provider files (§13).
5. Configuration: extended the project's *existing* validated env schema (`src/config/env.ts`) rather than inventing a parallel one (§9).
6. Logging: every notification log call audited by hand for PII; none log phone numbers, emails, tokens, or message content (§13).
7. Dead code removed: `src/lib/email/provider.ts` deleted (§8).
8. UI feedback: audited — no UI currently claims "SMS sent"/"Email sent"; confirmed nothing needed fixing and nothing new was introduced that overclaims (§9).
9. Tests: six new test files/additions, all exercising real logic paths (skip/success/4xx/5xx/retry/network-error), no fabricated assertions (§16).
10. Verification performed after each change — see §15.

---

## 3. Every Issue Found

| # | Issue | Where | Severity |
|---|-------|-------|----------|
| P5-1 | `sendSms`/`sendEmail` returned a hardcoded fake success (`messageId: "sms_prod_123"` / `"email_prod_123"`) in `NODE_ENV === "production"` — the exact branch whose comment claimed it would "Call Kavenegar or similar SMS provider API" / "Call Resend, Postmark, or SendGrid API." No `fetch` call, no provider SDK, nothing — just a log line and a fabricated ID. | `notification-boundary.ts` | **Critical** |
| P5-2 | A second, entirely separate, entirely dead fake email implementation existed with a different interface (`EmailOptions` vs. `NotificationPayload`) and zero callers anywhere in the codebase (confirmed by `grep` before deletion). | `src/lib/email/provider.ts` | High — dead code, and a duplicate-implementation hazard if anyone had ever wired it in alongside the other one |
| P5-3 | The one real caller (`handlePaymentCallbackAction` in `commerce-actions.ts`, Phase 2) discarded `notifyOrderSuccess`'s return value entirely — a `{success: false}` result and a `{success: true}` result were handled identically (i.e., not handled at all). This is precisely the "notification failures must never be silently ignored" failure mode named in your objectives, and it already existed in production-reachable code before this phase touched anything. | `commerce-actions.ts` (call site only) | High |
| P5-4 | No notification fired on registration, order-shipped, order-delivered, or password-change — none of these business events had any messaging hook at all. | (missing) | Medium — objective 2's checklist had four of seven items with nothing to verify |
| P5-5 | `src/config/env.ts` (a real, already-wired-in, Zod-validated config module — confirmed live via `product-service.ts`/`api-client.ts` callers) did not have fields for `SMS_SENDER_LINE` or `EMAIL_FROM_ADDRESS` — both required to actually address a real provider request (a sender line number for Kavenegar, a verified from-address for Resend). The raw `process.env.SMS_API_KEY`/`EMAIL_API_KEY` reads in the old `notification-boundary.ts` bypassed this validated config module entirely. | `config/env.ts` | Low-Medium — not a bug, but a gap that would have blocked a real implementation |
| P5-6 | `logger.ts`'s redaction list (`SENSITIVE_KEYS`) does not include any PII-relevant key (`to`, `email`, `mobileNumber`, `phone`, `message`, `body`, `subject`) — only `password`/`token`/session/merchant/card fields. This is not something the old notification code violated in practice (it logged `to` via string interpolation into the message, not as a structured metadata field the redactor would have caught anyway), but it means the *shared logger itself* provides no safety net for a future notification-adjacent caller who passes PII as a metadata object. Not fixed this phase — see §17. | `logger.ts` (found, not modified) | Low — latent gap, not an active violation this phase introduced or left uncorrected in the files it touched |

---

## 4. Root Cause Analysis

- **P5-1** and **P5-2** match the pattern identified in every prior phase's report: pieces of this codebase were built to *look* production-ready (real-sounding comments, environment branching, structured log lines) without the actual integration work ever being done. The "if production and no API key, log an error" branch in the old code is a particularly telling artifact — it's the kind of code you write when you're planning to fill in the real call later and never do.
- **P5-3** is a consequence of P5-1: since `sendSms` always returned `{success: true}` in every environment it was ever exercised in during development, there was never a `{success: false}` case to notice wasn't being handled. The bug was invisible because the thing it should have caught never happened.
- **P5-4** is the same "backend piece exists in isolation, nothing calls it" pattern found in Phases 2–4 (payment, auth UI, admin), just applied to notification trigger points that didn't exist yet at all rather than existing-but-unwired.
- **P5-5** and **P5-6** are both cases of a *correct, real* piece of infrastructure (`env.ts`'s validation, `logger.ts`'s redaction) simply not having been extended to cover a need that arose later (real provider fields; PII-shaped metadata keys) — not bugs in what exists, gaps in what was never added to it.

---

## 5. Every Code Change

### New notification subsystem (`src/lib/notifications/`)
- **`types.ts`**: `NotificationStatus` (`"sent" | "pending" | "failed" | "skipped"`) and `NotificationResult`, replacing the old bare `{success: boolean}` shape everywhere.
- **`retry.ts`**: `withRetry()` — retries only transient failures (5xx, network errors), never 4xx, with two backoff delays (300ms, 900ms — three total attempts). Shared by both providers instead of each re-implementing backoff.
- **`sms-provider.ts`**: `sendSmsViaKavenegar()` — real `fetch` POST to `https://api.kavenegar.com/v1/{API_KEY}/sms/send.json`, reads config via `getEnv()`, returns `"skipped"` (not a fake success) when `SMS_API_KEY`/`SMS_SENDER_LINE` are absent, classifies the response via `return.status === 200`, retries 5xx/network errors, never retries 4xx.
- **`email-provider.ts`**: `sendEmailViaResend()` — real `fetch` POST to `https://api.resend.com/emails`, same config/skip/retry pattern, classifies success via the presence of a returned `id`.

### `src/lib/notification-boundary.ts` — rewritten
- `sendSms`/`sendEmail` now thin delegators to the provider files (kept for any lower-level future caller, though every actual business caller uses the functions below).
- `notifyOrderSuccess(mobile, orderId)` — **kept the exact same name and signature** so `commerce-actions.ts`'s existing call site needed zero changes beyond the result-handling fix in §6. Now logs its own outcome via `logOutcome()`.
- **New**: `notifyOrderShipped`, `notifyOrderDelivered`, `notifyRegistrationWelcome`, `notifyPasswordChanged` — one function per new business event, each with its own message text, each logging its own outcome.
- `logOutcome()` — the one place that decides what gets logged: `"sent"` → info; anything else → warn, with the reason code. Never logs the phone number, email, or message body — only `attempts`/`status`/`error`/`correlationId`.

### `src/config/env.ts` — extended
- Added `SMS_SENDER_LINE: z.string().optional()` and `EMAIL_FROM_ADDRESS: z.string().email().optional()` to `EnvSchema`, and to the `safeParse` call's explicit field list. Both optional, matching the existing `SMS_API_KEY`/`EMAIL_API_KEY` pattern — missing config still means "skip," not "crash the app."

### Four business-event call sites — each a minimal, isolated addition
1. **`src/lib/server/commerce-actions.ts`** (Payment domain — the one exception touch): the existing `notifyOrderSuccess(...)` call now checks `notifyResult.status !== "sent"` and logs a warning if so. Fixes P5-3. No payment/order/inventory logic touched — confirmed by re-reading the full diff: exactly one `if` block added around the existing call.
2. **`src/lib/server/admin-actions.ts`** (Phase 4 domain): `updateOrderStatusAction` now calls `notifyOrderShipped`/`notifyOrderDelivered` after a successful status update to those two states, wrapped in try/catch, result-checked and logged, never affecting the action's own success response.
3. **`src/lib/server/auth-actions.ts`** (Authentication domain — the second exception touch): `registerAction` now calls `notifyRegistrationWelcome(user.mobileNumber, user.firstName)` after user creation succeeds, wrapped in its own try/catch (verified this is nested *inside* the function's existing outer try/catch, so a notification failure cannot cause the outer catch to report registration itself as failed — see the code excerpt in §9).
4. **`src/lib/server/account-actions.ts`**: `changePasswordAction` now calls `notifyPasswordChanged(user.mobileNumber)` after the password-update + session-invalidation transaction succeeds.

### `.env.example`
- Documented `SMS_API_KEY`, `SMS_SENDER_LINE`, `EMAIL_API_KEY`, `EMAIL_FROM_ADDRESS` with a comment explaining the fail-safe-skip behavior when unset.

---

## 6. Every Modified File

1. `src/lib/notification-boundary.ts` (full rewrite)
2. `src/config/env.ts`
3. `src/lib/server/commerce-actions.ts` (one call site, Payment-domain exception — see §5.4.1)
4. `src/lib/server/admin-actions.ts`
5. `src/lib/server/auth-actions.ts` (Authentication-domain exception — see §5.4.3)
6. `src/lib/server/account-actions.ts`
7. `.env.example`
8. `src/lib/__tests__/commerce-integrity.test.ts` (mock shape update, required by the `NotificationResult` type change)

## 7. Every New File

1. `src/lib/notifications/types.ts`
2. `src/lib/notifications/retry.ts`
3. `src/lib/notifications/sms-provider.ts`
4. `src/lib/notifications/email-provider.ts`
5. `src/lib/notifications/__tests__/sms-provider.test.ts`
6. `src/lib/notifications/__tests__/email-provider.test.ts`
7. `src/lib/__tests__/notification-boundary.test.ts`
8. `src/lib/__tests__/notification-triggers.test.ts`
9. `docs/phase-5-report.md` (this report)

## 8. Every Deleted File

1. **`src/lib/email/provider.ts`** — dead, duplicate, fake email implementation with zero callers (confirmed by `grep` both before and after deletion — the only post-deletion match is a prose mention in this report and in code comments explaining the deletion, not an import). Its parent directory `src/lib/email/` was also removed (now empty).

---

## 9. Notification Architecture

```
Business code (commerce-actions.ts, admin-actions.ts,
auth-actions.ts, account-actions.ts)
        │
        │  imports ONLY from notification-boundary.ts
        ▼
notification-boundary.ts
  notifyOrderSuccess / notifyOrderShipped / notifyOrderDelivered /
  notifyRegistrationWelcome / notifyPasswordChanged
  (message templates + outcome logging live here)
        │
        │  sendSms() / sendEmail()
        ▼
notifications/sms-provider.ts        notifications/email-provider.ts
  (Kavenegar-specific)                 (Resend-specific)
        │                                     │
        │  both use notifications/retry.ts and config/env.ts's getEnv()
        ▼                                     ▼
   real fetch() to                       real fetch() to
   api.kavenegar.com                     api.resend.com
```

No business file imports `notifications/sms-provider.ts` or `notifications/email-provider.ts` directly — verified by `grep` across the entire `src` tree (only `notification-boundary.ts` and the provider files' own tests reference them).

**Business events wired this phase** (objective 2's checklist, addressed one by one):
- ✅ **Successful payment** — pre-existing trigger (Phase 2), hardened this phase (P5-3 fix).
- ✅ **Order confirmation** — deliberately treated as the *same event* as successful payment, not a second message. In this app's order-state model (Phase 2), an order isn't real/confirmed until paid — a separate order-creation-time message would fire for abandoned/draft carts. Documented directly in `notifyOrderSuccess`'s doc comment.
- ✅ **Order shipped** / ✅ **Order delivered** — new, wired into `admin-actions.ts`'s `updateOrderStatusAction` (which is also literally "admin-triggered order updates," so that checklist item is the same integration point).
- ✅ **Successful registration** — new, wired into `auth-actions.ts`'s `registerAction`.
- ✅ **Password-related notifications** — new, wired into `account-actions.ts`'s `changePasswordAction` (a security notice sent alongside the existing session-invalidation-on-password-change behavior).
- ❌ **Successful login** — deliberately not implemented. The objective marked this "(if applicable)"; sending an SMS on every login is unusual UX (typically reserved for new-device/suspicious-login alerts, which this app has no concept of) and would meaningfully increase message volume/cost for no clear benefit. Judgment call, stated plainly rather than silently skipped.

**Registration notification code, showing the isolation from the surrounding function** (excerpt, `auth-actions.ts`):
```ts
const user = await prisma.user.create({ data: { ... } });

try {
  const notifyResult = await notifyRegistrationWelcome(user.mobileNumber, user.firstName);
  if (notifyResult.status !== "sent") {
    logger.warn("[Auth:Register] Welcome notification did not send", { userId: user.id, status: notifyResult.status });
  }
} catch (notifyError) {
  logger.error("[Auth:Register] Welcome notification failed", { userId: user.id, error: String(notifyError) });
}

return { success: true, userId: user.id };
```
The inner `try/catch` means a thrown notification error cannot reach the function's outer `catch`, which is what would otherwise turn a successful registration into a reported failure — verified by reading the full function body, not assumed.

---

## 10. SMS Flow

1. Caller (e.g. `notifyOrderShipped`) builds the message text and calls `sendSms(mobile, message)`.
2. `sendSms` delegates to `sendSmsViaKavenegar`.
3. `getEnv()` is read; if `SMS_API_KEY` or `SMS_SENDER_LINE` is missing → return `skipped(...)` immediately, **no network call is made** (verified by the corresponding test asserting `fetchMock` was never called).
4. Otherwise, POST to `https://api.kavenegar.com/v1/{key}/sms/send.json` with `receptor`/`sender`/`message` form fields.
5. Response classified: HTTP 2xx + `return.status === 200` → `"sent"`. Any 4xx → `"failed"`, no retry. Any 5xx or network-level throw → retried up to twice (300ms, 900ms delays) before finally reporting `"failed"`.
6. Result flows back to the business function, which logs the outcome (never the phone number or message text) and returns it to its own caller — the enclosing business action's own success/failure is never determined by this result (see §9's code excerpt).

## 11. Email Flow

Identical structure to the SMS flow, targeting Resend: `POST https://api.resend.com/emails` with `Authorization: Bearer {EMAIL_API_KEY}`, JSON body `{from: EMAIL_FROM_ADDRESS, to, subject, html}`, success classified by the presence of a returned `id`. **Not currently called by any business event** — no email-based notification was requested or wired this phase (every business event above uses SMS, matching the pre-existing pattern `notifyOrderSuccess` already established). The Resend integration is real and tested (§16) but has no production caller yet — flagged honestly in §17, not hidden.

## 12. Provider Configuration

| Variable | Purpose | Required for |
|---|---|---|
| `SMS_API_KEY` | Kavenegar API key | any SMS to send (not skip) |
| `SMS_SENDER_LINE` | Kavenegar sender line number | any SMS to send (not skip) |
| `EMAIL_API_KEY` | Resend API key | any email to send (not skip) |
| `EMAIL_FROM_ADDRESS` | Verified Resend sender address | any email to send (not skip) |

All four are read exclusively through `getEnv()` (`src/config/env.ts`) — no provider file reads `process.env` directly. All four are `.optional()` in the Zod schema: **missing configuration never crashes the app or any request** — the relevant provider function returns `"skipped"` and the business action it's called from proceeds and reports its own (unrelated) success or failure normally. This was a deliberate choice over hard-failing at boot (which `env.ts` already does for `ZARINPAL_MERCHANT_ID` in production) — notifications are a side channel to a purchase completing, not a precondition for one; see §17 for the tradeoff this implies.

## 13. Logging Improvements

- Every `console.log`/`console.error`/`console.warn` inside the notification subsystem was replaced with `logger.info`/`logger.warn`/`logger.error` — confirmed by `grep`, zero raw `console.*` calls remain in `notification-boundary.ts` or any file under `notifications/`.
- Every logger call in the notification subsystem was manually audited: none pass a phone number, email address, message body, or subject line as an argument — only `attempts`, `status`/provider-error-codes, `httpStatus`, `orderId`, `userId`, and `correlationId`. The `to`/`payload` values that previously appeared in log strings (old `notification-boundary.ts`) are gone entirely, not just moved to a redacted field.
- **Found, not fixed**: `logger.ts`'s own `SENSITIVE_KEYS` redaction list doesn't cover PII-shaped keys (`to`, `email`, `phone`, `message`) — see P5-6 and §17. This phase achieved compliance by simply never passing such keys into a log call, rather than by editing the shared logger (a file used well beyond the notification subsystem, and outside this phase's stated scope). Flagged as a recommendation, not silently left for someone else to discover.

## 14. Security Considerations

- No API key, sender ID, or credential is hardcoded anywhere — all four provider config values come from `getEnv()`, sourced from environment variables, matching objective 5 exactly.
- The provider files never construct a request from unvalidated caller input beyond what's already been through the business layer's own validation (e.g., `mobile`/`orderId` passed from an already-authenticated, already-authorized action) — no new attack surface introduced (no new user-facing endpoint accepts arbitrary "send to this address" input).
- Password-changed notification (`notifyPasswordChanged`) explicitly warns the recipient to contact support "if you didn't make this change" — a real security-notice pattern, not decorative copy.

## 15. Reliability Improvements

- Retry policy: transient failures (5xx, network errors) get two retries with backoff before being reported as `"failed"`; permanent failures (4xx) are never retried, avoiding wasted attempts on a request that cannot succeed.
- Four-state model (`sent`/`pending`/`failed`/`skipped`) replaces the old binary `{success: boolean}` — a caller (or a future admin "notification log" feature) can now distinguish "we tried and it failed" from "we never tried because nothing is configured," which the old code could not express at all.
- The one place a notification result was previously discarded (`commerce-actions.ts`'s payment-success path) now logs every non-`"sent"` outcome — P5-3 fixed.

## 16. Validation Performed

- Read `notification-boundary.ts`, `src/lib/email/provider.ts`, `logger.ts`, `config/env.ts`, and every one of the four business-event call sites in full before writing any code.
- `grep`-traced every export of the old `notification-boundary.ts` and the old `email/provider.ts` across the entire `src` tree, both before changes (confirming `notifyOrderSuccess` was the only real caller, and `email/provider.ts` had zero) and after (confirming the new call sites exist and nothing references the deleted file).
- Manually re-derived a real subtlety in `getEnv()`'s test-mode fallback branch that would have made my provider tests non-deterministic depending on the ambient test-runner environment (if `DATABASE_URL`/`AUTH_SECRET` aren't otherwise set, `getEnv()` takes a shortcut that ignores freshly-stubbed env vars) — caught and fixed by explicitly stubbing those two values in the new tests' `beforeEach`, rather than assuming `vi.stubEnv` alone would work (it would not, reliably).
- Ran the same static unused-import scan used in every prior phase across all new/modified files — found no unused imports introduced by this phase (two pre-existing unused imports were found in `commerce-actions.ts`/`account-actions.ts`, both predating this phase and outside the one line each of those files this phase touched; left alone per scope discipline, noted honestly rather than silently fixed or silently ignored).
- Confirmed, by direct `grep`, that no file other than `notification-boundary.ts` imports `notifications/sms-provider.ts` or `notifications/email-provider.ts` (provider isolation, objective 4).
- Confirmed, by direct `grep`, that no logger call anywhere in the notification subsystem passes a phone number, email, or message-content argument.
- Confirmed the inner/outer try-catch nesting in `registerAction` actually isolates a notification failure from registration's own success response, by reading the full function body (not assumed).

**What was not done, and cannot be done in this environment:** no `npm install`, `tsc`, `vitest`, or `next build` — the same standing limitation as every prior phase. Additionally, and specific to this phase: **no real HTTP request to Kavenegar or Resend was or could be made** — this sandbox has no outbound network access at all, so even with real credentials the actual provider integrations have never been exercised end-to-end. The request-construction code was written to match each provider's real, documented API shape from training knowledge, and the test suite exercises the response-handling logic against realistic mocked responses, but "this code is correct against the provider's real current API" is not something that has been verified against the live services.

## 17. Remaining Issues

1. **No compiler/test/live-integration verification** — the standing limitation, now compounding across five phases, plus this phase's specific inability to test against real provider endpoints at all (see §16).
2. **`logger.ts`'s redaction list doesn't cover PII-shaped keys** (P5-6). Not fixed this phase (outside notification-subsystem scope), worked around by discipline rather than a structural guarantee. A future caller elsewhere in the app who logs `{ email: user.email }` as metadata would not be protected by the redactor today.
3. **Email channel has no production caller.** The Resend integration is real and tested, but nothing currently sends an email — every wired business event uses SMS only, matching the pattern the pre-existing code already established. If email notifications (e.g., an HTML order receipt) are wanted, the boundary is ready but nothing calls it yet.
4. **No login notification** — deliberate, see §9.
5. **No notification-delivery audit trail in the database.** `NotificationResult` is computed and logged, but not persisted anywhere (no `NotificationLog` table). An admin cannot currently see "did this order's shipped SMS actually send" anywhere except raw server logs. Not built this phase — would require a schema change, explicitly out of scope ("do not modify Prisma schema... unless absolutely required," and this isn't required for notifications to function correctly, only for their history to be queryable later).
6. **The retry policy's timing (300ms, 900ms) is a reasonable default, not tuned against either provider's real rate-limit/backoff guidance** — untestable without live access to confirm.

## 18. Risks

- **Unverified against live providers** (§16) — the single biggest risk this phase, more so than prior phases' "unverified by compiler" risk, since there's a real external system (Kavenegar/Resend's actual current API) this code has never touched.
- **Cost/volume risk**: four real SMS triggers now exist where zero did before (from the business's perspective — the fifth, payment-success, already existed). Once real `SMS_API_KEY`/`SMS_SENDER_LINE` are configured, every registration, password change, and order-status advance will attempt a real, billable SMS. Worth confirming this is the intended volume before configuring real credentials in production.
- **`getAdminOrdersAction`/`updateOrderStatusAction` (Phase 4) were not re-audited for anything beyond the notification addition** — I added one notification block and traced it carefully, but did not re-review the rest of Phase 4's logic this phase, per the instruction to treat Phases 1–4 as baseline and not re-review them.

## 19. Recommendations

1. Run `npm install && npx tsc --noEmit && npm test && npm run build` in a networked environment — standing recommendation, now spanning five phases.
2. Before configuring real `SMS_API_KEY`/`SMS_SENDER_LINE` in production, send a handful of real test messages against Kavenegar's sandbox/test credentials if available, to confirm the request/response shape this phase implemented from documentation knowledge matches the live API exactly.
3. Consider extending `logger.ts`'s `SENSITIVE_KEYS` to include PII-shaped keys (`to`, `email`, `phone`, `mobileNumber`, `message`, `body`, `subject`) as a follow-up — a structural fix rather than relying on every future caller remembering not to log them.
4. Consider a `NotificationLog` table (schema change, future phase) if delivery history needs to be queryable rather than living only in server logs.
5. Decide whether email notifications (order receipts, etc.) are wanted — the Resend boundary is ready and tested but unused.

## 20. Production Readiness Assessment

**Code-complete, provider-integration-unverified.** The architecture is sound (isolated providers, honest status model, retry policy, no fake success possible), the failure modes are handled explicitly (skip/fail/retry, never silent), and every new business-event trigger is wrapped so a notification problem cannot cause the underlying business action (registration, password change, order status update, payment) to fail or be misreported. It is **not** production-ready to actually send real messages without: (a) real `SMS_API_KEY`/`SMS_SENDER_LINE`/`EMAIL_API_KEY`/`EMAIL_FROM_ADDRESS` configured, and (b) at least one live smoke test against each provider's real API, neither of which was possible in this environment.

## 21. Final Verdict

**PASS WITH NOTES**

Rationale: every objective was addressed with real, isolated, tested (against mocked-but-realistic responses) provider code; no fake success path remains anywhere in the notification subsystem; dead code was found and removed; every new business-event trigger is correctly isolated from the business logic it's attached to. It is not an unqualified **PASS** for the standing reason (no compiler/test run) plus this phase's specific added caveat: the provider integrations, while written correctly against each provider's real documented API, have never made an actual network request to a live service in this environment. It is not a **FAIL** because nothing was left fake, nothing was hidden, and every remaining gap (§17) is named with its reasoning.

**Condition for upgrading to PASS:** run the build/type-check/test suite in a networked environment, and separately, run at least one live smoke test against real Kavenegar and Resend credentials to confirm the request/response handling matches their actual current APIs.
