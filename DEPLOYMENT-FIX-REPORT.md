# Vahdat Qazvin — Production 500 Error: Root Cause & Fix

## 1. Root Cause Analysis

**The 500 errors are not primarily a code bug — they're a missing database migration.**

`prisma/schema.prisma` currently defines 13 models. The actual database migration history (`prisma/migrations/`) contains exactly **one** migration (`00000000000000_init`), and I read its SQL directly — it only creates 8 tables: `User`, `Session`, `Address`, `Product`, `Category`, `Order`, `PaymentAttempt`, `OrderItem`.

**Five entire tables that `schema.prisma` defines do not exist in the real database at all**: `Brand`, `ProductVariant`, `Review`, `Coupon`, `Notification`. On top of that, `Product` is missing the columns `brandId`, `attributes`, `discountPrice`, `images`, `seo`, `rating`, `reviewCount`, and `Category` is missing `parentId` — none of these appear anywhere in the init migration's SQL either.

Here's why this produces a 500 specifically on `/`, `/products`, and `/categories`: your `package.json`'s `build` script is just `next build` — it never runs `prisma migrate deploy`. What *does* run automatically on every Vercel build is `postinstall: prisma generate`, which regenerates the Prisma **Client's TypeScript types** from the current `schema.prisma` — so the code compiles cleanly (matching your report that "build succeeds without errors"). But `prisma generate` only generates types; it never touches the actual database. So at runtime, `prisma.product.findMany()` (called by `getProducts()`, which all three failing pages call) asks Postgres for columns like `brandId`/`attributes` that were never added to the real table, and Postgres returns a real SQL error — which Prisma surfaces as a crash, not a warning. This also explains "works in development, fails in production": your local/dev database was very likely synced to match the newer schema at some point (via `prisma db push` or `prisma migrate dev`, both of which apply directly to whatever database you're connected to at that moment) — but that was never captured as a migration file, so it never reached the Supabase production database.

**Separately, and only found because I traced how `getProducts()`/`getBrands()` actually use these fields**: `brand` was changed in the schema from a plain text column to a *relation* (`Product.brandId` → a new `Brand` table), but `product-service.ts` was never updated to match — it still does `where.brand = query.brand` (a scalar-style filter that Prisma will reject once `brand` is a relation), `{ brand: { contains: ... } }` in search, and reads `p.brand` as if it were already a string. Fixing only the migration and leaving this as-is would trade today's 500 for a new one the moment anyone filters or searches by brand — so this is included as a required part of the same fix, not a separate feature.

## 2. File-Specific Fix

- **Database**: apply the missing migration (see step-by-step below). This is the fix that actually stops the 500.
- **Code**: `src/features/products/services/product-service.ts` — updated to use the `Brand` relation correctly. This is necessary so brand filtering/search/display keep working once the tables exist; it does not by itself fix the 500.

No other file needs to change.

## 3. Complete Code Replacement

`src/features/products/services/product-service.ts` has been rewritten in full and is included in the attached project. I diffed it line-by-line against your original file to confirm the *only* changes are: `mapPrismaProductToProduct`'s `brand` field (now reads `p.brand?.name` instead of `p.brand`), `where.brand = { name: query.brand }` instead of `where.brand = query.brand`, the search condition now goes through `brand: { name: { contains: ... } }`, `include: { brand: true }` added to both `findMany` and `findUnique` calls, and `getBrands()` now queries the `Brand` table directly instead of an invalid `distinct` on a relation. Everything else in the file — the fixture fallback logic, the price-range filter, the in-memory attribute search, error handling — is byte-for-byte identical to what you sent me.

## 4. Step-by-Step Implementation (for a non-developer)

**Part A — the real fix (must be done by whoever has your Supabase database credentials, ideally a developer or DeepSeek):**

This needs to be run from a computer with Node.js installed and your real `DATABASE_URL` available (not something I can run from here — I have no network access to your database). Someone needs to:

1. Open a terminal in the project folder.
2. Make sure `DATABASE_URL` in `.env` points to your real Supabase database (the same one Vercel uses).
3. Run:
   ```
   npx prisma migrate dev --name add_brand_and_catalog_extensions
   ```
   This command compares your `schema.prisma` against the actual database, safely generates a new migration file containing exactly the missing tables/columns, and applies it. **I'm deliberately not handing you a hand-written SQL file for this** — with 5 new tables and multiple new columns/foreign keys, generating it any other way risks a subtle mistake against a live production database, and Prisma's own tooling does this safely and deterministically.
4. Commit the new migration folder that appears under `prisma/migrations/` to your git repository.
5. **Also add this to your Vercel build process**, or the same gap will happen again on the next schema change: change `package.json`'s build script from `"build": "next build"` to `"build": "prisma migrate deploy && next build"`.

**Part B — the code fix (already done, just needs to be applied):**

1. Replace `src/features/products/services/product-service.ts` with the corrected version in the attached project (or copy its full content over your existing file).
2. Redeploy.

Both parts are needed. Part A alone stops the 500; Part B is what makes brand filtering/search/display actually work once the tables exist.

## 5. Verification Checklist

