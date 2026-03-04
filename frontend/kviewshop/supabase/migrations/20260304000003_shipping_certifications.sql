-- =============================================
-- KviewShop Migration 002: Shipping Countries, Certifications & Settings
-- =============================================
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- This migration adds all missing columns for brand settings,
-- shipping countries, product certifications, creator shop features,
-- and relaxes constraints for global support.
-- =============================================

-- =============================================
-- 1. BRANDS TABLE - Add missing columns
-- =============================================

-- Brand name (alias for company_name in settings UI)
ALTER TABLE brands ADD COLUMN IF NOT EXISTS brand_name TEXT;

-- Shipping countries (array of ISO country codes)
ALTER TABLE brands ADD COLUMN IF NOT EXISTS shipping_countries TEXT[] DEFAULT '{}';

-- Product certifications (JSONB array)
ALTER TABLE brands ADD COLUMN IF NOT EXISTS certifications JSONB DEFAULT '[]';

-- Tiered commission settings
ALTER TABLE brands ADD COLUMN IF NOT EXISTS enable_tiered_commission BOOLEAN DEFAULT false;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS tier1_rate INTEGER DEFAULT 15;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS tier2_rate INTEGER DEFAULT 20;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS tier3_rate INTEGER DEFAULT 25;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS tier4_rate INTEGER DEFAULT 30;

-- Settlement settings
ALTER TABLE brands ADD COLUMN IF NOT EXISTS settlement_cycle TEXT DEFAULT 'monthly';
ALTER TABLE brands ADD COLUMN IF NOT EXISTS minimum_payout INTEGER DEFAULT 50;

-- Bank account info
ALTER TABLE brands ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS account_number TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS account_holder TEXT;

-- Relax commission rate constraint (was 20-30, now 5-50)
ALTER TABLE brands DROP CONSTRAINT IF EXISTS brands_creator_commission_rate_check;
ALTER TABLE brands ADD CONSTRAINT brands_creator_commission_rate_check
  CHECK (creator_commission_rate >= 5 AND creator_commission_rate <= 50);


-- =============================================
-- 2. CREATORS TABLE - Add missing columns
-- =============================================

-- Individual social link columns (used by creator shop page)
ALTER TABLE creators ADD COLUMN IF NOT EXISTS instagram TEXT;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS youtube TEXT;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS tiktok TEXT;

-- Picked products (array of product UUIDs for quick access)
ALTER TABLE creators ADD COLUMN IF NOT EXISTS picked_products TEXT[] DEFAULT '{}';

-- Relax country constraint to support all countries
ALTER TABLE creators DROP CONSTRAINT IF EXISTS creators_country_check;
ALTER TABLE creators ALTER COLUMN country DROP NOT NULL;


-- =============================================
-- 3. PRODUCTS TABLE - Add generic name/price columns
-- =============================================

-- Generic name column (UI uses 'name' not 'name_ko')
ALTER TABLE products ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS price NUMERIC;
ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT;

-- Backfill name/price from existing columns
UPDATE products SET name = name_ko WHERE name IS NULL AND name_ko IS NOT NULL;
UPDATE products SET price = price_usd WHERE price IS NULL AND price_usd IS NOT NULL;
UPDATE products SET description = description_ko WHERE description IS NULL AND description_ko IS NOT NULL;


-- =============================================
-- 4. ORDERS TABLE - Relax country constraint
-- =============================================

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_country_check;
-- Allow any country code
ALTER TABLE orders ADD CONSTRAINT orders_country_check
  CHECK (country IS NOT NULL AND LENGTH(country) >= 2);

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_currency_check;
-- Allow more currencies
ALTER TABLE orders ADD CONSTRAINT orders_currency_check
  CHECK (currency IS NOT NULL AND LENGTH(currency) = 3);


-- =============================================
-- 5. RLS POLICIES - Fix for brand settings save
-- =============================================

