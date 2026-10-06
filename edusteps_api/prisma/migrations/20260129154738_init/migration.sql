-- CreateEnum
CREATE TYPE "course_rate_type_enum" AS ENUM ('per_hour', 'per_session', 'per_course', 'per_month');

-- CreateEnum
CREATE TYPE "enrollment_status_enum" AS ENUM ('pending', 'active', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "payment_status_enum" AS ENUM ('pending', 'succeeded', 'failed', 'refunded');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "created_ip" TEXT,
    "updated_ip" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "reset_password_token" TEXT,
    "reset_password_expire" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);


-- CreateTable
CREATE TABLE "client_permission" (
    "permission_id" BIGSERIAL NOT NULL,
    "client_id" BIGINT NOT NULL,
    "user_id" TEXT,
    "created_id" TEXT NOT NULL,
    "updated_id" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_permission_pkey" PRIMARY KEY ("permission_id")
);

-- CreateTable
CREATE TABLE "clients" (
    "client_id" BIGSERIAL NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "phone" VARCHAR(50),
    "email" VARCHAR(200),
    "address" VARCHAR(500),
    "payment_provider_account_id" VARCHAR(200),
    "created_id" TEXT NOT NULL,
    "updated_id" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("client_id")
);

-- CreateTable
CREATE TABLE "courses" (
    "course_id" BIGSERIAL NOT NULL,
    "client_id" BIGINT NOT NULL,
    "course_name" VARCHAR(255) NOT NULL,
    "description" VARCHAR(500),
    "rate" DECIMAL(10,2) NOT NULL,
    "rate_type" "course_rate_type_enum" NOT NULL,
    "priority_no" INTEGER NOT NULL,
    "created_id" TEXT NOT NULL,
    "updated_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("course_id")
);

-- CreateTable
CREATE TABLE "customers" (
    "customer_id" BIGSERIAL NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100),
    "mobile" VARCHAR(10) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "address" VARCHAR(200),
    "client_id" BIGINT NOT NULL,
    "created_id" TEXT NOT NULL,
    "updated_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("customer_id")
);

-- CreateTable
CREATE TABLE "enrollments" (
    "enrollment_id" BIGSERIAL NOT NULL,
    "course_id" BIGINT NOT NULL,
    "enrolled_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "next_billing_date" DATE,
    "client_id" BIGINT NOT NULL,
    "created_id" TEXT NOT NULL,
    "updated_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "enrollments_pkey" PRIMARY KEY ("enrollment_id")
);

-- CreateTable
CREATE TABLE "customer_details" (
    "cd_id" BIGSERIAL NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100),
    "subject" VARCHAR(100) NOT NULL,
    "registration_date" DATE NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "deactivate_date" DATE,
    "customer_id" BIGINT NOT NULL,
    "created_id" TEXT NOT NULL,
    "updated_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_details_pkey" PRIMARY KEY ("cd_id")
);

-- CreateTable
CREATE TABLE "payment_details" (
    "id" BIGSERIAL NOT NULL,
    "customer_id" BIGINT NOT NULL,
    "cd_id" BIGINT NOT NULL,
    "client_id" BIGINT NOT NULL,
    "paid_amount" DECIMAL(10,2) NOT NULL,
    "discount_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "payment_mode" VARCHAR(50),
    "transaction_ref" VARCHAR(100),
    "paid_on" DATE NOT NULL DEFAULT CURRENT_DATE,
    "created_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_details_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "customers_mobile_client_id_key" ON "customers"("mobile", "client_id");

-- CreateIndex
CREATE UNIQUE INDEX "customers_email_client_id_key" ON "customers"("email", "client_id");


-- AddForeignKey
ALTER TABLE "client_permission" ADD CONSTRAINT "client_permission_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("client_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("client_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("client_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("course_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payment_details" ADD CONSTRAINT "fk_payment_cd" FOREIGN KEY ("cd_id") REFERENCES "customer_details"("cd_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_details" ADD CONSTRAINT "fk_payment_client" FOREIGN KEY ("client_id") REFERENCES "clients"("client_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_details" ADD CONSTRAINT "fk_payment_customer" FOREIGN KEY ("customer_id") REFERENCES "customers"("customer_id") ON DELETE RESTRICT ON UPDATE CASCADE;
