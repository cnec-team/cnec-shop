-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('super_admin', 'brand_admin', 'creator', 'buyer');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('pending', 'active', 'suspended');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "ProductCategory" AS ENUM ('skincare', 'makeup', 'hair', 'body', 'etc');

-- CreateEnum
CREATE TYPE "CampaignType" AS ENUM ('GONGGU', 'ALWAYS');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'RECRUITING', 'ACTIVE', 'ENDED');

-- CreateEnum
CREATE TYPE "CampaignRecruitmentType" AS ENUM ('OPEN', 'APPROVAL');

-- CreateEnum
CREATE TYPE "CampaignParticipationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ShopItemType" AS ENUM ('GONGGU', 'PICK');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'PREPARING', 'SHIPPING', 'DELIVERED', 'CONFIRMED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "ConversionType" AS ENUM ('DIRECT', 'INDIRECT');

-- CreateEnum
CREATE TYPE "ConversionStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SettlementStatus" AS ENUM ('PENDING', 'COMPLETED', 'CARRIED_OVER');

-- CreateEnum
CREATE TYPE "ShippingFeeType" AS ENUM ('FREE', 'PAID', 'CONDITIONAL_FREE');

-- CreateEnum
CREATE TYPE "BannerType" AS ENUM ('HORIZONTAL', 'VERTICAL');

-- CreateEnum
CREATE TYPE "BannerLinkType" AS ENUM ('EXTERNAL', 'COLLECTION', 'PRODUCT');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('ORDER', 'SHIPPING', 'SETTLEMENT', 'CAMPAIGN', 'SYSTEM');

-- CreateEnum
CREATE TYPE "MocraStatus" AS ENUM ('green', 'yellow', 'red');

-- CreateEnum
CREATE TYPE "SkinType" AS ENUM ('combination', 'dry', 'oily', 'normal', 'oily_sensitive');

-- CreateEnum
CREATE TYPE "PersonalColor" AS ENUM ('spring_warm', 'summer_cool', 'autumn_warm', 'winter_cool');

-- CreateEnum
CREATE TYPE "SampleRequestStatus" AS ENUM ('pending', 'approved', 'shipped', 'received', 'rejected');

-- CreateEnum
CREATE TYPE "SupportTicketCategory" AS ENUM ('product', 'cs');

-- CreateEnum
CREATE TYPE "SupportTicketStatus" AS ENUM ('open', 'resolved');

-- CreateEnum
CREATE TYPE "MallSubscriptionStatus" AS ENUM ('active', 'paused', 'cancelled');

-- CreateEnum
CREATE TYPE "CommunityPostType" AS ENUM ('general', 'review', 'question', 'announcement');

-- CreateEnum
CREATE TYPE "PointsHistoryType" AS ENUM ('review_text', 'review_instagram', 'purchase', 'referral', 'event', 'expiry', 'use_order', 'admin_adjustment');

-- CreateEnum
CREATE TYPE "CreatorPointType" AS ENUM ('SIGNUP_BONUS', 'PERSONA_COMPLETE', 'FIRST_PRODUCT', 'FIRST_SALE', 'REFERRAL_INVITE', 'REFERRAL_SALE', 'WEEKLY_ACTIVE', 'MONTHLY_TARGET', 'WITHDRAW', 'ADMIN_ADJUST');

-- CreateEnum
CREATE TYPE "CreatorReferralStatus" AS ENUM ('PENDING', 'SIGNUP_COMPLETE', 'FIRST_SALE_COMPLETE');

-- CreateEnum
CREATE TYPE "CreatorGradeLevel" AS ENUM ('ROOKIE', 'SILVER', 'GOLD', 'PLATINUM');

-- CreateEnum
CREATE TYPE "GuideCategory" AS ENUM ('CREATOR_BEGINNER', 'CREATOR_SALES', 'BRAND_START', 'BRAND_OPTIMIZE');

-- CreateEnum
CREATE TYPE "GuideContentType" AS ENUM ('CARD', 'VIDEO', 'ARTICLE');

-- CreateEnum
CREATE TYPE "GuideTargetGrade" AS ENUM ('ALL', 'SILVER', 'GOLD', 'PLATINUM');

-- CreateEnum
CREATE TYPE "CreatorMissionKey" AS ENUM ('SHOP_OPEN', 'FIRST_PRODUCT', 'SNS_SHARE', 'FIVE_PRODUCTS', 'FIRST_SALE');

-- CreateEnum
CREATE TYPE "LivePlatform" AS ENUM ('instagram', 'youtube', 'tiktok', 'internal');