- [ ] After running the migration (Part A step 3), check Supabase's Table Editor directly — confirm `Brand`, `ProductVariant`, `Review`, `Coupon`, `Notification` tables now exist, and `Product` has `brandId`/`attributes`/`discountPrice`/`images`/`seo`/`rating`/`reviewCount` columns.
- [ ] Redeploy on Vercel, then visit `/`, `/products`, `/categories` — all three should load without a 500.
- [ ] Visit `/products?brand=<some real brand name>` — should filter correctly, not error.
- [ ] Open a product page and confirm the brand name still displays correctly.
- [ ] Check Vercel's Function logs after visiting these pages — there should be no new `PrismaClientKnownRequestError`/`PrismaClientValidationError` entries.

## 6. What I Did Not Touch, and Why

Per your explicit constraints, I made no other change. Two things I found while tracing this but did **not** fix, since they're unrelated to the reported 500 and outside "smallest change to fix the issue":
- The in-memory attribute search (`Object.values(attrs).some(value => value.toLowerCase()...)`) will throw if any product's `attributes` JSON ever contains a non-string value — only reachable when a search query is present, not on a bare page load, so it's not what's causing your reported error. Worth a look separately if search ever throws.
- `next.config.mjs` has `typescript: { ignoreBuildErrors: true }` (I read this file during investigation) — this is why a real type mismatch like the `brand` field bug above was able to reach production without the build catching it. Not something I changed, since removing it is a bigger decision than this fix warrants, but worth knowing it's there.

---

## گزارش فارسی

**علت اصلی خطای 500:** این مشکل اساساً یک باگ کد نیست — یک **مایگریشن پایگاه‌داده‌ی جاافتاده** است. فایل `schema.prisma` شما ۱۳ مدل تعریف کرده، اما تاریخچه‌ی مایگریشن‌های واقعی (`prisma/migrations/`) فقط یک مایگریشن اولیه داره که تنها ۸ جدول می‌سازه. **پنج جدول کامل که در schema.prisma تعریف شده‌اند اصلاً در دیتابیس واقعی وجود ندارند**: `Brand`, `ProductVariant`, `Review`, `Coupon`, `Notification` — به‌علاوه چند ستون جدید که به `Product` و `Category` اضافه شده ولی هیچ‌وقت واقعاً روی دیتابیس اعمال نشده.

دلیل اینکه در build خطا نمی‌بینید ولی در runtime صفحات کرش می‌کنند: اسکریپت build شما (`next build`) فقط تایپ‌های Prisma رو از روی schema فعلی می‌سازه (از طریق `postinstall: prisma generate`)، ولی هیچ‌وقت واقعاً به دیتابیس متصل نمی‌شه تا این تغییرات رو اعمال کنه. وقتی صفحه در production بارگذاری می‌شه و کد سعی می‌کنه از ستون‌هایی که در دیتابیس واقعی وجود ندارند بخونه، Postgres خطای واقعی برمی‌گردونه و صفحه با خطای 500 کرش می‌کنه.

**علاوه بر این**، فیلد `brand` در schema از یک ستون متنی ساده به یک رابطه (جدول جداگانه‌ی `Brand`) تبدیل شده، ولی فایل `product-service.ts` هیچ‌وقت متناسب با این تغییر آپدیت نشده — این باعث می‌شه حتی بعد از رفع مایگریشن، فیلتر و جستجوی برند هم خراب بمونه. این فایل رو کامل و دقیق اصلاح کردم (فقط همین بخش، هیچ چیز دیگه‌ای تغییر نکرده — با diff خط‌به‌خط تأیید شده).

**چه‌کاری باید انجام بشه:**

1. **مهم‌ترین قدم (باید توسط کسی که به دیتابیس Supabase واقعی دسترسی داره انجام بشه، ترجیحاً یک برنامه‌نویس یا خود دیپ‌سیک):** روی سیستمی که `DATABASE_URL` واقعی رو داره، دستور زیر رو اجرا کنه:
   ```
   npx prisma migrate dev --name add_brand_and_catalog_extensions
   ```
   من عمداً یک فایل SQL دستی بهتون نمی‌دم — با ۵ جدول جدید و چند ستون/رابطه‌ی جدید، نوشتن دستی این مایگریشن روی یک دیتابیس واقعی و در حال کار، ریسک اشتباه داره. ابزار خود Prisma این کار رو امن و دقیق انجام می‌ده.
2. فایل مایگریشن جدیدی که ساخته می‌شه رو commit کنید.
3. اسکریپت build در `package.json` رو از `"next build"` به `"prisma migrate deploy && next build"` تغییر بدید تا این مشکل دیگه تکرار نشه.
4. فایل `product-service.ts` رو با نسخه‌ی اصلاح‌شده (در پروژه‌ی پیوست) جایگزین کنید.
5. دوباره deploy کنید و صفحات `/`، `/products`، `/categories` رو تست کنید.

**نکته‌ی مهم:** من نمی‌تونم این مایگریشن رو خودم اجرا کنم چون به دیتابیس Supabase شما دسترسی/اینترنت ندارم — این تنها قسمتی از کار هست که باید توسط شما یا دیپ‌سیک روی سیستم واقعی انجام بشه. تا وقتی این مرحله انجام نشه، خطای 500 برطرف نمی‌شه — حتی با فایل کد اصلاح‌شده.
