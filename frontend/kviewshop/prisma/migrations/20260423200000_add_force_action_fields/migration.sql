-- AlterTable
ALTER TABLE "campaigns" ADD COLUMN     "force_ended_at" TIMESTAMPTZ,
ADD COLUMN     "force_ended_by" TEXT,
ADD COLUMN     "force_ended_reason" TEXT,
ADD COLUMN     "hidden_at" TIMESTAMPTZ,
ADD COLUMN     "hidden_by" TEXT,
ADD COLUMN     "hidden_reason" TEXT,
ADD COLUMN     "is_hidden" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "pg_cancel_id" TEXT,
ADD COLUMN     "refund_reason" TEXT,
ADD COLUMN     "refund_type" VARCHAR(10),
ADD COLUMN     "refunded_amount" DECIMAL(12,0),
ADD COLUMN     "refunded_at" TIMESTAMPTZ,
ADD COLUMN     "refunded_by" TEXT;
