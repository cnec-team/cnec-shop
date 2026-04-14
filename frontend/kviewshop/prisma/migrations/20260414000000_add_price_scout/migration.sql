-- CreateEnum
CREATE TYPE "PriceChannel" AS ENUM ('BRAND_INPUT', 'NAVER_API');

-- CreateEnum
CREATE TYPE "PriceBadgeType" AS ENUM ('LOWEST', 'EXCLUSIVE', 'CAUTION', 'UNKNOWN');

-- CreateTable
CREATE TABLE "product_price_data" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "channel" "PriceChannel" NOT NULL,
    "channel_name" VARCHAR(50) NOT NULL,
    "price" DECIMAL(10,0) NOT NULL,
    "url" TEXT,
    "crawled_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_lowest" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_price_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_badges" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "badgeType" "PriceBadgeType" NOT NULL,
    "message" TEXT,
    "valid_until" TIMESTAMPTZ,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_badges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_price_data_product_id_channel_idx" ON "product_price_data"("product_id", "channel");

-- CreateIndex
CREATE UNIQUE INDEX "price_badges_product_id_key" ON "price_badges"("product_id");

-- AddForeignKey
ALTER TABLE "product_price_data" ADD CONSTRAINT "product_price_data_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_badges" ADD CONSTRAINT "price_badges_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
