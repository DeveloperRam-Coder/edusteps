-- Migration: 20260610000000_dual_auth_optional_email
-- 1. Add index on users.mobile for fast mobile-based login lookups
-- 2. Make customers.email nullable (drop NOT NULL constraint)
-- 3. Remove the unique(email, client_id) constraint on customers
--    (a NULL email must not block multiple customers without email on the same client)

-- Step 1: Index users.mobile for login performance
CREATE INDEX IF NOT EXISTS "users_mobile_idx" ON "public"."users"("mobile");

-- Step 2: Allow NULL on customers.email
ALTER TABLE "public"."customers"
  ALTER COLUMN "email" DROP NOT NULL;

-- Step 3: Drop the unique constraint that included email
--         (constraint name matches Prisma's default: customers_email_client_id_key)
ALTER TABLE "public"."customers"
  DROP CONSTRAINT IF EXISTS "customers_email_client_id_key";
