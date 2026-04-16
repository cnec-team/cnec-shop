-- CreateEnum
CREATE TYPE "ProposalType" AS ENUM ('GONGGU', 'CREATOR_PICK');
CREATE TYPE "ProposalStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED');

-- AlterTable: Add Instagram data fields to creators
ALTER TABLE "creators" ADD COLUMN "ig_followers" INTEGER;
ALTER TABLE "creators" ADD COLUMN "ig_following" INTEGER;
ALTER TABLE "creators" ADD COLUMN "ig_posts_count" INTEGER;
ALTER TABLE "creators" ADD COLUMN "ig_bio" TEXT;
ALTER TABLE "creators" ADD COLUMN "ig_category" TEXT;
ALTER TABLE "creators" ADD COLUMN "ig_verified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "creators" ADD COLUMN "ig_external_url" TEXT;
ALTER TABLE "creators" ADD COLUMN "ig_is_business_account" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "creators" ADD COLUMN "ig_engagement_rate" DECIMAL(5,2);
ALTER TABLE "creators" ADD COLUMN "ig_data_imported_at" TIMESTAMPTZ;
ALTER TABLE "creators" ADD COLUMN "ig_profile_image_r2_url" TEXT;
ALTER TABLE "creators" ADD COLUMN "ig_tier" VARCHAR(20);
ALTER TABLE "creators" ADD COLUMN "ig_recent_post_thumbnails" JSONB;

-- CreateIndex
CREATE INDEX "creators_ig_followers_idx" ON "creators"("ig_followers");
CREATE INDEX "creators_ig_category_idx" ON "creators"("ig_category");
CREATE INDEX "creators_ig_tier_idx" ON "creators"("ig_tier");

-- CreateTable: creator_proposals
CREATE TABLE "creator_proposals" (
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

-- CreateIndex
CREATE INDEX "creator_proposals_brand_id_status_idx" ON "creator_proposals"("brand_id", "status");
CREATE INDEX "creator_proposals_creator_id_status_idx" ON "creator_proposals"("creator_id", "status");

-- AddForeignKey
ALTER TABLE "creator_proposals" ADD CONSTRAINT "creator_proposals_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "creator_proposals" ADD CONSTRAINT "creator_proposals_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "creators"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "creator_proposals" ADD CONSTRAINT "creator_proposals_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "creator_proposals" ADD CONSTRAINT "creator_proposals_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "proposal_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable: creator_groups
CREATE TABLE "creator_groups" (
    "id" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "creator_groups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "creator_groups_brand_id_idx" ON "creator_groups"("brand_id");

-- AddForeignKey
ALTER TABLE "creator_groups" ADD CONSTRAINT "creator_groups_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable: creator_group_members
CREATE TABLE "creator_group_members" (
    "id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "memo" TEXT,
    "added_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "creator_group_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "creator_group_members_group_id_creator_id_key" ON "creator_group_members"("group_id", "creator_id");

-- AddForeignKey
ALTER TABLE "creator_group_members" ADD CONSTRAINT "creator_group_members_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "creator_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "creator_group_members" ADD CONSTRAINT "creator_group_members_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "creators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: proposal_templates
CREATE TABLE "proposal_templates" (
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

-- CreateIndex
CREATE INDEX "proposal_templates_brand_id_idx" ON "proposal_templates"("brand_id");

-- AddForeignKey
ALTER TABLE "proposal_templates" ADD CONSTRAINT "proposal_templates_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: CampaignParticipation -> Creator
ALTER TABLE "campaign_participations" ADD CONSTRAINT "campaign_participations_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "creators"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
