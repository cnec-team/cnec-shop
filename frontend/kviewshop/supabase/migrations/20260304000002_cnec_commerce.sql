-- CNEC Commerce: Creator Select Shop Platform
-- Database Schema Migration

-- =============================================
-- EXTENSIONS
-- =============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- USERS
-- =============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  role VARCHAR(20) NOT NULL CHECK (role IN ('super_admin', 'brand_admin', 'creator', 'buyer')),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'suspended')),
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- BRANDS
-- =============================================
CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  brand_name VARCHAR(100) NOT NULL,
  logo_url TEXT,
  business_number VARCHAR(50),
  bank_name VARCHAR(50),
  bank_account VARCHAR(50),
  platform_fee_rate DECIMAL(5,4) NOT NULL DEFAULT 0.03,
  description TEXT,
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- CREATORS
-- =============================================
CREATE TABLE IF NOT EXISTS creators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shop_id VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(50) NOT NULL,
  bio TEXT,
  profile_image_url TEXT,
  cover_image_url TEXT,
  banner_image_url TEXT,
  banner_link TEXT,
  instagram_handle VARCHAR(100),
  youtube_handle VARCHAR(100),
  tiktok_handle VARCHAR(100),
  skin_type VARCHAR(20) CHECK (skin_type IN ('combination', 'dry', 'oily', 'normal', 'oily_sensitive')),
  personal_color VARCHAR(20) CHECK (personal_color IN ('spring_warm', 'summer_cool', 'autumn_warm', 'winter_cool')),
  skin_concerns TEXT[] DEFAULT '{}',
  scalp_concerns TEXT[] DEFAULT '{}',
  total_sales DECIMAL(12,0) NOT NULL DEFAULT 0,
  total_earnings DECIMAL(12,0) NOT NULL DEFAULT 0,
  bank_name VARCHAR(50),
  bank_account VARCHAR(50),
  is_business BOOLEAN NOT NULL DEFAULT false,
  business_number VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PRODUCTS
-- =============================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  category VARCHAR(20) NOT NULL CHECK (category IN ('skincare', 'makeup', 'hair', 'body', 'etc')),
  description TEXT,
  original_price DECIMAL(10,0) NOT NULL,
  sale_price DECIMAL(10,0) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  images TEXT[] DEFAULT '{}',
  volume VARCHAR(100),
  ingredients TEXT,
  how_to_use TEXT,
  status VARCHAR(10) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  allow_creator_pick BOOLEAN NOT NULL DEFAULT true,
  default_commission_rate DECIMAL(5,4) NOT NULL DEFAULT 0.10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- CAMPAIGNS
-- =============================================
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  type VARCHAR(10) NOT NULL CHECK (type IN ('GONGGU', 'ALWAYS')),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  status VARCHAR(15) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'RECRUITING', 'ACTIVE', 'ENDED')),
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  recruitment_type VARCHAR(10) NOT NULL DEFAULT 'OPEN' CHECK (recruitment_type IN ('OPEN', 'APPROVAL')),
  commission_rate DECIMAL(5,4) NOT NULL DEFAULT 0.10,
  total_stock INTEGER,
  sold_count INTEGER NOT NULL DEFAULT 0,
  target_participants INTEGER,
  conditions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- CAMPAIGN PRODUCTS
-- =============================================
CREATE TABLE IF NOT EXISTS campaign_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  campaign_price DECIMAL(10,0) NOT NULL,
  per_creator_limit INTEGER
);

-- =============================================
-- CAMPAIGN PARTICIPATIONS
-- =============================================
CREATE TABLE IF NOT EXISTS campaign_participations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  status VARCHAR(10) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  message TEXT,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  UNIQUE(campaign_id, creator_id)
);

-- =============================================
-- COLLECTIONS
-- =============================================
CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  description TEXT,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- CREATOR SHOP ITEMS
-- =============================================
CREATE TABLE IF NOT EXISTS creator_shop_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('GONGGU', 'PICK')),
  collection_id UUID REFERENCES collections(id) ON DELETE SET NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- BEAUTY ROUTINES
