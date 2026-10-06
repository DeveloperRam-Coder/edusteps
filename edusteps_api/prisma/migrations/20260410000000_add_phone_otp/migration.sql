-- AlterTable
ALTER TABLE "users" 
ADD COLUMN "phone_otp" TEXT,
ADD COLUMN "phone_otp_expire" TIMESTAMP(3),
ADD COLUMN "phone_otp_attempts" INTEGER NOT NULL DEFAULT 0;
