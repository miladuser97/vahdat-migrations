# Tahririno (تحریرینو)

A paper and stationery store platform, built to grow for at least 10 years.

## Current status: Phase 173 — Final Release Readiness

Following an intensive development and audit roadmap, the project is now at its peak stability, featuring a production-grade PostgreSQL architecture, secure authentication, and transactional commerce logic.

### Core Capabilities:
1. **Catalog & Discovery**: Product/Category services with PostgreSQL persistence, Zod schemas, and Farsi normalization.
2. **Transactional Commerce**: Atomic inventory updates, order idempotency, and server-authoritative pricing.
3. **Secure Identity**: Session-based auth with Bcrypt hashing and HttpOnly cookies.
4. **Infrastructure**: Versioned Prisma migrations, structured logging, and staging readiness.
5. **Quality**: Comprehensive test suite (44+ tests), strict TypeScript, and CI/CD protection.

## Project Status Reference
For the definitive implementation history and technical audit results, refer to [PROJECT-STATUS.md](./PROJECT-STATUS.md).

## Getting started
1. `npm install`
2. Set environment variables (see `.env.example`)
3. `npx prisma migrate deploy`
4. `npm run build`