-- =============================================
CREATE TABLE IF NOT EXISTS beauty_routines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  steps JSONB NOT NULL DEFAULT '[]',
  is_visible BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- ORDERS
-- =============================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number VARCHAR(20) UNIQUE NOT NULL,
  creator_id UUID NOT NULL REFERENCES creators(id),
  brand_id UUID NOT NULL REFERENCES brands(id),
  buyer_name VARCHAR(50) NOT NULL,
  buyer_phone VARCHAR(20) NOT NULL,
  buyer_email VARCHAR(255) NOT NULL,
  shipping_address TEXT NOT NULL,
  shipping_detail TEXT,
  shipping_zipcode VARCHAR(10),
  total_amount DECIMAL(10,0) NOT NULL,
  shipping_fee DECIMAL(10,0) NOT NULL DEFAULT 0,
  status VARCHAR(15) NOT NULL DEFAULT 'PAID' CHECK (status IN ('PAID', 'SHIPPING', 'DELIVERED', 'CONFIRMED', 'CANCELLED')),
  tracking_number VARCHAR(50),
  paid_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ORDER ITEMS
-- =============================================
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  campaign_id UUID REFERENCES campaigns(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,0) NOT NULL,
  total_price DECIMAL(10,0) NOT NULL
);

-- =============================================
-- CONVERSIONS
-- =============================================
CREATE TABLE IF NOT EXISTS conversions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES creators(id),
  conversion_type VARCHAR(10) NOT NULL CHECK (conversion_type IN ('DIRECT', 'INDIRECT')),
  order_amount DECIMAL(10,0) NOT NULL,
  commission_rate DECIMAL(5,4) NOT NULL,
  commission_amount DECIMAL(10,0) NOT NULL,
  status VARCHAR(10) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELLED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ
);

-- =============================================
-- SETTLEMENTS
-- =============================================
CREATE TABLE IF NOT EXISTS settlements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES creators(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_conversions INTEGER NOT NULL DEFAULT 0,
  total_sales DECIMAL(12,0) NOT NULL DEFAULT 0,
  direct_commission DECIMAL(10,0) NOT NULL DEFAULT 0,
  indirect_commission DECIMAL(10,0) NOT NULL DEFAULT 0,
  gross_commission DECIMAL(10,0) NOT NULL DEFAULT 0,
  withholding_tax DECIMAL(10,0) NOT NULL DEFAULT 0,
  net_amount DECIMAL(10,0) NOT NULL DEFAULT 0,
  status VARCHAR(15) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'CARRIED_OVER')),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- SHOP VISITS
-- =============================================
CREATE TABLE IF NOT EXISTS shop_visits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  visitor_id VARCHAR(100) NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  referer TEXT,
  visited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- =============================================
