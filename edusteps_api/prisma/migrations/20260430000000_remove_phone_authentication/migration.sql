-- Drop phone OTP-related fields from users table
ALTER TABLE "public"."users" DROP COLUMN IF EXISTS "phone_otp";
ALTER TABLE "public"."users" DROP COLUMN IF EXISTS "phone_otp_expire";
ALTER TABLE "public"."users" DROP COLUMN IF EXISTS "phone_otp_attempts";
ALTER TABLE "public"."users" DROP COLUMN IF EXISTS "mobile_verified";
ALTER TABLE "public"."users" DROP COLUMN IF EXISTS "otp_sent_count";
ALTER TABLE "public"."users" DROP COLUMN IF EXISTS "otp_sent_at";
ALTER TABLE "public"."users" DROP COLUMN IF EXISTS "otp_blocked_until";

-- Drop the index on (mobile, mobile_verified) since mobile_verified no longer exists
DROP INDEX IF EXISTS "public"."users_mobile_mobile_verified_idx";
