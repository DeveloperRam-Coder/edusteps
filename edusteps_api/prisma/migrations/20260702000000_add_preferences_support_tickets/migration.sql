-- CreateTable: user_preferences
CREATE TABLE IF NOT EXISTS "public"."user_preferences" (
    "id"                  BIGSERIAL PRIMARY KEY,
    "user_id"             UUID NOT NULL,
    "theme"               VARCHAR(10) NOT NULL DEFAULT 'system',
    "language"            VARCHAR(10) NOT NULL DEFAULT 'en',
    "email_notifications" BOOLEAN NOT NULL DEFAULT true,
    "sms_reminders"       BOOLEAN NOT NULL DEFAULT true,
    "marketing_emails"    BOOLEAN NOT NULL DEFAULT false,
    "created_at"          TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    "updated_at"          TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    CONSTRAINT "user_preferences_user_id_fkey"
        FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "user_preferences_user_id_key" ON "public"."user_preferences"("user_id");
CREATE INDEX IF NOT EXISTS "user_preferences_user_id_idx" ON "public"."user_preferences"("user_id");

-- CreateTable: support_tickets
CREATE TABLE IF NOT EXISTS "public"."support_tickets" (
    "id"         BIGSERIAL PRIMARY KEY,
    "user_id"    UUID NOT NULL,
    "subject"    VARCHAR(200) NOT NULL,
    "category"   VARCHAR(50) NOT NULL,
    "message"    TEXT NOT NULL,
    "status"     VARCHAR(20) NOT NULL DEFAULT 'open',
    "priority"   VARCHAR(20) NOT NULL DEFAULT 'medium',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    CONSTRAINT "support_tickets_user_id_fkey"
        FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "support_tickets_user_id_idx"    ON "public"."support_tickets"("user_id");
CREATE INDEX IF NOT EXISTS "support_tickets_status_idx"     ON "public"."support_tickets"("status");
CREATE INDEX IF NOT EXISTS "support_tickets_created_at_idx" ON "public"."support_tickets"("created_at");
