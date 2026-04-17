-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('FREE', 'STARTER', 'PRO', 'ENTERPRISE');
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'PAUSED', 'CANCELLED');
CREATE TYPE "MessageCreditType" AS ENUM ('SUBSCRIPTION_FREE', 'PAID');
CREATE TYPE "SubPaymentStatus" AS ENUM ('PAID', 'FAILED', 'REFUNDED');
CREATE TYPE "DmQueueStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'SENT', 'FAILED', 'SKIPPED');
CREATE TYPE "DmSendLogEvent" AS ENUM ('CREATED', 'PICKED', 'SENT', 'FAILED', 'RETRIED');
CREATE TYPE "BrandIgHandleStatus" AS ENUM ('NOT_LINKED', 'PENDING', 'VERIFIED', 'FAILED');
CREATE TYPE "ChannelDeliveryStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'SKIPPED');
CREATE TYPE "CreatorCnecJoinStatus" AS ENUM ('NOT_JOINED', 'JOINED', 'VERIFIED');
CREATE TYPE "IgSyncStatus" AS ENUM ('PENDING', 'SYNCING', 'SUCCESS', 'FAILED');

-- AlterTable: brands (Instagram 연동 필드)
ALTER TABLE "brands" ADD COLUMN "brand_instagram_handle" TEXT;
ALTER TABLE "brands" ADD COLUMN "brand_instagram_handle_status" "BrandIgHandleStatus" NOT NULL DEFAULT 'NOT_LINKED';
ALTER TABLE "brands" ADD COLUMN "brand_instagram_handle_verified_at" TIMESTAMPTZ;
ALTER TABLE "brands" ADD COLUMN "brand_instagram_session_expires_at" TIMESTAMPTZ;
ALTER TABLE "brands" ADD COLUMN "brand_instagram_last_used_at" TIMESTAMPTZ;
ALTER TABLE "brands" ADD COLUMN "brand_instagram_daily_sent_count" INTEGER NOT NULL DEFAULT 0;

-- AlterTable: creators (Instagram 상세 지표 + 연락처 채널)
ALTER TABLE "creators" ADD COLUMN "ig_avg_feed_likes" INTEGER;
ALTER TABLE "creators" ADD COLUMN "ig_avg_feed_comments" INTEGER;
ALTER TABLE "creators" ADD COLUMN "ig_avg_reel_views" INTEGER;
ALTER TABLE "creators" ADD COLUMN "ig_avg_reel_likes" INTEGER;
ALTER TABLE "creators" ADD COLUMN "ig_estimated_reach" INTEGER;
ALTER TABLE "creators" ADD COLUMN "ig_valid_followers" INTEGER;
ALTER TABLE "creators" ADD COLUMN "ig_primary_language" TEXT;
ALTER TABLE "creators" ADD COLUMN "ig_last_post_at" TIMESTAMPTZ;
ALTER TABLE "creators" ADD COLUMN "ig_estimated_cpr_decimal" DECIMAL(10,2);
ALTER TABLE "creators" ADD COLUMN "ig_estimated_ad_fee" DECIMAL(12,0);
ALTER TABLE "creators" ADD COLUMN "audience_gender_ratio" JSONB;
ALTER TABLE "creators" ADD COLUMN "audience_age_ratio" JSONB;
ALTER TABLE "creators" ADD COLUMN "ig_last_synced_at" TIMESTAMPTZ;
ALTER TABLE "creators" ADD COLUMN "ig_sync_status" "IgSyncStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "creators" ADD COLUMN "ig_historical_stats" JSONB;
ALTER TABLE "creators" ADD COLUMN "has_brand_email" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "creators" ADD COLUMN "brand_contact_email" TEXT;
ALTER TABLE "creators" ADD COLUMN "has_phone" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "creators" ADD COLUMN "phone_for_alimtalk" TEXT;
ALTER TABLE "creators" ADD COLUMN "cnec_join_status" "CreatorCnecJoinStatus" NOT NULL DEFAULT 'NOT_JOINED';

