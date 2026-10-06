ALTER TABLE "public"."customers"
DROP COLUMN IF EXISTS "parent_phone";

UPDATE "public"."payment_details"
SET "payment_mode" = CASE
  WHEN UPPER(COALESCE("payment_mode", '')) IN ('CASH') THEN 'CASH'
  WHEN UPPER(COALESCE("payment_mode", '')) IN ('CARD') THEN 'CARD'
  WHEN UPPER(COALESCE("payment_mode", '')) IN ('UPI') THEN 'UPI'
  WHEN UPPER(REPLACE(COALESCE("payment_mode", ''), '-', '_')) IN ('BANK_TRANSFER', 'BANK', 'NETBANKING', 'NET_BANKING', 'RAZORPAY') THEN 'BANK_TRANSFER'
  ELSE 'CASH'
END;