-- CreateEnum
CREATE TYPE "LiveSessionStatus" AS ENUM ('scheduled', 'live', 'ended', 'cancelled');

-- CreateEnum
CREATE TYPE "CreatorApplicationStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "LegalContentType" AS ENUM ('terms_of_service', 'privacy_policy', 'refund_policy', 'shipping_policy', 'business_info', 'contact_info');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "password_hash" VARCHAR(255),
    "role" "UserRole" NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'active',
    "phone" VARCHAR(20),
    "avatar_url" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brands" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "brand_name" TEXT,
    "company_name" TEXT,
    "company_name_en" TEXT,
    "company_name_jp" TEXT,
    "representative_name" VARCHAR(100),
    "business_number" VARCHAR(50),
    "business_registration_url" TEXT,
    "logo_url" TEXT,
    "description" TEXT,
    "description_en" TEXT,
    "description_jp" TEXT,
    "contact_email" VARCHAR(255),
    "contact_phone" VARCHAR(20),
    "platform_fee_rate" DECIMAL(5,4) NOT NULL DEFAULT 0.03,
    "creator_commission_rate" INTEGER DEFAULT 25,
    "enable_tiered_commission" BOOLEAN NOT NULL DEFAULT false,
    "tier1_rate" INTEGER,
    "tier2_rate" INTEGER,
    "tier3_rate" INTEGER,
    "tier4_rate" INTEGER,
    "shipping_countries" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "default_shipping_fee" DECIMAL(10,0) NOT NULL DEFAULT 0,
    "free_shipping_threshold" DECIMAL(10,0),
    "default_courier" VARCHAR(20),
    "return_address" TEXT,
    "exchange_policy" TEXT,
    "certifications" JSONB NOT NULL DEFAULT '[]',
    "mocra_status" "MocraStatus" NOT NULL DEFAULT 'green',
    "us_sales_ytd" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "jp_sales_ytd" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "monthly_fee" INTEGER NOT NULL DEFAULT 55000,
    "bank_name" TEXT,
    "bank_account" TEXT,
    "account_number" TEXT,
    "account_holder" TEXT,
    "bank_holder" VARCHAR(50),
    "bank_code" TEXT,
    "bank_verified" BOOLEAN NOT NULL DEFAULT false,
    "bank_verified_at" TIMESTAMPTZ,
    "settlement_cycle" TEXT NOT NULL DEFAULT 'monthly',
    "minimum_payout" INTEGER NOT NULL DEFAULT 50,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "approved_at" TIMESTAMPTZ,
    "brand_lines" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creators" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "username" TEXT,
    "shop_id" VARCHAR(50),
    "display_name" VARCHAR(50),
    "bio" TEXT,
    "bio_en" TEXT,
    "bio_jp" TEXT,
    "profile_image" TEXT,
    "profile_image_url" TEXT,
    "cover_image_url" TEXT,
    "banner_image_url" TEXT,
    "banner_link" TEXT,
    "instagram_handle" VARCHAR(100),
    "youtube_handle" VARCHAR(100),
    "tiktok_handle" VARCHAR(100),
    "instagram" TEXT,
    "youtube" TEXT,
    "tiktok" TEXT,
    "social_links" JSONB NOT NULL DEFAULT '{}',
    "skin_type" VARCHAR(20),
    "personal_color" VARCHAR(20),
    "skin_concerns" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "scalp_concerns" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "age_range" VARCHAR(20),
    "interests" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "onboarding_completed" BOOLEAN NOT NULL DEFAULT false,
    "total_sales" DECIMAL(12,0) NOT NULL DEFAULT 0,
    "total_earnings" DECIMAL(12,0) NOT NULL DEFAULT 0,
    "total_revenue" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "total_orders" INTEGER NOT NULL DEFAULT 0,
    "is_business" BOOLEAN NOT NULL DEFAULT false,
    "business_number" VARCHAR(50),
    "bank_name" TEXT,
    "bank_account" TEXT,
    "payment_method" TEXT DEFAULT 'paypal',
    "paypal_email" TEXT,
    "account_number" TEXT,
    "swift_code" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "theme_color" TEXT NOT NULL DEFAULT '#1a1a1a',
    "background_color" TEXT NOT NULL DEFAULT '#1a1a1a',
    "background_image" TEXT,
    "text_color" TEXT NOT NULL DEFAULT '#ffffff',
    "shop_settings" JSONB NOT NULL DEFAULT '{}',
    "level" TEXT DEFAULT 'bronze',
    "level_points" INTEGER NOT NULL DEFAULT 0,
    "level_updated_at" TIMESTAMPTZ,
    "community_enabled" BOOLEAN NOT NULL DEFAULT false,
    "community_type" TEXT NOT NULL DEFAULT 'board',
    "status" VARCHAR(10) NOT NULL DEFAULT 'ACTIVE',
    "country" TEXT,
    "picked_products" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notification_settings" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "creators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "name" VARCHAR(200),
    "name_ko" TEXT,
    "name_en" TEXT,
    "name_jp" TEXT,
    "sku" TEXT,
    "price" DECIMAL(65,30),
    "original_price" DECIMAL(10,0),
    "sale_price" DECIMAL(10,0),
    "price_usd" INTEGER,
    "price_jpy" INTEGER,
    "original_price_usd" INTEGER,
    "original_price_jpy" INTEGER,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "description_ko" TEXT,
    "description_en" TEXT,
    "description_jp" TEXT,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "image_url" TEXT,
    "thumbnail_url" TEXT,
    "category" VARCHAR(20),
    "volume" VARCHAR(100),
    "ingredients" TEXT,
    "how_to_use" TEXT,
    "usage_info" TEXT,
    "is_cosmetic" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "status" VARCHAR(10) NOT NULL DEFAULT 'ACTIVE',
    "allow_creator_pick" BOOLEAN NOT NULL DEFAULT true,
    "default_commission_rate" DECIMAL(5,4) NOT NULL DEFAULT 0.10,
    "shipping_fee_type" "ShippingFeeType" NOT NULL DEFAULT 'FREE',
    "shipping_fee" DECIMAL(10,0) NOT NULL DEFAULT 0,
    "free_shipping_threshold" DECIMAL(10,0),
    "courier" VARCHAR(20),
    "shipping_info" TEXT,
    "return_policy" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creator_products" (
    "id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "creator_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaigns" (
    "id" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "type" "CampaignType" NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "start_at" TIMESTAMPTZ,
    "end_at" TIMESTAMPTZ,
    "recruitment_type" VARCHAR(10) NOT NULL DEFAULT 'OPEN',
    "commission_rate" DECIMAL(5,4) NOT NULL DEFAULT 0.10,
    "total_stock" INTEGER,
    "sold_count" INTEGER NOT NULL DEFAULT 0,
    "target_participants" INTEGER,
    "conditions" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_products" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "campaign_price" DECIMAL(10,0) NOT NULL,
    "per_creator_limit" INTEGER,

    CONSTRAINT "campaign_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_participations" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "status" VARCHAR(10) NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "applied_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approved_at" TIMESTAMPTZ,

    CONSTRAINT "campaign_participations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collections" (
    "id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creator_shop_items" (
    "id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "campaign_id" TEXT,
    "type" VARCHAR(10) NOT NULL,
    "collection_id" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "added_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "creator_shop_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "beauty_routines" (
    "id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "steps" JSONB NOT NULL DEFAULT '[]',
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "beauty_routines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routine_steps" (
    "id" TEXT NOT NULL,
    "routine_id" TEXT NOT NULL,
    "step_name" VARCHAR(50) NOT NULL,
    "step_description" TEXT NOT NULL,
    "image_url" TEXT,
    "link_url" TEXT,
    "product_tags" JSONB NOT NULL DEFAULT '[]',
    "display_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "routine_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "order_number" VARCHAR(20),
    "creator_id" TEXT,
    "brand_id" TEXT,
    "buyer_id" TEXT,
    "customer_email" TEXT,
    "customer_name" TEXT,
    "customer_phone" TEXT,
    "buyer_name" VARCHAR(100),
    "buyer_phone" VARCHAR(30),
    "buyer_email" VARCHAR(200),
    "shipping_address" TEXT,
    "shipping_detail" TEXT,
    "shipping_zipcode" VARCHAR(20),
    "shipping_memo" TEXT,
    "shipping_fee" DECIMAL(12,0) NOT NULL DEFAULT 0,
    "subtotal" DECIMAL(65,30),
    "product_amount" DECIMAL(10,0),
    "total_amount" DECIMAL(65,30) NOT NULL,
    "creator_revenue" DECIMAL(65,30),
    "platform_revenue" DECIMAL(65,30),
    "brand_revenue" DECIMAL(65,30),
    "country" TEXT,
    "currency" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PAID',
    "payment_method" VARCHAR(50),
    "payment_key" VARCHAR(100),
    "payment_intent_id" TEXT,
    "pg_transaction_id" VARCHAR(200),
    "pg_provider" VARCHAR(50),
    "tracking_number" VARCHAR(100),
    "courier_code" VARCHAR(20),
    "notes" TEXT,
    "paid_at" TIMESTAMPTZ,
    "shipped_at" TIMESTAMPTZ,
    "delivered_at" TIMESTAMPTZ,
    "confirmed_at" TIMESTAMPTZ,
    "completed_at" TIMESTAMPTZ,
    "cancelled_at" TIMESTAMPTZ,
    "cancel_reason" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "campaign_id" TEXT,
    "product_name" VARCHAR(200),
    "product_image" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_price" DECIMAL(65,30) NOT NULL,
    "total_price" DECIMAL(65,30) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversions" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "order_item_id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "conversion_type" VARCHAR(10) NOT NULL,
    "order_amount" DECIMAL(10,0) NOT NULL,
    "commission_rate" DECIMAL(5,4) NOT NULL,
    "commission_amount" DECIMAL(10,0) NOT NULL,
    "status" VARCHAR(10) NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmed_at" TIMESTAMPTZ,

    CONSTRAINT "conversions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settlements" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "user_role" TEXT,
    "creator_id" TEXT,
    "period" TEXT,
    "period_start" DATE,
    "period_end" DATE,
    "total_conversions" INTEGER NOT NULL DEFAULT 0,
    "total_sales" DECIMAL(12,0) NOT NULL DEFAULT 0,
    "direct_commission" DECIMAL(10,0) NOT NULL DEFAULT 0,
    "indirect_commission" DECIMAL(10,0) NOT NULL DEFAULT 0,
    "gross_commission" DECIMAL(10,0) NOT NULL DEFAULT 0,
    "withholding_tax" DECIMAL(10,0) NOT NULL DEFAULT 0,
    "net_amount" DECIMAL(10,0) NOT NULL DEFAULT 0,
    "total_revenue" DECIMAL(65,30),
    "currency" TEXT,
    "details" JSONB DEFAULT '{}',
    "status" VARCHAR(15) NOT NULL DEFAULT 'PENDING',
    "paid_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "settlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shop_visits" (
    "id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "visitor_id" VARCHAR(100) NOT NULL,
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "referer" TEXT,
    "attribution_data" JSONB NOT NULL DEFAULT '{}',
    "visited_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "shop_visits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "banners" (
    "id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "banner_type" VARCHAR(15) NOT NULL DEFAULT 'HORIZONTAL',
    "link_url" TEXT,
    "link_type" VARCHAR(15) NOT NULL DEFAULT 'EXTERNAL',
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "banners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" VARCHAR(15) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "message" TEXT NOT NULL,
    "link_url" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotion_kits" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "product_images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "story_templates" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "recommended_caption" TEXT,
    "hashtags" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "promotion_kits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buyers" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "profile_image" TEXT,
    "phone" TEXT,
    "default_shipping_address" JSONB,
    "points_balance" INTEGER NOT NULL DEFAULT 0,
    "total_points_earned" INTEGER NOT NULL DEFAULT 0,
    "total_points_used" INTEGER NOT NULL DEFAULT 0,
    "total_orders" INTEGER NOT NULL DEFAULT 0,
    "total_spent" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "total_reviews" INTEGER NOT NULL DEFAULT 0,
    "preferred_language" TEXT NOT NULL DEFAULT 'ko',
    "preferred_currency" TEXT NOT NULL DEFAULT 'KRW',
    "marketing_consent" BOOLEAN NOT NULL DEFAULT false,
    "eligible_for_creator" BOOLEAN NOT NULL DEFAULT false,
    "creator_conversion_date" TIMESTAMPTZ,
    "instagram_username" TEXT,
    "instagram_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "buyers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sample_requests" (
    "id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "product_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" TEXT NOT NULL DEFAULT 'pending',
    "shipping_address" JSONB,
    "message" TEXT,
    "admin_note" TEXT,
    "tracking_number" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sample_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_tickets" (
    "id" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "from_name" TEXT NOT NULL DEFAULT '',
    "from_email" TEXT,
    "order_id" TEXT,
    "response" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "short_urls" (
    "id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "short_code" TEXT NOT NULL,
    "custom_domain" TEXT,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "total_clicks" INTEGER NOT NULL DEFAULT 0,
    "last_clicked_at" TIMESTAMPTZ,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "expires_at" TIMESTAMPTZ,
    "source_tag" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "short_urls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "short_url_analytics" (
    "id" TEXT NOT NULL,
    "short_url_id" TEXT NOT NULL,
    "clicked_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "referrer" TEXT,
    "user_agent" TEXT,
    "ip_country" TEXT,
    "device_type" TEXT,

    CONSTRAINT "short_url_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mall_subscriptions" (
    "id" TEXT NOT NULL,
    "buyer_id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "notify_new_products" BOOLEAN NOT NULL DEFAULT true,
    "notify_sales" BOOLEAN NOT NULL DEFAULT true,
    "notify_live_streams" BOOLEAN NOT NULL DEFAULT true,
    "subscribed_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unsubscribed_at" TIMESTAMPTZ,

    CONSTRAINT "mall_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_posts" (
    "id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "buyer_id" TEXT,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "likes_count" INTEGER NOT NULL DEFAULT 0,
    "comments_count" INTEGER NOT NULL DEFAULT 0,
    "views_count" INTEGER NOT NULL DEFAULT 0,
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "is_hidden" BOOLEAN NOT NULL DEFAULT false,
    "hidden_reason" TEXT,
    "post_type" TEXT NOT NULL DEFAULT 'general',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "community_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_comments" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "buyer_id" TEXT,
    "parent_comment_id" TEXT,
    "content" TEXT NOT NULL,
    "likes_count" INTEGER NOT NULL DEFAULT 0,
    "is_hidden" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "community_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_likes" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "buyer_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "community_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_questions" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "buyer_id" TEXT,
    "question" TEXT NOT NULL,
    "answer" TEXT,
    "answered_by" TEXT,
    "answered_at" TIMESTAMPTZ,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "is_answered" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_reviews" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "buyer_id" TEXT,
    "order_id" TEXT,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "instagram_post_url" TEXT,
    "instagram_verified" BOOLEAN NOT NULL DEFAULT false,
    "points_awarded" INTEGER NOT NULL DEFAULT 0,
    "points_awarded_at" TIMESTAMPTZ,
    "helpful_count" INTEGER NOT NULL DEFAULT 0,
    "is_verified_purchase" BOOLEAN NOT NULL DEFAULT false,
    "is_approved" BOOLEAN NOT NULL DEFAULT true,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "rejection_reason" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_helpful_votes" (
    "id" TEXT NOT NULL,
    "review_id" TEXT NOT NULL,
    "buyer_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_helpful_votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "points_history" (
    "id" TEXT NOT NULL,
    "buyer_id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "balance_after" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "reference_id" TEXT,
    "description" TEXT,
    "expires_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "points_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creator_points" (
    "id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "point_type" VARCHAR(20) NOT NULL,
    "amount" INTEGER NOT NULL,
    "balance_after" INTEGER NOT NULL,
    "description" TEXT,
    "related_id" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "creator_points_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creator_referrals" (
    "id" TEXT NOT NULL,
    "referrer_id" TEXT NOT NULL,
    "referred_id" TEXT,
    "referral_code" VARCHAR(20) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "referrer_reward_total" INTEGER NOT NULL DEFAULT 0,
    "referred_reward_total" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "creator_referrals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creator_grades" (
    "id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "grade" VARCHAR(10) NOT NULL DEFAULT 'ROOKIE',
    "monthly_sales" INTEGER NOT NULL DEFAULT 0,
    "commission_bonus_rate" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "grade_updated_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "creator_grades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creator_missions" (
    "id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "mission_key" VARCHAR(30) NOT NULL,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMPTZ,
    "reward_amount" INTEGER NOT NULL DEFAULT 0,
    "reward_claimed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "creator_missions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guides" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "category" VARCHAR(20) NOT NULL,
    "content_type" VARCHAR(10) NOT NULL DEFAULT 'CARD',
    "content" JSONB NOT NULL DEFAULT '{"sections":[]}',
    "target_grade" VARCHAR(10) NOT NULL DEFAULT 'ALL',
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creator_levels" (
    "id" TEXT NOT NULL,
    "level_name" TEXT NOT NULL,
    "min_points" INTEGER NOT NULL,
    "commission_bonus" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "badge_color" TEXT,
    "badge_icon" TEXT,
    "benefits" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "creator_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creator_level_history" (
    "id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "from_level" TEXT,
    "to_level" TEXT NOT NULL,
    "points_at_change" INTEGER NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "creator_level_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "live_sessions" (
    "id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "platform" TEXT NOT NULL,
    "external_url" TEXT,
    "stream_key" TEXT,
    "scheduled_at" TIMESTAMPTZ,
    "started_at" TIMESTAMPTZ,
    "ended_at" TIMESTAMPTZ,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "featured_product_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "peak_viewers" INTEGER NOT NULL DEFAULT 0,
    "total_viewers" INTEGER NOT NULL DEFAULT 0,
    "total_orders" INTEGER NOT NULL DEFAULT 0,
    "total_revenue" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "chat_enabled" BOOLEAN NOT NULL DEFAULT true,
    "bot_enabled" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "live_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "live_products" (
    "id" TEXT NOT NULL,
    "live_session_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "live_price_usd" DECIMAL(65,30),
    "live_price_jpy" DECIMAL(65,30),
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "orders" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "live_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "live_bot_settings" (
    "id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT false,
    "welcome_message" TEXT,
    "product_link_interval" INTEGER NOT NULL DEFAULT 300,
    "scheduled_messages" JSONB NOT NULL DEFAULT '[]',
    "auto_responses" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "live_bot_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "live_chat_messages" (
    "id" TEXT NOT NULL,
    "live_session_id" TEXT NOT NULL,
    "buyer_id" TEXT,
    "is_bot_message" BOOLEAN NOT NULL DEFAULT false,
    "message" TEXT NOT NULL,
    "product_id" TEXT,
    "product_link" TEXT,
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "is_hidden" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "live_chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creator_applications" (
    "id" TEXT NOT NULL,
    "buyer_id" TEXT NOT NULL,
    "desired_username" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "bio" TEXT,
    "instagram_url" TEXT,
    "youtube_url" TEXT,
    "tiktok_url" TEXT,
    "follower_count" INTEGER,
    "motivation" TEXT,
    "content_plan" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMPTZ,
    "rejection_reason" TEXT,
    "created_creator_id" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "creator_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversion_criteria" (
    "id" TEXT NOT NULL,
    "min_orders" INTEGER NOT NULL DEFAULT 5,
    "min_reviews" INTEGER NOT NULL DEFAULT 3,
    "min_spent" DECIMAL(65,30) NOT NULL DEFAULT 100,
    "min_account_age_days" INTEGER NOT NULL DEFAULT 30,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversion_criteria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buyer_wishlist" (
    "id" TEXT NOT NULL,
    "buyer_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "buyer_wishlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buyer_cart" (
    "id" TEXT NOT NULL,
    "buyer_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "buyer_cart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_content" (
    "id" TEXT NOT NULL,
    "content_type" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "effective_date" DATE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "legal_content_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "brands_user_id_key" ON "brands"("user_id");

-- CreateIndex
CREATE INDEX "brands_approved_idx" ON "brands"("approved");

-- CreateIndex
CREATE INDEX "brands_mocra_status_idx" ON "brands"("mocra_status");

-- CreateIndex
CREATE UNIQUE INDEX "creators_user_id_key" ON "creators"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "creators_username_key" ON "creators"("username");

-- CreateIndex
CREATE UNIQUE INDEX "creators_shop_id_key" ON "creators"("shop_id");

-- CreateIndex
CREATE INDEX "creators_country_idx" ON "creators"("country");

-- CreateIndex
CREATE INDEX "products_is_active_idx" ON "products"("is_active");

-- CreateIndex
CREATE INDEX "products_status_idx" ON "products"("status");

-- CreateIndex
CREATE UNIQUE INDEX "creator_products_creator_id_product_id_key" ON "creator_products"("creator_id", "product_id");

-- CreateIndex
CREATE INDEX "campaigns_status_idx" ON "campaigns"("status");

-- CreateIndex
CREATE INDEX "campaigns_type_idx" ON "campaigns"("type");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_participations_campaign_id_creator_id_key" ON "campaign_participations"("campaign_id", "creator_id");

-- CreateIndex
CREATE INDEX "creator_shop_items_type_idx" ON "creator_shop_items"("type");

-- CreateIndex
CREATE UNIQUE INDEX "orders_order_number_key" ON "orders"("order_number");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE INDEX "orders_country_idx" ON "orders"("country");

-- CreateIndex
CREATE INDEX "orders_created_at_idx" ON "orders"("created_at");

-- CreateIndex
CREATE INDEX "settlements_status_idx" ON "settlements"("status");

-- CreateIndex
CREATE INDEX "notifications_user_id_is_read_idx" ON "notifications"("user_id", "is_read");

-- CreateIndex
CREATE UNIQUE INDEX "promotion_kits_campaign_id_key" ON "promotion_kits"("campaign_id");

-- CreateIndex
CREATE UNIQUE INDEX "buyers_user_id_key" ON "buyers"("user_id");

-- CreateIndex
CREATE INDEX "buyers_points_balance_idx" ON "buyers"("points_balance");

-- CreateIndex
CREATE INDEX "buyers_eligible_for_creator_idx" ON "buyers"("eligible_for_creator");

-- CreateIndex
CREATE INDEX "sample_requests_status_idx" ON "sample_requests"("status");

-- CreateIndex
CREATE UNIQUE INDEX "short_urls_short_code_key" ON "short_urls"("short_code");

-- CreateIndex
CREATE INDEX "short_url_analytics_clicked_at_idx" ON "short_url_analytics"("clicked_at");

-- CreateIndex
CREATE INDEX "mall_subscriptions_status_idx" ON "mall_subscriptions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "mall_subscriptions_buyer_id_creator_id_key" ON "mall_subscriptions"("buyer_id", "creator_id");

-- CreateIndex
CREATE INDEX "community_posts_post_type_idx" ON "community_posts"("post_type");

-- CreateIndex
CREATE INDEX "community_posts_created_at_idx" ON "community_posts"("created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "community_likes_post_id_buyer_id_key" ON "community_likes"("post_id", "buyer_id");

-- CreateIndex
CREATE INDEX "product_questions_is_answered_idx" ON "product_questions"("is_answered");

-- CreateIndex
CREATE INDEX "product_reviews_rating_idx" ON "product_reviews"("rating");

-- CreateIndex
CREATE INDEX "product_reviews_is_featured_idx" ON "product_reviews"("is_featured");

-- CreateIndex
CREATE UNIQUE INDEX "review_helpful_votes_review_id_buyer_id_key" ON "review_helpful_votes"("review_id", "buyer_id");

-- CreateIndex
CREATE INDEX "points_history_type_idx" ON "points_history"("type");

-- CreateIndex
CREATE INDEX "points_history_created_at_idx" ON "points_history"("created_at" DESC);

-- CreateIndex
CREATE INDEX "creator_points_creator_id_created_at_idx" ON "creator_points"("creator_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "creator_referrals_referral_code_key" ON "creator_referrals"("referral_code");

-- CreateIndex
CREATE UNIQUE INDEX "creator_grades_creator_id_key" ON "creator_grades"("creator_id");

-- CreateIndex
CREATE UNIQUE INDEX "creator_missions_creator_id_mission_key_key" ON "creator_missions"("creator_id", "mission_key");

-- CreateIndex
CREATE INDEX "guides_is_published_display_order_idx" ON "guides"("is_published", "display_order");

-- CreateIndex
CREATE UNIQUE INDEX "creator_levels_level_name_key" ON "creator_levels"("level_name");

-- CreateIndex
CREATE INDEX "live_sessions_status_idx" ON "live_sessions"("status");

-- CreateIndex
CREATE INDEX "live_sessions_scheduled_at_idx" ON "live_sessions"("scheduled_at");

-- CreateIndex
CREATE UNIQUE INDEX "live_bot_settings_creator_id_key" ON "live_bot_settings"("creator_id");

-- CreateIndex
CREATE INDEX "live_chat_messages_created_at_idx" ON "live_chat_messages"("created_at");

-- CreateIndex
CREATE INDEX "creator_applications_status_idx" ON "creator_applications"("status");

-- CreateIndex
CREATE UNIQUE INDEX "buyer_wishlist_buyer_id_product_id_creator_id_key" ON "buyer_wishlist"("buyer_id", "product_id", "creator_id");

-- CreateIndex
CREATE UNIQUE INDEX "buyer_cart_buyer_id_product_id_creator_id_key" ON "buyer_cart"("buyer_id", "product_id", "creator_id");

-- CreateIndex
CREATE INDEX "legal_content_content_type_idx" ON "legal_content"("content_type");

-- CreateIndex
CREATE INDEX "legal_content_country_idx" ON "legal_content"("country");

-- CreateIndex
CREATE UNIQUE INDEX "legal_content_content_type_country_language_key" ON "legal_content"("content_type", "country", "language");

-- AddForeignKey
ALTER TABLE "brands" ADD CONSTRAINT "brands_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creators" ADD CONSTRAINT "creators_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_products" ADD CONSTRAINT "creator_products_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "creators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_products" ADD CONSTRAINT "creator_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_products" ADD CONSTRAINT "campaign_products_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_products" ADD CONSTRAINT "campaign_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_participations" ADD CONSTRAINT "campaign_participations_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collections" ADD CONSTRAINT "collections_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "creators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_shop_items" ADD CONSTRAINT "creator_shop_items_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "creators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_shop_items" ADD CONSTRAINT "creator_shop_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_shop_items" ADD CONSTRAINT "creator_shop_items_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_shop_items" ADD CONSTRAINT "creator_shop_items_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "collections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beauty_routines" ADD CONSTRAINT "beauty_routines_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "creators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routine_steps" ADD CONSTRAINT "routine_steps_routine_id_fkey" FOREIGN KEY ("routine_id") REFERENCES "beauty_routines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "creators"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "buyers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversions" ADD CONSTRAINT "conversions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversions" ADD CONSTRAINT "conversions_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversions" ADD CONSTRAINT "conversions_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "creators"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "creators"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_visits" ADD CONSTRAINT "shop_visits_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "creators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "banners" ADD CONSTRAINT "banners_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "creators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_kits" ADD CONSTRAINT "promotion_kits_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buyers" ADD CONSTRAINT "buyers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sample_requests" ADD CONSTRAINT "sample_requests_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "creators"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sample_requests" ADD CONSTRAINT "sample_requests_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "short_urls" ADD CONSTRAINT "short_urls_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "creators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "short_url_analytics" ADD CONSTRAINT "short_url_analytics_short_url_id_fkey" FOREIGN KEY ("short_url_id") REFERENCES "short_urls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mall_subscriptions" ADD CONSTRAINT "mall_subscriptions_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "buyers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mall_subscriptions" ADD CONSTRAINT "mall_subscriptions_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "creators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_posts" ADD CONSTRAINT "community_posts_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "creators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_posts" ADD CONSTRAINT "community_posts_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "buyers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_comments" ADD CONSTRAINT "community_comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "community_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_comments" ADD CONSTRAINT "community_comments_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "buyers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_comments" ADD CONSTRAINT "community_comments_parent_comment_id_fkey" FOREIGN KEY ("parent_comment_id") REFERENCES "community_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_likes" ADD CONSTRAINT "community_likes_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "community_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_likes" ADD CONSTRAINT "community_likes_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "buyers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_questions" ADD CONSTRAINT "product_questions_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_questions" ADD CONSTRAINT "product_questions_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "buyers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_questions" ADD CONSTRAINT "product_questions_answered_by_fkey" FOREIGN KEY ("answered_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "buyers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_helpful_votes" ADD CONSTRAINT "review_helpful_votes_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "product_reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_helpful_votes" ADD CONSTRAINT "review_helpful_votes_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "buyers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "points_history" ADD CONSTRAINT "points_history_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "buyers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_points" ADD CONSTRAINT "creator_points_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "creators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_referrals" ADD CONSTRAINT "creator_referrals_referrer_id_fkey" FOREIGN KEY ("referrer_id") REFERENCES "creators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_referrals" ADD CONSTRAINT "creator_referrals_referred_id_fkey" FOREIGN KEY ("referred_id") REFERENCES "creators"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_grades" ADD CONSTRAINT "creator_grades_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "creators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_missions" ADD CONSTRAINT "creator_missions_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "creators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_level_history" ADD CONSTRAINT "creator_level_history_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "creators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_sessions" ADD CONSTRAINT "live_sessions_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "creators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_products" ADD CONSTRAINT "live_products_live_session_id_fkey" FOREIGN KEY ("live_session_id") REFERENCES "live_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_products" ADD CONSTRAINT "live_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_bot_settings" ADD CONSTRAINT "live_bot_settings_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "creators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_chat_messages" ADD CONSTRAINT "live_chat_messages_live_session_id_fkey" FOREIGN KEY ("live_session_id") REFERENCES "live_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_chat_messages" ADD CONSTRAINT "live_chat_messages_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "buyers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_chat_messages" ADD CONSTRAINT "live_chat_messages_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creator_applications" ADD CONSTRAINT "creator_applications_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "buyers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buyer_wishlist" ADD CONSTRAINT "buyer_wishlist_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "buyers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buyer_wishlist" ADD CONSTRAINT "buyer_wishlist_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buyer_wishlist" ADD CONSTRAINT "buyer_wishlist_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "creators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buyer_cart" ADD CONSTRAINT "buyer_cart_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "buyers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buyer_cart" ADD CONSTRAINT "buyer_cart_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buyer_cart" ADD CONSTRAINT "buyer_cart_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "creators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

