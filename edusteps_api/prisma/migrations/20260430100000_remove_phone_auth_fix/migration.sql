-- Remove phone-based authentication
-- Make mobile field optional and remove unique constraint
-- Remove auth_method field
-- Remove mobile index

-- Drop indexes
DROP INDEX IF EXISTS "public"."users_mobile_idx";
DROP INDEX IF EXISTS "public"."users_auth_method_idx";

-- Drop unique constraint on mobile
ALTER TABLE "public"."users" DROP CONSTRAINT IF EXISTS "users_mobile_key";

-- Make mobile nullable
ALTER TABLE "public"."users" ALTER COLUMN "mobile" DROP NOT NULL;

-- Remove auth_method column
ALTER TABLE "public"."users" DROP COLUMN IF EXISTS "auth_method";

-- Make email required (not nullable)
ALTER TABLE "public"."users" ALTER COLUMN "email" SET NOT NULL;
