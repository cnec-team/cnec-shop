-- CreateEnum
CREATE TYPE "BillingPurpose" AS ENUM ('PRO_SUBSCRIPTION', 'STANDARD_CHARGE');

-- CreateEnum
CREATE TYPE "BillingPaymentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'WEBHOOK_CONFIRMED', 'FAILED', 'CANCELLED', 'REFUND_REQUESTED', 'REFUND_REJECTED', 'REFUNDED', 'PARTIALLY_REFUNDED');

-- CreateTable
CREATE TABLE "billing_payments" (
    "id" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "subscription_id" TEXT,
    "purpose" "BillingPurpose" NOT NULL,
    "target_plan" "BrandPlanV3",
    "billing_cycle" "ProBillingCycle",
    "amount" DECIMAL(12,0) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'KRW',
    "order_id" TEXT NOT NULL,
    "order_name" TEXT NOT NULL,
    "payment_key" TEXT,
    "method" TEXT,
    "status" "BillingPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "refunded_at" TIMESTAMPTZ,
    "refunded_amount" DECIMAL(12,0),
    "refund_reason" TEXT,
    "refund_approved_by" TEXT,
    "refund_requested_at" TIMESTAMPTZ,
    "prior_plan_snapshot" JSONB,
    "webhook_received_at" TIMESTAMPTZ,
    "requested_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approved_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "raw_response" JSONB,
    "raw_webhook" JSONB,

    CONSTRAINT "billing_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "billing_payments_order_id_key" ON "billing_payments"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "billing_payments_payment_key_key" ON "billing_payments"("payment_key");

-- CreateIndex
CREATE INDEX "billing_payments_brand_id_status_idx" ON "billing_payments"("brand_id", "status");

-- CreateIndex
CREATE INDEX "billing_payments_status_requested_at_idx" ON "billing_payments"("status", "requested_at");

-- CreateIndex
CREATE INDEX "billing_payments_brand_id_purpose_status_requested_at_idx" ON "billing_payments"("brand_id", "purpose", "status", "requested_at");

-- AddForeignKey
ALTER TABLE "billing_payments" ADD CONSTRAINT "billing_payments_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_payments" ADD CONSTRAINT "billing_payments_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "brand_subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
