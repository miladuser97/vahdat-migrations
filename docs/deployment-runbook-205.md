# Production Deployment Runbook (Phase 205)

## 1. Infrastructure Stack
*   **Frontend/API Hosting**: Vercel (Auto-SSL, Edge Network)
*   **Managed Database**: Neon (PostgreSQL 16+)
*   **SMS Provider**: Kavenegar (Transactional Template API)
*   **Email Provider**: Resend or Amazon SES
*   **DNS Management**: Cloudflare (Recommended for WAF)

## 2. Environment Variables Configuration (Vercel)
| Variable | Value Requirement |
|---|---|
| `DATABASE_URL` | `postgresql://user:pass@host:port/dbname?sslmode=require` |
| `AUTH_SECRET` | 64+ char random string (Base64) |
| `ZARINPAL_MERCHANT_ID` | 36-char ZarinPal Merchant ID |
| `SMS_API_KEY` | Kavenegar API Secret |
| `EMAIL_API_KEY` | Resend/SES API Secret |
| `NEXT_PUBLIC_SITE_URL` | `https://www.tahririno.com` |
| `NODE_ENV` | `production` |

## 3. Launch Sequence
1.  **Provision DB**: Create a Neon PostgreSQL instance.
2.  **Schema Deploy**: Run `npx prisma migrate deploy` locally pointing to production DB.
3.  **Secure Seeding**: Run `npx prisma db seed` with `FORCE_SEED=true` to create admin user.
4.  **Vercel Build**: Connect GitHub repo and trigger build.
5.  **Sanity Check**:
    *   GET `/api/health` -> `status: healthy`.
    *   GET `/api/health/liveness` -> `status: alive`.

## 4. Status: BLOCKED
**Reason**: Infrastructure accounts and Merchant keys have not been provided by the project owner.
**Evidence**: Current `.env` defaults to localhost.

## 5. Verdict
**PROVEN ARCHITECTURE — NOT DEPLOYED**.
