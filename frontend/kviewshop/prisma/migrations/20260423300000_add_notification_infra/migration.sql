-- AlterTable: User
ALTER TABLE "users" ADD COLUMN "last_login_at" TIMESTAMPTZ;
ALTER TABLE "users" ADD COLUMN "last_login_ip" TEXT;
ALTER TABLE "users" ADD COLUMN "last_login_user_agent" TEXT;
ALTER TABLE "users" ADD COLUMN "dormant_warned_at" TIMESTAMPTZ;
ALTER TABLE "users" ADD COLUMN "dormant_at" TIMESTAMPTZ;
ALTER TABLE "users" ADD COLUMN "birthday" DATE;

-- AlterTable: Cart
ALTER TABLE "carts" ADD COLUMN "reminder_sent_at" TIMESTAMPTZ;

-- AlterTable: Product
ALTER TABLE "products" ADD COLUMN "restock_notification_enabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "products" ADD COLUMN "last_low_stock_alert_at" TIMESTAMPTZ;

-- CreateTable: NotificationLog
CREATE TABLE "notification_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "notification_type" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "error_message" TEXT,
    "payload" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable: CronJobLog
CREATE TABLE "cron_job_logs" (
    "id" TEXT NOT NULL,
    "job_name" TEXT NOT NULL,
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMPTZ,
    "processed" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL,
    "error" TEXT,

    CONSTRAINT "cron_job_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable: RestockSubscription
CREATE TABLE "restock_subscriptions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notified_at" TIMESTAMPTZ,

    CONSTRAINT "restock_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Follow
CREATE TABLE "follows" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "follows_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notification_logs_user_id_created_at_idx" ON "notification_logs"("user_id", "created_at");
CREATE INDEX "notification_logs_notification_type_created_at_idx" ON "notification_logs"("notification_type", "created_at");
CREATE INDEX "cron_job_logs_job_name_started_at_idx" ON "cron_job_logs"("job_name", "started_at");
CREATE UNIQUE INDEX "restock_subscriptions_user_id_product_id_key" ON "restock_subscriptions"("user_id", "product_id");
CREATE INDEX "restock_subscriptions_product_id_idx" ON "restock_subscriptions"("product_id");
CREATE UNIQUE INDEX "follows_user_id_creator_id_key" ON "follows"("user_id", "creator_id");
CREATE INDEX "follows_creator_id_idx" ON "follows"("creator_id");
