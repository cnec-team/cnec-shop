-- CreateEnum
CREATE TYPE "BrandPlanV3" AS ENUM ('TRIAL', 'STANDARD', 'PRO');

-- CreateEnum
CREATE TYPE "ProBillingCycle" AS ENUM ('QUARTERLY', 'ANNUAL');

-- CreateEnum
CREATE TYPE "SuspiciousActivityType" AS ENUM ('RAPID_DETAIL_VIEW', 'MASS_GROUP_ADD', 'REPETITIVE_SEARCH', 'API_RATE_LIMIT_HIT', 'EXCEL_EXPORT_ATTEMPT');

-- AlterEnum
ALTER TYPE "SubscriptionPlan" ADD VALUE 'TRIAL';
ALTER TYPE "SubscriptionPlan" ADD VALUE 'STANDARD';

-- AlterTable
ALTER TABLE "brand_subscriptions" ADD COLUMN     "billing_key" TEXT,
ADD COLUMN     "daily_db_viewed_at" TIMESTAMPTZ,
ADD COLUMN     "daily_db_viewed_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "monthly_detail_view_used" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "plan_v3" "BrandPlanV3",
ADD COLUMN     "prepaid_balance" DECIMAL(12,0) NOT NULL DEFAULT 0,
ADD COLUMN     "pro_auto_renew" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "pro_billing_cycle" "ProBillingCycle",
ADD COLUMN     "pro_expires_at" TIMESTAMPTZ,
ADD COLUMN     "pro_started_at" TIMESTAMPTZ,
ADD COLUMN     "shop_commission_rate" DECIMAL(4,2) NOT NULL DEFAULT 10.0,
ADD COLUMN     "trial_ends_at" TIMESTAMPTZ,
ADD COLUMN     "trial_started_at" TIMESTAMPTZ,
ADD COLUMN     "trial_used_campaigns" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "trial_used_detail_views" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "trial_used_messages" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "creator_proposals" ADD COLUMN     "match_score" DECIMAL(5,2);

-- AlterTable
ALTER TABLE "creators" ADD COLUMN     "accepting_proposals" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "current_month_proposals" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "monthly_proposal_limit" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "proposal_reset_at" TIMESTAMPTZ;

-- CreateTable
CREATE TABLE "campaign_charge_logs" (
    "id" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "subscription_id" TEXT,
    "campaign_id" TEXT NOT NULL,
    "plan_v3" "BrandPlanV3" NOT NULL,
    "charge_amount" DECIMAL(10,0) NOT NULL DEFAULT 0,
    "charged_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_charge_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detail_view_logs" (
    "id" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "subscription_id" TEXT,
    "creator_id" TEXT NOT NULL,
    "plan_v3" "BrandPlanV3" NOT NULL,
    "is_free_quota" BOOLEAN NOT NULL DEFAULT true,
    "charge_amount" DECIMAL(10,0) NOT NULL DEFAULT 0,
    "viewed_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "detail_view_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suspicious_activity_logs" (
    "id" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "activityType" "SuspiciousActivityType" NOT NULL,
    "detail" JSONB,
    "severity" INTEGER NOT NULL DEFAULT 1,
    "detected_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMPTZ,

    CONSTRAINT "suspicious_activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "campaign_charge_logs_brand_id_charged_at_idx" ON "campaign_charge_logs"("brand_id", "charged_at");

-- CreateIndex
CREATE INDEX "detail_view_logs_brand_id_viewed_at_idx" ON "detail_view_logs"("brand_id", "viewed_at");

-- CreateIndex
CREATE INDEX "suspicious_activity_logs_brand_id_detected_at_idx" ON "suspicious_activity_logs"("brand_id", "detected_at");

-- CreateIndex
CREATE INDEX "suspicious_activity_logs_severity_resolved_at_idx" ON "suspicious_activity_logs"("severity", "resolved_at");

-- CreateIndex
CREATE INDEX "creator_proposals_brand_id_creator_id_created_at_idx" ON "creator_proposals"("brand_id", "creator_id", "created_at");

-- AddForeignKey
ALTER TABLE "campaign_charge_logs" ADD CONSTRAINT "campaign_charge_logs_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_charge_logs" ADD CONSTRAINT "campaign_charge_logs_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "brand_subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_charge_logs" ADD CONSTRAINT "campaign_charge_logs_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detail_view_logs" ADD CONSTRAINT "detail_view_logs_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detail_view_logs" ADD CONSTRAINT "detail_view_logs_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "brand_subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detail_view_logs" ADD CONSTRAINT "detail_view_logs_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "creators"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suspicious_activity_logs" ADD CONSTRAINT "suspicious_activity_logs_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