-- Make sure brands can be viewed by their own admin (even if not approved)
-- Drop and recreate to avoid conflicts
DROP POLICY IF EXISTS "Brand admins can view own brand" ON brands;
CREATE POLICY "Brand admins can view own brand" ON brands
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Brand admins can update own brand" ON brands;
CREATE POLICY "Brand admins can update own brand" ON brands
  FOR UPDATE USING (user_id = auth.uid());

-- Super admin can view all brands
DROP POLICY IF EXISTS "Super admin can view all brands" ON brands;
CREATE POLICY "Super admin can view all brands" ON brands
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
  );

-- Super admin can update all brands (for certification approval)
DROP POLICY IF EXISTS "Super admin can update all brands" ON brands;
CREATE POLICY "Super admin can update all brands" ON brands
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
  );

-- Creators can view brand shipping/cert info (needed for product application page)
DROP POLICY IF EXISTS "Creators can view brand info" ON brands;
CREATE POLICY "Creators can view brand info" ON brands
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'creator')
  );

-- Fix products policy so creators can view ALL active products (not just brand admin)
DROP POLICY IF EXISTS "Anyone can view active products" ON products;
CREATE POLICY "Anyone can view active products" ON products
  FOR SELECT USING (is_active = true);


-- =============================================
-- 6. INDEXES for new columns
-- =============================================

CREATE INDEX IF NOT EXISTS idx_brands_shipping_countries ON brands USING GIN (shipping_countries);
CREATE INDEX IF NOT EXISTS idx_creators_picked_products ON creators USING GIN (picked_products);


-- =============================================
-- 7. UPDATE SEED DATA with shipping countries and certifications
-- =============================================

-- Update the test brand with shipping countries and certifications
UPDATE brands
SET
  brand_name = company_name,
  shipping_countries = ARRAY['JP', 'CN', 'TW', 'HK', 'TH', 'VN', 'SG', 'US', 'CA'],
  certifications = '[
    {
      "id": "cert-1",
      "type": "kfda",
      "name": "KFDA 화장품 제조업 등록",
      "issueDate": "2024-03-15",
      "expiryDate": "2027-03-14",
      "fileUrl": "",
      "status": "approved"
    },
    {
      "id": "cert-2",
      "type": "iso22716",
      "name": "ISO 22716 GMP 인증",
      "issueDate": "2024-06-01",
      "expiryDate": "2027-05-31",
      "fileUrl": "",
      "status": "approved"
    },
    {
      "id": "cert-3",
      "type": "vegan",
      "name": "EVE VEGAN 인증",
      "issueDate": "2025-01-10",
      "expiryDate": "2026-01-09",
      "fileUrl": "",
      "status": "pending"
    }
  ]'::jsonb,
  enable_tiered_commission = true,
  tier1_rate = 15,
  tier2_rate = 20,
  tier3_rate = 25,
  tier4_rate = 30,
  settlement_cycle = 'monthly',
  minimum_payout = 50,
  bank_name = '국민은행',
  account_number = '123-456-789012',
  account_holder = '뷰티랩코리아(주)'
WHERE company_name = 'Beauty Lab Korea';

-- Update test creator with social links
UPDATE creators
SET
  instagram = 'https://instagram.com/sakura_beauty',
  youtube = 'https://youtube.com/@sakura_beauty',
  tiktok = 'https://tiktok.com/@sakura_beauty'
WHERE username = 'sakura_beauty';


-- =============================================
-- 8. INSERT SAMPLE PRODUCTS (if none exist)
-- =============================================

