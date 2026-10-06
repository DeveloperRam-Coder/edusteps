-- Migration: Improve user schema for phone authentication
-- This migration makes email optional and adds proper phone verification fields

-- Step 1: Make email nullable (for phone-only users)
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
ALTER TABLE users DROP CONSTRAINT IF EXISTS user_email_key;
CREATE UNIQUE INDEX user_email_key ON users(email) WHERE email IS NOT NULL;

-- Step 2: Add phone verification fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS mobile_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_method VARCHAR(20) DEFAULT 'email';
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_status VARCHAR(20) DEFAULT 'active';
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_ip VARCHAR(50);

-- Step 3: Add OTP rate limiting fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_sent_count INT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_sent_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_blocked_until TIMESTAMP;

-- Step 4: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_mobile_verified ON users(mobile, mobile_verified);
CREATE INDEX IF NOT EXISTS idx_users_auth_method ON users(auth_method);
CREATE INDEX IF NOT EXISTS idx_users_account_status ON users(account_status);
CREATE INDEX IF NOT EXISTS idx_users_otp_expire ON users(phone_otp_expire) WHERE phone_otp_expire IS NOT NULL;

-- Step 5: Update existing users
UPDATE users SET 
  mobile_verified = TRUE,
  email_verified = TRUE,
  auth_method = CASE 
    WHEN email LIKE 'phone_%@temp.local' THEN 'phone'
    ELSE 'email'
  END
WHERE mobile_verified IS NULL;

-- Step 6: Clean up temp emails
UPDATE users 
SET email = NULL 
WHERE email LIKE 'phone_%@temp.local';

COMMENT ON COLUMN users.mobile_verified IS 'Whether mobile number is verified via OTP';
COMMENT ON COLUMN users.email_verified IS 'Whether email is verified';
COMMENT ON COLUMN users.auth_method IS 'Primary authentication method: email, phone, or both';
COMMENT ON COLUMN users.account_status IS 'Account status: active, suspended, deleted';
COMMENT ON COLUMN users.otp_sent_count IS 'Number of OTPs sent in current window';
COMMENT ON COLUMN users.otp_sent_at IS 'Timestamp of last OTP sent';
COMMENT ON COLUMN users.otp_blocked_until IS 'Timestamp until which OTP sending is blocked';
