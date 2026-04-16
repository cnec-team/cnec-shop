-- Idempotent migration: safe to re-run if partially applied.

-- CreateEnum (idempotent via DO block)
DO $$ BEGIN
  CREATE TYPE "ProposalType" AS ENUM ('GONGGU', 'CREATOR_PICK');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "ProposalStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AlterTable: Add Instagram data fields to creators (idempotent)
ALTER TABLE "creators" ADD COLUMN IF NOT EXISTS "ig_followers" INTEGER;
ALTER TABLE "creators" ADD COLUMN IF NOT EXISTS "ig_following" INTEGER;
ALTER TABLE "creators" ADD COLUMN IF NOT EXISTS "ig_posts_count" INTEGER;
ALTER TABLE "creators" ADD COLUMN IF NOT EXISTS "ig_bio" TEXT;
ALTER TABLE "creators" ADD COLUMN IF NOT EXISTS "ig_category" TEXT;
ALTER TABLE "creators" ADD COLUMN IF NOT EXISTS "ig_verified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "creators" ADD COLUMN IF NOT EXISTS "ig_external_url" TEXT;
ALTER TABLE "creators" ADD COLUMN IF NOT EXISTS "ig_is_business_account" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "creators" ADD COLUMN IF NOT EXISTS "ig_engagement_rate" DECIMAL(5,2);
ALTER TABLE "creators" ADD COLUMN IF NOT EXISTS "ig_data_imported_at" TIMESTAMPTZ;
ALTER TABLE "creators" ADD COLUMN IF NOT EXISTS "ig_profile_image_r2_url" TEXT;
ALTER TABLE "creators" ADD COLUMN IF NOT EXISTS "ig_tier" VARCHAR(20);
ALTER TABLE "creators" ADD COLUMN IF NOT EXISTS "ig_recent_post_thumbnails" JSONB;

-- CreateIndex (idempotent)
CREATE INDEX IF NOT EXISTS "creators_ig_followers_idx" ON "creators"("ig_followers");
CREATE INDEX IF NOT EXISTS "creators_ig_category_idx" ON "creators"("ig_category");
CREATE INDEX IF NOT EXISTS "creators_ig_tier_idx" ON "creators"("ig_tier");

-- CreateTable: proposal_templates (MUST be before creator_proposals due to FK)
CREATE TABLE IF NOT EXISTS "proposal_templates" (
    "id" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "type" "ProposalType" NOT NULL,
    "subject" VARCHAR(200),
    "body" TEXT NOT NULL,
    "commission_rate" DECIMAL(5,2),
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proposal_templates_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "proposal_templates_brand_id_idx" ON "proposal_templates"("brand_id");

DO $$ BEGIN
  ALTER TABLE "proposal_templates" ADD CONSTRAINT "proposal_templates_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateTable: creator_proposals
CREATE TABLE IF NOT EXISTS "creator_proposals" (
    "id" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "type" "ProposalType" NOT NULL,
    "campaign_id" TEXT,
    "template_id" TEXT,
    "message" TEXT,
    "commission_rate" DECIMAL(5,2),
    "status" "ProposalStatus" NOT NULL DEFAULT 'PENDING',
    "responded_at" TIMESTAMPTZ,
    "rejection_reason" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "creator_proposals_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "creator_proposals_brand_id_status_idx" ON "creator_proposals"("brand_id", "status");
CREATE INDEX IF NOT EXISTS "creator_proposals_creator_id_status_idx" ON "creator_proposals"("creator_id", "status");

DO $$ BEGIN
  ALTER TABLE "creator_proposals" ADD CONSTRAINT "creator_proposals_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "creator_proposals" ADD CONSTRAINT "creator_proposals_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "creators"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "creator_proposals" ADD CONSTRAINT "creator_proposals_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "creator_proposals" ADD CONSTRAINT "creator_proposals_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "proposal_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateTable: creator_groups
CREATE TABLE IF NOT EXISTS "creator_groups" (
    "id" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "creator_groups_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "creator_groups_brand_id_idx" ON "creator_groups"("brand_id");

DO $$ BEGIN
  ALTER TABLE "creator_groups" ADD CONSTRAINT "creator_groups_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateTable: creator_group_members
CREATE TABLE IF NOT EXISTS "creator_group_members" (
    "id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "memo" TEXT,
    "added_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "creator_group_members_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "creator_group_members_group_id_creator_id_key" ON "creator_group_members"("group_id", "creator_id");

DO $$ BEGIN
  ALTER TABLE "creator_group_members" ADD CONSTRAINT "creator_group_members_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "creator_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "creator_group_members" ADD CONSTRAINT "creator_group_members_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "creators"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey: CampaignParticipation -> Creator (idempotent)
DO $$ BEGIN
  ALTER TABLE "campaign_participations" ADD CONSTRAINT "campaign_participations_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "creators"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
