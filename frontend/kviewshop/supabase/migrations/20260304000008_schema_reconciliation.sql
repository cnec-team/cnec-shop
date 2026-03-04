-- Schema Reconciliation Migration
-- Ensures all columns from cnec_commerce (migration 002) exist
-- even if initial_schema (migration 001) was the first to create the tables.

-- ============================================================
-- creators table — ensure cnec_commerce columns exist
-- ============================================================
ALTER TABLE creators ADD COLUMN IF NOT EXISTS shop_id VARCHAR(50) UNIQUE;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS profile_image_url TEXT;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS cover_image_url TEXT;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS banner_image_url TEXT;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS banner_link TEXT;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS instagram_handle VARCHAR(100);
ALTER TABLE creators ADD COLUMN IF NOT EXISTS youtube_handle VARCHAR(100);
ALTER TABLE creators ADD COLUMN IF NOT EXISTS tiktok_handle VARCHAR(100);
ALTER TABLE creators ADD COLUMN IF NOT EXISTS skin_type VARCHAR(20);
ALTER TABLE creators ADD COLUMN IF NOT EXISTS personal_color VARCHAR(20);
ALTER TABLE creators ADD COLUMN IF NOT EXISTS skin_concerns TEXT[] DEFAULT '{}';
ALTER TABLE creators ADD COLUMN IF NOT EXISTS scalp_concerns TEXT[] DEFAULT '{}';
ALTER TABLE creators ADD COLUMN IF NOT EXISTS total_sales DECIMAL(12,0) DEFAULT 0;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS total_earnings DECIMAL(12,0) DEFAULT 0;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS status VARCHAR(10) DEFAULT 'ACTIVE';

-- Ensure columns used by buyer pages (from initial_schema or added here for compat)
ALTER TABLE creators ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS theme_color TEXT DEFAULT '#1a1a1a';
ALTER TABLE creators ADD COLUMN IF NOT EXISTS background_color TEXT DEFAULT '#ffffff';
ALTER TABLE creators ADD COLUMN IF NOT EXISTS profile_image TEXT;

-- ============================================================
-- orders table — ensure all needed columns exist
-- ============================================================
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_key VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pg_transaction_id VARCHAR(200);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pg_provider VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(30);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS buyer_id UUID;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS buyer_name VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS buyer_phone VARCHAR(30);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS buyer_email VARCHAR(200);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_detail TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_zipcode VARCHAR(20);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_fee DECIMAL(12,0) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancel_reason TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS creator_id UUID;

-- ============================================================
-- order_items table — ensure denormalized product info columns
-- ============================================================
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_name VARCHAR(200);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_image TEXT;

-- ============================================================
-- Reconcile orders status constraint to UPPERCASE values
-- ============================================================
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('PENDING', 'PAID', 'PREPARING', 'SHIPPING', 'DELIVERED', 'CONFIRMED', 'CANCELLED', 'REFUNDED'));
