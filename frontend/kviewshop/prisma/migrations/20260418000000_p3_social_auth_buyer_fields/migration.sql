-- P3: Social Auth + Buyer fields + PasswordResetToken

-- AlterTable: buyers — add social auth & security fields
ALTER TABLE "buyers" ADD COLUMN IF NOT EXISTS "social_provider" VARCHAR(20);
ALTER TABLE "buyers" ADD COLUMN IF NOT EXISTS "social_provider_id" VARCHAR(100);
ALTER TABLE "buyers" ADD COLUMN IF NOT EXISTS "tier" VARCHAR(20) NOT NULL DEFAULT 'ROOKIE';
ALTER TABLE "buyers" ADD COLUMN IF NOT EXISTS "created_via" VARCHAR(20);
ALTER TABLE "buyers" ADD COLUMN IF NOT EXISTS "created_at_shop_id" TEXT;
ALTER TABLE "buyers" ADD COLUMN IF NOT EXISTS "failed_login_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "buyers" ADD COLUMN IF NOT EXISTS "locked_until" TIMESTAMPTZ;

-- CreateIndex: unique on social_provider_id
CREATE UNIQUE INDEX IF NOT EXISTS "buyers_social_provider_id_key" ON "buyers"("social_provider_id");

-- CreateIndex: social_provider_id lookup
CREATE INDEX IF NOT EXISTS "buyers_social_provider_id_idx" ON "buyers"("social_provider_id");

-- CreateTable: password_reset_tokens
CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "token" VARCHAR(128) NOT NULL,
    "buyer_id" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "used_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: unique on token
CREATE UNIQUE INDEX IF NOT EXISTS "password_reset_tokens_token_key" ON "password_reset_tokens"("token");

-- CreateIndex: buyer_id lookup
CREATE INDEX IF NOT EXISTS "password_reset_tokens_buyer_id_idx" ON "password_reset_tokens"("buyer_id");

-- CreateIndex: token lookup
CREATE INDEX IF NOT EXISTS "password_reset_tokens_token_idx" ON "password_reset_tokens"("token");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'password_reset_tokens_buyer_id_fkey'
    ) THEN
        ALTER TABLE "password_reset_tokens"
            ADD CONSTRAINT "password_reset_tokens_buyer_id_fkey"
            FOREIGN KEY ("buyer_id") REFERENCES "buyers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
