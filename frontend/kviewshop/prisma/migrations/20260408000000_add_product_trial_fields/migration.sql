-- AlterEnum: Add new values to SampleRequestStatus
ALTER TYPE "SampleRequestStatus" ADD VALUE IF NOT EXISTS 'cancelled';
ALTER TYPE "SampleRequestStatus" ADD VALUE IF NOT EXISTS 'decided';

-- CreateEnum: SampleRequestDecision
DO $$ BEGIN
  CREATE TYPE "SampleRequestDecision" AS ENUM ('PROCEED', 'PASS');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AlterTable: sample_requests - change status to enum type (idempotent)
DO $$ BEGIN
  ALTER TABLE "sample_requests" ALTER COLUMN "status" TYPE "SampleRequestStatus" USING "status"::"SampleRequestStatus";
EXCEPTION
  WHEN others THEN null;
END $$;
ALTER TABLE "sample_requests" ALTER COLUMN "status" SET DEFAULT 'pending'::"SampleRequestStatus";

-- AlterTable: sample_requests - add product trial fields
ALTER TABLE "sample_requests" ADD COLUMN IF NOT EXISTS "product_id" TEXT;
ALTER TABLE "sample_requests" ADD COLUMN IF NOT EXISTS "decision" "SampleRequestDecision";
ALTER TABLE "sample_requests" ADD COLUMN IF NOT EXISTS "reject_reason" TEXT;
ALTER TABLE "sample_requests" ADD COLUMN IF NOT EXISTS "pass_reason" TEXT;
ALTER TABLE "sample_requests" ADD COLUMN IF NOT EXISTS "responded_at" TIMESTAMPTZ;
ALTER TABLE "sample_requests" ADD COLUMN IF NOT EXISTS "shipped_at" TIMESTAMPTZ;
ALTER TABLE "sample_requests" ADD COLUMN IF NOT EXISTS "received_at" TIMESTAMPTZ;
ALTER TABLE "sample_requests" ADD COLUMN IF NOT EXISTS "decided_at" TIMESTAMPTZ;
ALTER TABLE "sample_requests" ADD COLUMN IF NOT EXISTS "converted_to" TEXT;

-- AlterTable: products - add allow_trial field
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "allow_trial" BOOLEAN NOT NULL DEFAULT true;

-- AddForeignKey: sample_requests.product_id -> products.id (idempotent)
DO $$ BEGIN
  ALTER TABLE "sample_requests" ADD CONSTRAINT "sample_requests_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "sample_requests_brand_id_status_idx" ON "sample_requests"("brand_id", "status");
CREATE INDEX IF NOT EXISTS "sample_requests_creator_id_status_idx" ON "sample_requests"("creator_id", "status");
