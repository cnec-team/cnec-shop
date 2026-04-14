-- CreateTable
CREATE TABLE "ai_gonggu_tips" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "strategy" VARCHAR(20) NOT NULL,
    "hook" TEXT NOT NULL,
    "target_message" TEXT NOT NULL,
    "estimated_cvr" VARCHAR(20) NOT NULL,
    "caption" TEXT NOT NULL,
    "hashtags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "reasoning" TEXT,
    "model_used" TEXT NOT NULL DEFAULT 'claude-sonnet-4-6',
    "generated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_gonggu_tips_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_gonggu_tips_product_id_idx" ON "ai_gonggu_tips"("product_id");

-- AddForeignKey
ALTER TABLE "ai_gonggu_tips" ADD CONSTRAINT "ai_gonggu_tips_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
