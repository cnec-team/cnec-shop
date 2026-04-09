-- CreateTable
CREATE TABLE "creator_product_contents" (
    "id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "type" VARCHAR(30) NOT NULL DEFAULT 'INSTAGRAM_REEL',
    "url" TEXT NOT NULL,
    "embed_url" TEXT,
    "caption" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "creator_product_contents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "creator_product_contents_creator_id_product_id_url_key" ON "creator_product_contents"("creator_id", "product_id", "url");

-- AddForeignKey
ALTER TABLE "creator_product_contents" ADD CONSTRAINT "creator_product_contents_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "creators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_product_contents" ADD CONSTRAINT "creator_product_contents_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
