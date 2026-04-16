-- AlterTable: Creator — onboarding + category/sns metadata
-- These columns were added to schema.prisma on 2026-04-15 but never had a migration file.
-- Idempotent (IF NOT EXISTS) so safe to run on DBs that already received these via `db push`.
ALTER TABLE "creators"
  ADD COLUMN IF NOT EXISTS "onboarding_status"   VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS "categories"          TEXT[]      NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "sns_channels"        JSONB,
  ADD COLUMN IF NOT EXISTS "selling_experience"  BOOLEAN,
  ADD COLUMN IF NOT EXISTS "avg_revenue"         VARCHAR(30);
