-- ============================================================================
-- ATTENDANCE + MISSING TABLES FIX MIGRATION
-- ============================================================================
-- This migration creates tables and columns that exist in schema.prisma
-- but were never created by any migration (or were in "lost" migrations).
-- All statements use IF NOT EXISTS / DO blocks for idempotency.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Create required ENUM types
--    CREATE TYPE IF NOT EXISTS doesn't exist in Postgres, so use DO blocks.
-- ---------------------------------------------------------------------------

DO $$ BEGIN
    CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late', 'excused');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE student_status AS ENUM ('active', 'inactive', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE fee_reminder_status AS ENUM ('pending', 'sent', 'failed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE day_of_week AS ENUM ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================================
-- 2. CREATE MISSING TABLES
--    Tables that exist in schema.prisma but NOT in any migration.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 2a. "students" table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "public"."students" (
    "student_id"     BIGSERIAL PRIMARY KEY,
    "customer_id"    BIGINT NOT NULL,
    "client_id"      BIGINT NOT NULL,
    "course_id"      BIGINT,
    "legacy_cd_id"   BIGINT UNIQUE,
    "first_name"     VARCHAR(100) NOT NULL,
    "last_name"      VARCHAR(100),
    "display_name"   VARCHAR(200),
    "subject"        VARCHAR(100),
    "admission_date" DATE,
    "fee_amount"     DECIMAL(10,2),
    "status"         student_status NOT NULL DEFAULT 'active',
    "is_active"      BOOLEAN NOT NULL DEFAULT TRUE,
    "deactivate_date" DATE,
    "created_id"     TEXT NOT NULL,
    "updated_id"     TEXT NOT NULL,
    "created_at"     TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    "updated_at"     TIMESTAMPTZ(6) NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "students_customer_id_idx"  ON "public"."students"("customer_id");
CREATE INDEX IF NOT EXISTS "students_client_id_idx"    ON "public"."students"("client_id");
CREATE INDEX IF NOT EXISTS "students_course_id_idx"    ON "public"."students"("course_id");
CREATE INDEX IF NOT EXISTS "students_status_idx"       ON "public"."students"("status");

ALTER TABLE IF EXISTS "public"."students"
    DROP CONSTRAINT IF EXISTS "students_client_id_fkey",
    ADD CONSTRAINT "students_client_id_fkey"
        FOREIGN KEY ("client_id") REFERENCES "public"."clients"("client_id") ON DELETE CASCADE;

ALTER TABLE IF EXISTS "public"."students"
    DROP CONSTRAINT IF EXISTS "students_customer_id_fkey",
    ADD CONSTRAINT "students_customer_id_fkey"
        FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("customer_id") ON DELETE CASCADE;

ALTER TABLE IF EXISTS "public"."students"
    DROP CONSTRAINT IF EXISTS "students_course_id_fkey",
    ADD CONSTRAINT "students_course_id_fkey"
        FOREIGN KEY ("course_id") REFERENCES "public"."courses"("course_id") ON DELETE SET NULL;

ALTER TABLE IF EXISTS "public"."students"
    DROP CONSTRAINT IF EXISTS "students_legacy_cd_id_fkey",
    ADD CONSTRAINT "students_legacy_cd_id_fkey"
        FOREIGN KEY ("legacy_cd_id") REFERENCES "public"."customer_details"("cd_id") ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- 2b. "timetables" table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "public"."timetables" (
    "timetable_id" BIGSERIAL PRIMARY KEY,
    "client_id"    BIGINT NOT NULL,
    "course_id"    BIGINT,
    "title"        VARCHAR(200) NOT NULL,
    "day_of_week"  day_of_week NOT NULL,
    "start_time"   VARCHAR(5) NOT NULL,
    "end_time"     VARCHAR(5) NOT NULL,
    "room"         VARCHAR(100),
    "teacher"      VARCHAR(100),
    "color"        VARCHAR(20),
    "is_active"    BOOLEAN NOT NULL DEFAULT TRUE,
    "created_id"   TEXT NOT NULL,
    "created_at"   TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    "updated_at"   TIMESTAMPTZ(6) NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "timetables_client_id_idx"    ON "public"."timetables"("client_id");
CREATE INDEX IF NOT EXISTS "timetables_day_of_week_idx"  ON "public"."timetables"("day_of_week");
CREATE INDEX IF NOT EXISTS "timetables_course_id_idx"    ON "public"."timetables"("course_id");

ALTER TABLE IF EXISTS "public"."timetables"
    DROP CONSTRAINT IF EXISTS "timetables_client_id_fkey",
    ADD CONSTRAINT "timetables_client_id_fkey"
        FOREIGN KEY ("client_id") REFERENCES "public"."clients"("client_id") ON DELETE CASCADE;

ALTER TABLE IF EXISTS "public"."timetables"
    DROP CONSTRAINT IF EXISTS "timetables_course_id_fkey",
    ADD CONSTRAINT "timetables_course_id_fkey"
        FOREIGN KEY ("course_id") REFERENCES "public"."courses"("course_id") ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- 2c. "fee_reminders" table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "public"."fee_reminders" (
    "reminder_id"     BIGSERIAL PRIMARY KEY,
    "customer_id"     BIGINT NOT NULL,
    "client_id"       BIGINT NOT NULL,
    "cd_id"           BIGINT NOT NULL,
    "due_date"        DATE NOT NULL,
    "amount_due"      DECIMAL(10,2) NOT NULL,
    "reminder_date"   DATE NOT NULL,
    "status"          fee_reminder_status NOT NULL DEFAULT 'pending',
    "sent_at"         TIMESTAMPTZ(6),
    "delivery_status" VARCHAR(50),
    "message_id"      VARCHAR(200),
    "created_at"      TIMESTAMPTZ(6) NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "fee_reminders_reminder_date_status_idx"
    ON "public"."fee_reminders"("reminder_date", "status");

ALTER TABLE IF EXISTS "public"."fee_reminders"
    DROP CONSTRAINT IF EXISTS "fee_reminders_customer_id_fkey",
    ADD CONSTRAINT "fee_reminders_customer_id_fkey"
        FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("customer_id") ON DELETE CASCADE;

-- ---------------------------------------------------------------------------
-- 2d. "attendances" table  <-- THIS IS THE MAIN TABLE CAUSING THE ERROR
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "public"."attendances" (
    "attendance_id" BIGSERIAL PRIMARY KEY,
    "customer_id"   BIGINT NOT NULL,
    "student_id"    BIGINT,                          -- <-- COMMONLY MISSING COLUMN
    "course_id"     BIGINT,                          -- <-- COMMONLY MISSING COLUMN
    "client_id"     BIGINT NOT NULL,
    "date"          DATE NOT NULL,
    "status"        attendance_status NOT NULL DEFAULT 'present',
    "remarks"       VARCHAR(200),
    "marked_by"     UUID NOT NULL,                   -- <-- COMMONLY MISSING (audit)
    "created_id"    UUID NOT NULL,                   -- <-- COMMONLY MISSING (audit)
    "updated_id"    UUID NOT NULL,                   -- <-- COMMONLY MISSING (audit)
    "created_at"    TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    "updated_at"    TIMESTAMPTZ(6) NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 3. ADD MISSING COLUMNS TO "attendances" (if table already existed)
--    These are the columns that trigger the "column `(not available)`" error
--    because schema.prisma expects them but they weren't in the manual CREATE.
-- ============================================================================

DO $$ BEGIN
    ALTER TABLE "public"."attendances" ADD COLUMN "student_id"   BIGINT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "public"."attendances" ADD COLUMN "course_id"    BIGINT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "public"."attendances" ADD COLUMN "marked_by"    UUID;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "public"."attendances" ADD COLUMN "created_id"   UUID;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "public"."attendances" ADD COLUMN "updated_id"   UUID;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "public"."attendances" ADD COLUMN "status"       attendance_status NOT NULL DEFAULT 'present';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "public"."attendances" ADD COLUMN "remarks"      VARCHAR(200);
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "public"."attendances" ADD COLUMN "created_at"   TIMESTAMPTZ(6) NOT NULL DEFAULT NOW();
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "public"."attendances" ADD COLUMN "updated_at"   TIMESTAMPTZ(6) NOT NULL DEFAULT NOW();
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- Backfill NOT NULL audit columns with a safe fallback UUID if they were added NULL
UPDATE "public"."attendances"
SET "marked_by" = COALESCE("marked_by", '00000000-0000-0000-0000-000000000000'::uuid)
WHERE "marked_by" IS NULL;

UPDATE "public"."attendances"
SET "created_id" = COALESCE("created_id", '00000000-0000-0000-0000-000000000000'::uuid)
WHERE "created_id" IS NULL;

UPDATE "public"."attendances"
SET "updated_id" = COALESCE("updated_id", '00000000-0000-0000-0000-000000000000'::uuid)
WHERE "updated_id" IS NULL;

DO $$ BEGIN
    ALTER TABLE "public"."attendances" ALTER COLUMN "marked_by"  SET NOT NULL;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "public"."attendances" ALTER COLUMN "created_id" SET NOT NULL;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "public"."attendances" ALTER COLUMN "updated_id" SET NOT NULL;
EXCEPTION WHEN others THEN NULL; END $$;

-- ============================================================================
-- 4. INDEXES + UNIQUE CONSTRAINT + FOREIGN KEYS for "attendances"
-- ============================================================================

-- Unique constraint: customer_id + student_id + client_id + date
ALTER TABLE IF EXISTS "public"."attendances"
    DROP CONSTRAINT IF EXISTS "attendances_customer_id_student_id_client_id_date_key",
    ADD CONSTRAINT "attendances_customer_id_student_id_client_id_date_key"
        UNIQUE ("customer_id", "student_id", "client_id", "date");

CREATE INDEX IF NOT EXISTS "attendances_customer_id_idx" ON "public"."attendances"("customer_id");
CREATE INDEX IF NOT EXISTS "attendances_student_id_idx"  ON "public"."attendances"("student_id");
CREATE INDEX IF NOT EXISTS "attendances_course_id_idx"   ON "public"."attendances"("course_id");
CREATE INDEX IF NOT EXISTS "attendances_client_id_idx"   ON "public"."attendances"("client_id");
CREATE INDEX IF NOT EXISTS "attendances_date_idx"        ON "public"."attendances"("date");
CREATE INDEX IF NOT EXISTS "attendances_marked_by_idx"   ON "public"."attendances"("marked_by");

-- Foreign keys
ALTER TABLE IF EXISTS "public"."attendances"
    DROP CONSTRAINT IF EXISTS "attendances_customer_id_fkey",
    ADD CONSTRAINT "attendances_customer_id_fkey"
        FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("customer_id") ON DELETE CASCADE;

ALTER TABLE IF EXISTS "public"."attendances"
    DROP CONSTRAINT IF EXISTS "attendances_student_id_fkey",
    ADD CONSTRAINT "attendances_student_id_fkey"
        FOREIGN KEY ("student_id") REFERENCES "public"."students"("student_id") ON DELETE SET NULL;

ALTER TABLE IF EXISTS "public"."attendances"
    DROP CONSTRAINT IF EXISTS "attendances_course_id_fkey",
    ADD CONSTRAINT "attendances_course_id_fkey"
        FOREIGN KEY ("course_id") REFERENCES "public"."courses"("course_id") ON DELETE CASCADE;

ALTER TABLE IF EXISTS "public"."attendances"
    DROP CONSTRAINT IF EXISTS "attendances_marked_by_fkey",
    ADD CONSTRAINT "attendances_marked_by_fkey"
        FOREIGN KEY ("marked_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT;

ALTER TABLE IF EXISTS "public"."attendances"
    DROP CONSTRAINT IF EXISTS "attendances_created_id_fkey",
    ADD CONSTRAINT "attendances_created_id_fkey"
        FOREIGN KEY ("created_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT;

ALTER TABLE IF EXISTS "public"."attendances"
    DROP CONSTRAINT IF EXISTS "attendances_updated_id_fkey",
    ADD CONSTRAINT "attendances_updated_id_fkey"
        FOREIGN KEY ("updated_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT;

-- ============================================================================
-- 5. FIX MISSING COLUMNS IN EXISTING TABLES (schema.prisma vs migrations)
--    Safe idempotent ALTERs only.  These were likely in "lost migrations".
-- ============================================================================

-- 5a. "users" table — columns added by schema but not init migration
DO $$ BEGIN ALTER TABLE "public"."users" ADD COLUMN "avatar" TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "public"."users" ADD COLUMN "email_verified" BOOLEAN NOT NULL DEFAULT FALSE; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "public"."users" ADD COLUMN "account_status" VARCHAR(20) NOT NULL DEFAULT 'active'; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "public"."users" ADD COLUMN "last_login_at" TIMESTAMP(3); EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "public"."users" ADD COLUMN "last_login_ip" VARCHAR(50); EXCEPTION WHEN duplicate_column THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "users_reset_password_token_idx" ON "public"."users"("reset_password_token");
CREATE INDEX IF NOT EXISTS "users_account_status_idx"        ON "public"."users"("account_status");
CREATE INDEX IF NOT EXISTS "users_mobile_idx"               ON "public"."users"("mobile");

-- 5b. "enrollments" table — customer_id + status + updated_id
DO $$ BEGIN ALTER TABLE "public"."enrollments" ADD COLUMN "customer_id" BIGINT; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE "public"."enrollments"
        ADD COLUMN "status" enrollment_status_enum NOT NULL DEFAULT 'active';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "public"."enrollments" ADD COLUMN "updated_id" TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- Backfill customer_id if possible (from customer_details via cd_id through payment_details?)
-- Left as manual fix since there is no direct mapping.

DO $$ BEGIN
    ALTER TABLE "public"."enrollments" ALTER COLUMN "customer_id" SET NOT NULL;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "public"."enrollments" ALTER COLUMN "updated_id" SET NOT NULL;
EXCEPTION WHEN others THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "enrollments_customer_id_idx" ON "public"."enrollments"("customer_id");
CREATE INDEX IF NOT EXISTS "enrollments_course_id_idx"   ON "public"."enrollments"("course_id");
CREATE INDEX IF NOT EXISTS "enrollments_client_id_idx"   ON "public"."enrollments"("client_id");
CREATE INDEX IF NOT EXISTS "enrollments_status_idx"      ON "public"."enrollments"("status");

ALTER TABLE IF EXISTS "public"."enrollments"
    DROP CONSTRAINT IF EXISTS "enrollments_customer_id_fkey",
    ADD CONSTRAINT "enrollments_customer_id_fkey"
        FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("customer_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- 5c. "payment_details" table — student_id + lifecycle_status + invoice_file_path +
--                               invoice_generated_at + updated_id + updated_at
DO $$ BEGIN ALTER TABLE "public"."payment_details" ADD COLUMN "student_id" BIGINT; EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE payment_lifecycle_status AS ENUM ('SUCCESSFUL', 'PENDING_OVERDUE', 'REFUNDED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "public"."payment_details"
        ADD COLUMN "lifecycle_status" payment_lifecycle_status NOT NULL DEFAULT 'PENDING_OVERDUE';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE "public"."payment_details" ADD COLUMN "invoice_file_path"    VARCHAR(500); EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "public"."payment_details" ADD COLUMN "invoice_generated_at" TIMESTAMPTZ(6); EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "public"."payment_details" ADD COLUMN "updated_id"           TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "public"."payment_details" ADD COLUMN "updated_at"           TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(); EXCEPTION WHEN duplicate_column THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "payment_details_customer_id_idx"       ON "public"."payment_details"("customer_id");
CREATE INDEX IF NOT EXISTS "payment_details_cd_id_idx"             ON "public"."payment_details"("cd_id");
CREATE INDEX IF NOT EXISTS "payment_details_student_id_idx"        ON "public"."payment_details"("student_id");
CREATE INDEX IF NOT EXISTS "payment_details_client_id_idx"         ON "public"."payment_details"("client_id");
CREATE INDEX IF NOT EXISTS "payment_details_lifecycle_status_idx"  ON "public"."payment_details"("lifecycle_status");
CREATE INDEX IF NOT EXISTS "payment_details_paid_on_idx"           ON "public"."payment_details"("paid_on");

ALTER TABLE IF EXISTS "public"."payment_details"
    DROP CONSTRAINT IF EXISTS "fk_payment_student",
    ADD CONSTRAINT "fk_payment_student"
        FOREIGN KEY ("student_id") REFERENCES "public"."students"("student_id") ON DELETE SET NULL;

-- ============================================================================
-- 6. "clients" table — requires_master_config + students relation is implicit
-- ============================================================================
DO $$ BEGIN
    ALTER TABLE "public"."clients"
        ADD COLUMN "requires_master_config" BOOLEAN NOT NULL DEFAULT FALSE;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- ============================================================================
-- DONE.
-- ============================================================================
