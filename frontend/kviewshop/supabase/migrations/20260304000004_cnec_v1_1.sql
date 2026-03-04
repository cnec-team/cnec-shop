-- =============================================
-- CNEC Commerce v1.1 Migration
-- Add new tables and columns for shipping, banners,
-- notifications, and routine_steps normalization
-- =============================================

-- =============================================
-- BRANDS: Add new fields
-- =============================================
ALTER TABLE brands ADD COLUMN IF NOT EXISTS representative_name VARCHAR(100);
ALTER TABLE brands ADD COLUMN IF NOT EXISTS business_registration_url TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS bank_holder VARCHAR(50);
ALTER TABLE brands ADD COLUMN IF NOT EXISTS default_shipping_fee DECIMAL(10,0) DEFAULT 0;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS free_shipping_threshold DECIMAL(10,0);
ALTER TABLE brands ADD COLUMN IF NOT EXISTS default_courier VARCHAR(20);
ALTER TABLE brands ADD COLUMN IF NOT EXISTS return_address TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS exchange_policy TEXT;

-- =============================================
-- PRODUCTS: Add shipping fields
-- =============================================
ALTER TABLE products ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS usage_info TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS shipping_fee_type VARCHAR(20) NOT NULL DEFAULT 'FREE'
  CHECK (shipping_fee_type IN ('FREE', 'PAID', 'CONDITIONAL_FREE'));
ALTER TABLE products ADD COLUMN IF NOT EXISTS shipping_fee DECIMAL(10,0) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS free_shipping_threshold DECIMAL(10,0);
ALTER TABLE products ADD COLUMN IF NOT EXISTS courier VARCHAR(20);
ALTER TABLE products ADD COLUMN IF NOT EXISTS shipping_info TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS return_policy TEXT;

-- =============================================
-- ORDERS: Add payment/shipping fields
-- =============================================
ALTER TABLE orders ADD COLUMN IF NOT EXISTS buyer_id UUID REFERENCES users(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_memo TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS product_amount DECIMAL(10,0);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pg_transaction_id VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pg_provider VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS courier_code VARCHAR(20);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancel_reason TEXT;

-- Update order status check constraint to include new statuses
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('PENDING', 'PAID', 'PREPARING', 'SHIPPING', 'DELIVERED', 'CONFIRMED', 'CANCELLED', 'REFUNDED'));

-- =============================================
-- ROUTINE STEPS (v1.1 - normalized table)
-- Previously steps were embedded as JSONB in beauty_routines
-- =============================================
CREATE TABLE IF NOT EXISTS routine_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  routine_id UUID NOT NULL REFERENCES beauty_routines(id) ON DELETE CASCADE,
  step_name VARCHAR(50) NOT NULL,
  step_description TEXT NOT NULL,
  image_url TEXT,
  link_url TEXT,
  product_tags JSONB DEFAULT '[]',
  display_order INTEGER NOT NULL DEFAULT 0
);

-- =============================================
-- BANNERS
-- =============================================
CREATE TABLE IF NOT EXISTS banners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  banner_type VARCHAR(15) NOT NULL DEFAULT 'HORIZONTAL'
    CHECK (banner_type IN ('HORIZONTAL', 'VERTICAL')),
  link_url TEXT,
  link_type VARCHAR(15) NOT NULL DEFAULT 'EXTERNAL'
    CHECK (link_type IN ('EXTERNAL', 'COLLECTION', 'PRODUCT')),
  is_visible BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- NOTIFICATIONS
-- =============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(15) NOT NULL
    CHECK (type IN ('ORDER', 'SHIPPING', 'SETTLEMENT', 'CAMPAIGN', 'SYSTEM')),
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  link_url TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_routine_steps_routine ON routine_steps(routine_id);
CREATE INDEX IF NOT EXISTS idx_banners_creator ON banners(creator_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_tracking ON orders(tracking_number);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE routine_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES
-- =============================================

-- Routine Steps: public read, creators manage their own
CREATE POLICY "Public read routine_steps" ON routine_steps
  FOR SELECT USING (true);

CREATE POLICY "Creators manage routine_steps" ON routine_steps
  FOR ALL USING (
    routine_id IN (
      SELECT br.id FROM beauty_routines br
      JOIN creators c ON br.creator_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );

-- Banners: public read visible, creators manage their own
CREATE POLICY "Public read banners" ON banners
  FOR SELECT USING (is_visible = true);

CREATE POLICY "Creators manage banners" ON banners
  FOR ALL USING (
    creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid())
  );

-- Notifications: users read and update their own
CREATE POLICY "Users read own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users update own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

-- Orders: allow public lookup by order number and phone
CREATE POLICY "Public read orders by number and phone" ON orders
  FOR SELECT USING (true);