-- AlterTable: creator_proposals (메시지 크레딧 + 채널 상태)
ALTER TABLE "creator_proposals" ADD COLUMN "message_credit_id" TEXT;
ALTER TABLE "creator_proposals" ADD COLUMN "in_app_sent_at" TIMESTAMPTZ;
ALTER TABLE "creator_proposals" ADD COLUMN "email_sent_at" TIMESTAMPTZ;
ALTER TABLE "creator_proposals" ADD COLUMN "kakao_sent_at" TIMESTAMPTZ;
ALTER TABLE "creator_proposals" ADD COLUMN "dm_queued_at" TIMESTAMPTZ;
ALTER TABLE "creator_proposals" ADD COLUMN "in_app_status" "ChannelDeliveryStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "creator_proposals" ADD COLUMN "email_status" "ChannelDeliveryStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "creator_proposals" ADD COLUMN "kakao_status" "ChannelDeliveryStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "creator_proposals" ADD COLUMN "dm_status" "ChannelDeliveryStatus" NOT NULL DEFAULT 'SKIPPED';
ALTER TABLE "creator_proposals" ADD COLUMN "use_instagram_dm" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable: brand_subscriptions
CREATE TABLE "brand_subscriptions" (
    "id" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "plan" "SubscriptionPlan" NOT NULL DEFAULT 'FREE',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ,
    "next_billing_at" TIMESTAMPTZ,
    "cancelled_at" TIMESTAMPTZ,
    "monthly_fee" DECIMAL(12,0) NOT NULL DEFAULT 0,
    "included_message_quota" INTEGER NOT NULL DEFAULT 0,
    "current_month_used" INTEGER NOT NULL DEFAULT 0,
    "current_month_reset_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "brand_subscriptions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "brand_subscriptions_brand_id_key" ON "brand_subscriptions"("brand_id");
CREATE INDEX "brand_subscriptions_brand_id_idx" ON "brand_subscriptions"("brand_id");
CREATE INDEX "brand_subscriptions_expires_at_idx" ON "brand_subscriptions"("expires_at");

-- CreateTable: message_credits
CREATE TABLE "message_credits" (
    "id" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "proposal_id" TEXT,
    "type" "MessageCreditType" NOT NULL,
    "cost" DECIMAL(10,0) NOT NULL DEFAULT 0,
    "price_per_message" DECIMAL(10,0) NOT NULL DEFAULT 500,
    "attempted_channels" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "succeeded_channels" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "creator_id" TEXT NOT NULL,
    "sent_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "message_credits_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "message_credits_brand_id_sent_at_idx" ON "message_credits"("brand_id", "sent_at");
CREATE INDEX "message_credits_proposal_id_idx" ON "message_credits"("proposal_id");

-- CreateTable: subscription_payments
CREATE TABLE "subscription_payments" (
    "id" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "subscription_id" TEXT NOT NULL,
    "amount" DECIMAL(12,0) NOT NULL,
    "plan" TEXT NOT NULL,
    "paid_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "portone_payment_id" TEXT,
    "status" "SubPaymentStatus" NOT NULL DEFAULT 'PAID',
    "period_start" TIMESTAMPTZ NOT NULL,
    "period_end" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "subscription_payments_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "subscription_payments_brand_id_idx" ON "subscription_payments"("brand_id");
CREATE INDEX "subscription_payments_subscription_id_idx" ON "subscription_payments"("subscription_id");

-- CreateTable: dm_send_queues
CREATE TABLE "dm_send_queues" (
    "id" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "proposal_id" TEXT NOT NULL,
    "instagram_username" TEXT NOT NULL,
    "message_body" TEXT NOT NULL,
    "status" "DmQueueStatus" NOT NULL DEFAULT 'PENDING',
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "last_attempted_at" TIMESTAMPTZ,
    "sent_at" TIMESTAMPTZ,
    "fail_reason" TEXT,
    "brand_instagram_account" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "dm_send_queues_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "dm_send_queues_brand_id_status_idx" ON "dm_send_queues"("brand_id", "status");
CREATE INDEX "dm_send_queues_status_priority_idx" ON "dm_send_queues"("status", "priority");

-- CreateTable: dm_send_logs
CREATE TABLE "dm_send_logs" (
    "id" TEXT NOT NULL,
    "queue_id" TEXT NOT NULL,
    "event" "DmSendLogEvent" NOT NULL,
    "detail" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "dm_send_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "dm_send_logs_queue_id_idx" ON "dm_send_logs"("queue_id");

-- AddForeignKey
ALTER TABLE "brand_subscriptions" ADD CONSTRAINT "brand_subscriptions_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "message_credits" ADD CONSTRAINT "message_credits_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "message_credits" ADD CONSTRAINT "message_credits_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "creators"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "creator_proposals" ADD CONSTRAINT "creator_proposals_message_credit_id_fkey" FOREIGN KEY ("message_credit_id") REFERENCES "message_credits"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "subscription_payments" ADD CONSTRAINT "subscription_payments_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "subscription_payments" ADD CONSTRAINT "subscription_payments_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "brand_subscriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "dm_send_queues" ADD CONSTRAINT "dm_send_queues_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "dm_send_queues" ADD CONSTRAINT "dm_send_queues_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "creators"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "dm_send_queues" ADD CONSTRAINT "dm_send_queues_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "creator_proposals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "dm_send_logs" ADD CONSTRAINT "dm_send_logs_queue_id_fkey" FOREIGN KEY ("queue_id") REFERENCES "dm_send_queues"("id") ON DELETE CASCADE ON UPDATE CASCADE;
