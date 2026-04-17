-- RenameEnumValue: CREATOR_PICK → PRODUCT_PICK
UPDATE "creator_proposals" SET "type" = 'PRODUCT_PICK' WHERE "type" = 'CREATOR_PICK';
UPDATE "proposal_templates" SET "type" = 'PRODUCT_PICK' WHERE "type" = 'CREATOR_PICK';

-- CreateTable: creator_filter_presets
CREATE TABLE "creator_filter_presets" (
    "id" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "filters" JSONB NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "creator_filter_presets_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "creator_filter_presets_brand_id_idx" ON "creator_filter_presets"("brand_id");

-- AddForeignKey
ALTER TABLE "creator_filter_presets" ADD CONSTRAINT "creator_filter_presets_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;
