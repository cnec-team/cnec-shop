-- AlterTable
ALTER TABLE "brands" ADD COLUMN     "custom_commission_rate" INTEGER,
ADD COLUMN     "suspended_at" TIMESTAMPTZ,
ADD COLUMN     "suspended_by" TEXT,
ADD COLUMN     "suspended_reason" TEXT;

-- AlterTable
ALTER TABLE "creators" ADD COLUMN     "suspended_at" TIMESTAMPTZ,
ADD COLUMN     "suspended_by" TEXT,
ADD COLUMN     "suspended_reason" TEXT;

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "actor_role" VARCHAR(30) NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "target_type" VARCHAR(30) NOT NULL,
    "target_id" TEXT NOT NULL,
    "payload" JSONB,
    "reason" TEXT,
    "ip_address" VARCHAR(50),
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_logs_actor_id_created_at_idx" ON "audit_logs"("actor_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_target_type_target_id_idx" ON "audit_logs"("target_type", "target_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_created_at_idx" ON "audit_logs"("action", "created_at");
