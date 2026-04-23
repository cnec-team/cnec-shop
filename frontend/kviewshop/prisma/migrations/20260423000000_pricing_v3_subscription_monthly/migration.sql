-- AlterEnum: ProBillingCycle QUARTERLY -> MONTHLY
ALTER TYPE "ProBillingCycle" ADD VALUE IF NOT EXISTS 'MONTHLY';

-- AlterEnum: SubscriptionStatus add RESTRICTED, DEACTIVATED  
ALTER TYPE "SubscriptionStatus" ADD VALUE IF NOT EXISTS 'RESTRICTED';
ALTER TYPE "SubscriptionStatus" ADD VALUE IF NOT EXISTS 'DEACTIVATED';

-- AlterEnum: BillingPurpose add STANDARD_SUBSCRIPTION
ALTER TYPE "BillingPurpose" ADD VALUE IF NOT EXISTS 'STANDARD_SUBSCRIPTION';

-- AlterTable: brand_subscriptions add new v3 subscription fields
ALTER TABLE "brand_subscriptions" ADD COLUMN IF NOT EXISTS "current_month_campaigns" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "brand_subscriptions" ADD COLUMN IF NOT EXISTS "current_month_messages" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "brand_subscriptions" ADD COLUMN IF NOT EXISTS "current_month_overage_amount" DECIMAL(12,0) NOT NULL DEFAULT 0;
ALTER TABLE "brand_subscriptions" ADD COLUMN IF NOT EXISTS "restricted_at" TIMESTAMPTZ;
ALTER TABLE "brand_subscriptions" ADD COLUMN IF NOT EXISTS "restricted_until" TIMESTAMPTZ;
ALTER TABLE "brand_subscriptions" ADD COLUMN IF NOT EXISTS "deactivated_at" TIMESTAMPTZ;
