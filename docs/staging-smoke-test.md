# Staging Smoke Test Plan - Phase 149

## Goal
Verify the basic functionality of the deployed application against a live PostgreSQL database.

## Test Cases
1. **Connectivity**: `GET /api/health` returns 200 OK.
2. **Catalog**: Visit `/products`, verify at least 4 product cards render.
3. **Cart**: Add "خودکار صفا کیان" to cart, verify badge count is 1.
4. **Checkout**: Proceed to `/checkout`, fill form, reach "مرور و تأیید نهایی".
5. **Persistence**: Reload the page, verify cart items remain.

## Database Verification
- Run a manual query to confirm the order exists in the `Order` table.
- Verify `inventoryCount` decreased for the ordered product.