-- Only insert if products table is empty
DO $$
DECLARE
  brand_uuid UUID;
  product_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO product_count FROM products;
  IF product_count = 0 THEN
    SELECT id INTO brand_uuid FROM brands WHERE company_name = 'Beauty Lab Korea' LIMIT 1;
    IF brand_uuid IS NOT NULL THEN
      INSERT INTO products (brand_id, name, name_ko, name_en, name_jp, price, price_usd, price_jpy, stock, description, description_ko, description_en, images, category, is_cosmetic, is_active)
      VALUES
        (brand_uuid, '시카 리페어 세럼', '시카 리페어 세럼', 'Cica Repair Serum', 'シカリペアセラム', 28.00, 28, 4200, 500, '민감한 피부를 위한 진정 세럼', '민감한 피부를 위한 진정 세럼', 'Calming serum for sensitive skin', '{}', 'skincare', true, true),
        (brand_uuid, '히알루론산 수분크림', '히알루론산 수분크림', 'Hyaluronic Acid Moisture Cream', 'ヒアルロン酸モイスチャークリーム', 35.00, 35, 5250, 300, '깊은 수분 공급 크림', '깊은 수분 공급 크림', 'Deep hydrating moisture cream', '{}', 'skincare', true, true),
        (brand_uuid, '비타민C 브라이트닝 앰플', '비타민C 브라이트닝 앰플', 'Vitamin C Brightening Ampoule', 'ビタミンCブライトニングアンプル', 42.00, 42, 6300, 200, '피부 톤 개선 비타민C 앰플', '피부 톤 개선 비타민C 앰플', 'Vitamin C ampoule for skin tone improvement', '{}', 'skincare', true, true),
        (brand_uuid, '녹차 클렌징 오일', '녹차 클렌징 오일', 'Green Tea Cleansing Oil', '緑茶クレンジングオイル', 22.00, 22, 3300, 450, '자연 유래 클렌징 오일', '자연 유래 클렌징 오일', 'Natural cleansing oil', '{}', 'skincare', true, true),
        (brand_uuid, '선크림 SPF50+', '선크림 SPF50+', 'Sunscreen SPF50+', '日焼け止め SPF50+', 18.00, 18, 2700, 800, '가벼운 자외선 차단제', '가벼운 자외선 차단제', 'Lightweight sunscreen', '{}', 'skincare', true, true),
        (brand_uuid, '로즈힙 페이스 오일', '로즈힙 페이스 오일', 'Rosehip Face Oil', 'ローズヒップフェイスオイル', 32.00, 32, 4800, 250, '영양 가득 페이스 오일', '영양 가득 페이스 오일', 'Nourishing face oil', '{}', 'skincare', true, true);
    END IF;
  END IF;
END $$;


-- =============================================
-- 9. SAMPLE REQUESTS TABLE (Trial Product Box)
-- =============================================

CREATE TABLE IF NOT EXISTS sample_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL,
  brand_id UUID NOT NULL,
  product_ids TEXT[] NOT NULL DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'shipped', 'received', 'rejected')),
  shipping_address JSONB,
  message TEXT,
  admin_note TEXT,
  tracking_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sample_requests_creator_id ON sample_requests(creator_id);
CREATE INDEX IF NOT EXISTS idx_sample_requests_brand_id ON sample_requests(brand_id);
CREATE INDEX IF NOT EXISTS idx_sample_requests_status ON sample_requests(status);

-- Updated at trigger
CREATE TRIGGER update_sample_requests_updated_at
  BEFORE UPDATE ON sample_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE sample_requests ENABLE ROW LEVEL SECURITY;

-- Creators can view and create their own requests
CREATE POLICY "Creators can view own sample requests" ON sample_requests
  FOR SELECT USING (
    creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid())
  );
CREATE POLICY "Creators can insert sample requests" ON sample_requests
  FOR INSERT WITH CHECK (
    creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid())
  );

-- Brand admins can view requests for their brand
CREATE POLICY "Brand admins can view brand sample requests" ON sample_requests
  FOR SELECT USING (
    brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid())
  );
CREATE POLICY "Brand admins can update brand sample requests" ON sample_requests
  FOR UPDATE USING (
    brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid())
  );

-- Super admin can view all
CREATE POLICY "Super admin can view all sample requests" ON sample_requests
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
  );


-- =============================================
-- DONE! Run this SQL in Supabase Dashboard > SQL Editor
-- =============================================