-- PROMOTION KITS
-- =============================================
CREATE TABLE IF NOT EXISTS promotion_kits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  product_images TEXT[] DEFAULT '{}',
  story_templates TEXT[] DEFAULT '{}',
  recommended_caption TEXT,
  hashtags TEXT[] DEFAULT '{}'
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_brands_user_id ON brands(user_id);
CREATE INDEX IF NOT EXISTS idx_creators_user_id ON creators(user_id);
CREATE INDEX IF NOT EXISTS idx_creators_shop_id ON creators(shop_id);
CREATE INDEX IF NOT EXISTS idx_products_brand_id ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_brand_id ON campaigns(brand_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_type ON campaigns(type);
CREATE INDEX IF NOT EXISTS idx_campaign_products_campaign ON campaign_products(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_products_product ON campaign_products(product_id);
CREATE INDEX IF NOT EXISTS idx_campaign_participations_campaign ON campaign_participations(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_participations_creator ON campaign_participations(creator_id);
CREATE INDEX IF NOT EXISTS idx_creator_shop_items_creator ON creator_shop_items(creator_id);
CREATE INDEX IF NOT EXISTS idx_creator_shop_items_type ON creator_shop_items(type);
CREATE INDEX IF NOT EXISTS idx_collections_creator ON collections(creator_id);
CREATE INDEX IF NOT EXISTS idx_orders_creator ON orders(creator_id);
CREATE INDEX IF NOT EXISTS idx_orders_brand ON orders(brand_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_conversions_creator ON conversions(creator_id);
CREATE INDEX IF NOT EXISTS idx_conversions_order ON conversions(order_id);
CREATE INDEX IF NOT EXISTS idx_settlements_creator ON settlements(creator_id);
CREATE INDEX IF NOT EXISTS idx_settlements_status ON settlements(status);
CREATE INDEX IF NOT EXISTS idx_shop_visits_creator ON shop_visits(creator_id);
CREATE INDEX IF NOT EXISTS idx_shop_visits_visitor ON shop_visits(visitor_id);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_participations ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_shop_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE beauty_routines ENABLE ROW LEVEL SECURITY;

-- Public read for shop-facing tables
CREATE POLICY "Public read products" ON products FOR SELECT USING (status = 'ACTIVE');
CREATE POLICY "Public read campaigns" ON campaigns FOR SELECT USING (status IN ('RECRUITING', 'ACTIVE'));
CREATE POLICY "Public read campaign_products" ON campaign_products FOR SELECT USING (true);
CREATE POLICY "Public read creators" ON creators FOR SELECT USING (true);
CREATE POLICY "Public read creator_shop_items" ON creator_shop_items FOR SELECT USING (is_visible = true);
CREATE POLICY "Public read collections" ON collections FOR SELECT USING (is_visible = true);
CREATE POLICY "Public read beauty_routines" ON beauty_routines FOR SELECT USING (is_visible = true);

-- Authenticated user policies
CREATE POLICY "Users can read own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Brand admins manage own brand" ON brands FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Creators manage own profile" ON creators FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Brand admins manage own products" ON products FOR ALL USING (
  brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid())
);

CREATE POLICY "Brand admins manage own campaigns" ON campaigns FOR ALL USING (
  brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid())
);

CREATE POLICY "Brand admins manage campaign products" ON campaign_products FOR ALL USING (
  campaign_id IN (SELECT c.id FROM campaigns c JOIN brands b ON c.brand_id = b.id WHERE b.user_id = auth.uid())
);

CREATE POLICY "Creators manage participations" ON campaign_participations FOR ALL USING (
  creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid())
);

CREATE POLICY "Creators manage shop items" ON creator_shop_items FOR ALL USING (
  creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid())
);

CREATE POLICY "Creators manage collections" ON collections FOR ALL USING (
  creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid())
);

CREATE POLICY "Creators manage routines" ON beauty_routines FOR ALL USING (
  creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid())
);

CREATE POLICY "Brand admins view own orders" ON orders FOR SELECT USING (
  brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid())
);

CREATE POLICY "Brand admins update own orders" ON orders FOR UPDATE USING (
  brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid())
);

CREATE POLICY "Order items follow order access" ON order_items FOR SELECT USING (
  order_id IN (SELECT id FROM orders WHERE brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid()))
);

CREATE POLICY "Creators view own conversions" ON conversions FOR SELECT USING (
  creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid())
);

CREATE POLICY "Creators view own settlements" ON settlements FOR SELECT USING (
  creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid())
);

CREATE POLICY "Public insert shop visits" ON shop_visits FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read shop visits" ON shop_visits FOR SELECT USING (true);

CREATE POLICY "Brand admins manage promotion kits" ON promotion_kits FOR ALL USING (
  campaign_id IN (SELECT c.id FROM campaigns c JOIN brands b ON c.brand_id = b.id WHERE b.user_id = auth.uid())
);

-- Allow anyone to create orders (public checkout)
CREATE POLICY "Public create orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public create order items" ON order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Public create conversions" ON conversions FOR INSERT WITH CHECK (true);
