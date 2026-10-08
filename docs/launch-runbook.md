# Launch Runbook (MVP)

1.  **Phase 1: Environment**
    *   Set all production environment variables on Vercel.
2.  **Phase 2: Database**
    *   Run `npx prisma migrate deploy` locally pointing to Production DB.
    *   Run `npx prisma db seed` to initialize Admin.
3.  **Phase 3: Deploy**
    *   Merge `main` to `production` branch.
4.  **Phase 4: Sanity**
    *   Verify `/api/health`.
    *   Perform one test purchase with real ZarinPal gateway.
