-- KviewShop Database Schema
-- Initial Migration

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT CHECK (role IN ('super_admin', 'brand_admin', 'creator')) NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Brands Table
CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  company_name_en TEXT,
  company_name_jp TEXT,
  business_number TEXT,
  logo_url TEXT,
  description TEXT,
  description_en TEXT,
  description_jp TEXT,
  monthly_fee INTEGER DEFAULT 55000, -- KRW
  creator_commission_rate INTEGER DEFAULT 25 CHECK (creator_commission_rate >= 20 AND creator_commission_rate <= 30),
  mocra_status TEXT DEFAULT 'green' CHECK (mocra_status IN ('green', 'yellow', 'red')),
  us_sales_ytd NUMERIC DEFAULT 0,
  jp_sales_ytd NUMERIC DEFAULT 0,
  approved BOOLEAN DEFAULT false,
  approved_at TIMESTAMP WITH TIME ZONE,
  contact_email TEXT,
  contact_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Creators Table
CREATE TABLE IF NOT EXISTS creators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  profile_image TEXT,
  bio TEXT,
  bio_en TEXT,
  bio_jp TEXT,
  theme_color TEXT DEFAULT '#1a1a1a',
  country TEXT CHECK (country IN ('US', 'JP')) NOT NULL,
  social_links JSONB DEFAULT '{}',
  total_revenue NUMERIC DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products Table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  sku TEXT,
  name_ko TEXT NOT NULL,
  name_en TEXT NOT NULL,
  name_jp TEXT,
  price_usd INTEGER NOT NULL,
  price_jpy INTEGER NOT NULL,
  original_price_usd INTEGER,
  original_price_jpy INTEGER,
  stock INTEGER DEFAULT 0,
  description_ko TEXT,
  description_en TEXT,
  description_jp TEXT,
  images TEXT[] DEFAULT '{}',
  category TEXT,
  is_cosmetic BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Creator Products (Pick) Table
CREATE TABLE IF NOT EXISTS creator_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID REFERENCES creators(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(creator_id, product_id)
);

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL,
  creator_id UUID REFERENCES creators(id),
  brand_id UUID REFERENCES brands(id),
  customer_email TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  shipping_address JSONB NOT NULL,
  country TEXT CHECK (country IN ('US', 'JP')) NOT NULL,
  currency TEXT CHECK (currency IN ('USD', 'JPY')) NOT NULL,
  subtotal NUMERIC NOT NULL,
  shipping_fee NUMERIC DEFAULT 0,
  total_amount NUMERIC NOT NULL,
  creator_revenue NUMERIC,
  platform_revenue NUMERIC,
  brand_revenue NUMERIC,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'shipped', 'completed', 'cancelled', 'refunded')),
  payment_intent_id TEXT,
  tracking_number TEXT,
  shipped_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_price NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Settlements Table
CREATE TABLE IF NOT EXISTS settlements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  user_role TEXT CHECK (user_role IN ('super_admin', 'brand_admin', 'creator')) NOT NULL,
  period TEXT NOT NULL, -- '2026-01'
  total_revenue NUMERIC NOT NULL,
  currency TEXT CHECK (currency IN ('USD', 'JPY', 'KRW')) NOT NULL,
  details JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_brands_user_id ON brands(user_id);
CREATE INDEX IF NOT EXISTS idx_brands_approved ON brands(approved);
CREATE INDEX IF NOT EXISTS idx_brands_mocra_status ON brands(mocra_status);
CREATE INDEX IF NOT EXISTS idx_creators_user_id ON creators(user_id);
CREATE INDEX IF NOT EXISTS idx_creators_username ON creators(username);
CREATE INDEX IF NOT EXISTS idx_creators_country ON creators(country);
CREATE INDEX IF NOT EXISTS idx_products_brand_id ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_creator_products_creator_id ON creator_products(creator_id);
CREATE INDEX IF NOT EXISTS idx_creator_products_product_id ON creator_products(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_creator_id ON orders(creator_id);
CREATE INDEX IF NOT EXISTS idx_orders_brand_id ON orders(brand_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_country ON orders(country);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_settlements_user_id ON settlements(user_id);
CREATE INDEX IF NOT EXISTS idx_settlements_period ON settlements(period);

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON brands FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_creators_updated_at BEFORE UPDATE ON creators FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number = 'KV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(CAST(FLOOR(RANDOM() * 10000) AS TEXT), 4, '0');
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER generate_order_number_trigger
BEFORE INSERT ON orders
FOR EACH ROW
WHEN (NEW.order_number IS NULL)
EXECUTE FUNCTION generate_order_number();

-- Function to update MoCRA status
CREATE OR REPLACE FUNCTION update_mocra_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate US sales for the brand
  UPDATE brands
  SET us_sales_ytd = (
    SELECT COALESCE(SUM(total_amount), 0)
    FROM orders
    WHERE brand_id = NEW.brand_id
      AND country = 'US'
      AND status IN ('paid', 'shipped', 'completed')
      AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW())
  ),
  mocra_status = CASE
    WHEN (
      SELECT COALESCE(SUM(total_amount), 0)
      FROM orders
      WHERE brand_id = NEW.brand_id
        AND country = 'US'
        AND status IN ('paid', 'shipped', 'completed')
        AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW())
    ) >= 1000000 THEN 'red'
    WHEN (
      SELECT COALESCE(SUM(total_amount), 0)
      FROM orders
      WHERE brand_id = NEW.brand_id
        AND country = 'US'
        AND status IN ('paid', 'shipped', 'completed')
        AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW())
    ) >= 800000 THEN 'yellow'
    ELSE 'green'
  END
  WHERE id = NEW.brand_id;

  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_mocra_on_order
AFTER INSERT OR UPDATE ON orders
FOR EACH ROW
WHEN (NEW.country = 'US' AND NEW.status IN ('paid', 'shipped', 'completed'))
EXECUTE FUNCTION update_mocra_status();

-- Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for brands
CREATE POLICY "Anyone can view approved brands" ON brands FOR SELECT USING (approved = true);
CREATE POLICY "Brand admins can view own brand" ON brands FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Brand admins can update own brand" ON brands FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Anyone can insert brands" ON brands FOR INSERT WITH CHECK (true);

-- RLS Policies for creators
CREATE POLICY "Anyone can view creators" ON creators FOR SELECT USING (true);
CREATE POLICY "Creators can update own profile" ON creators FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Anyone can insert creators" ON creators FOR INSERT WITH CHECK (true);

-- RLS Policies for products
CREATE POLICY "Anyone can view active products" ON products FOR SELECT USING (is_active = true);
CREATE POLICY "Brand admins can manage own products" ON products FOR ALL USING (
  brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid())
);

-- RLS Policies for creator_products
CREATE POLICY "Anyone can view creator products" ON creator_products FOR SELECT USING (true);
CREATE POLICY "Creators can manage own picks" ON creator_products FOR ALL USING (
  creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid())
);

-- RLS Policies for orders
CREATE POLICY "Brand admins can view brand orders" ON orders FOR SELECT USING (
  brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid())
);
CREATE POLICY "Creators can view own orders" ON orders FOR SELECT USING (
  creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid())
);
CREATE POLICY "Anyone can insert orders" ON orders FOR INSERT WITH CHECK (true);

-- RLS Policies for order_items
CREATE POLICY "Users can view own order items" ON order_items FOR SELECT USING (
  order_id IN (
    SELECT id FROM orders WHERE
      brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid())
      OR creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid())
  )
);

-- RLS Policies for settlements
CREATE POLICY "Users can view own settlements" ON settlements FOR SELECT USING (user_id = auth.uid());
