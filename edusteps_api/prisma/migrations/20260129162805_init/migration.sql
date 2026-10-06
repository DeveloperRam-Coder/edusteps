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

-- AddForeignKey
ALTER TABLE "payment_details" ADD CONSTRAINT "fk_payment_cd" FOREIGN KEY ("cd_id") REFERENCES "customer_details"("cd_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_details" ADD CONSTRAINT "fk_payment_client" FOREIGN KEY ("client_id") REFERENCES "clients"("client_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_details" ADD CONSTRAINT "fk_payment_customer" FOREIGN KEY ("customer_id") REFERENCES "customers"("customer_id") ON DELETE RESTRICT ON UPDATE CASCADE;
