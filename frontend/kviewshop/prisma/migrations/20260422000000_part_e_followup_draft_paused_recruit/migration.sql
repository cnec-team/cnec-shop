-- Part E followup: ProductStatus.DRAFT + CampaignStatus.PAUSED + Campaign recruit dates

-- AlterEnum: Add DRAFT to ProductStatus
ALTER TYPE "ProductStatus" ADD VALUE IF NOT EXISTS 'DRAFT';

-- AlterEnum: Add PAUSED to CampaignStatus
ALTER TYPE "CampaignStatus" ADD VALUE IF NOT EXISTS 'PAUSED';

-- AlterTable: campaigns - add recruitment period fields
ALTER TABLE "campaigns" ADD COLUMN IF NOT EXISTS "recruit_start_at" TIMESTAMPTZ;
ALTER TABLE "campaigns" ADD COLUMN IF NOT EXISTS "recruit_end_at" TIMESTAMPTZ;
