# Real Deployment Runbook & Infrastructure Guide

## 1. Target Stack
- **Hosting**: Vercel (Frontend + Serverless Functions)
- **Database**: Neon.tech or Railway.app (Managed PostgreSQL)
- **SMS**: Kavenegar.com
- **Email**: Resend.com or Postmarkapp.com
- **DNS/SSL**: Cloudflare (Recommended)

## 2. Environment Variables Configuration
The following variables MUST be set in the deployment dashboard (Vercel):

### Core
- `DATABASE_URL`: `postgresql://user:password@host:port/dbname?sslmode=require`
- `AUTH_SECRET`: Generate using `openssl rand -base64 64`
- `NODE_ENV`: `production`

### External Providers
- `ZARINPAL_MERCHANT_ID`: Your ZarinPal 36-char Merchant ID.
- `SMS_API_KEY`: Kavenegar API Key.
- `EMAIL_API_KEY`: Resend or Postmark API Key.

### Site URLs
- `NEXT_PUBLIC_SITE_URL`: `https://www.tahririno.com`
- `NEXT_PUBLIC_API_URL`: `https://www.tahririno.com/api`

## 3. Deployment Steps
1.  **DB Provisioning**: Create a fresh PostgreSQL instance on Neon.
2.  **Schema Baseline**: Run `npx prisma migrate deploy` to create tables.
3.  **Seed Data**: Run `npx prisma db seed` to initialize categories and the admin user.
4.  **Vercel Link**: Connect the GitHub repository to Vercel.
5.  **Build Phase**: Vercel automatically runs `npm run build`.
6.  **Post-Deployment**: Hit `https://your-domain.com/api/health` to verify DB connection.

## 4. Verification Check
- [ ] HTTPS is active.
- [ ] No secrets leaked in `npm run build` logs.
- [ ] `/api/health` returns `status: healthy` and `database: connected`.

## 5. Verdict
**STAGING READY** - The runbook is complete. Live deployment is blocked by credentials.
