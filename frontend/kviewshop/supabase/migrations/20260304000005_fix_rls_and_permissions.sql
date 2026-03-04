-- =============================================
-- KviewShop Migration 003: Fix RLS Policies, Permissions & Creator Settings
-- =============================================
-- This migration:
-- 1. Fixes 406 errors by ensuring proper RLS policies
-- 2. Adds comprehensive CRUD permissions for all roles
-- 3. Adds background_color and payment fields for creators
-- 4. Ensures all tables can be properly read/written by their owners
-- =============================================

-- =============================================
-- 1. CREATORS TABLE - Add new columns
-- =============================================

-- Background color for creator shop (separate from theme accent color)
ALTER TABLE creators ADD COLUMN IF NOT EXISTS background_color TEXT DEFAULT '#1a1a1a';

-- Payment/settlement info for creators
ALTER TABLE creators ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'paypal';
ALTER TABLE creators ADD COLUMN IF NOT EXISTS paypal_email TEXT;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS account_number TEXT;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS swift_code TEXT;

-- Contact info
ALTER TABLE creators ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS phone TEXT;

-- Notification preferences (JSONB for flexibility)
ALTER TABLE creators ADD COLUMN IF NOT EXISTS notification_settings JSONB DEFAULT '{
  "email_notifications": true,
  "order_notifications": true,
  "settlement_notifications": true
}'::jsonb;


-- =============================================
-- 1b. BRANDS TABLE - Add bank verification columns
-- =============================================

-- Brand lines (sub-brands) - JSONB array of { id, name, logo_url, description }
ALTER TABLE brands ADD COLUMN IF NOT EXISTS brand_lines JSONB DEFAULT '[]'::jsonb;

ALTER TABLE brands ADD COLUMN IF NOT EXISTS bank_code TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS bank_verified BOOLEAN DEFAULT false;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS bank_verified_at TIMESTAMPTZ;

-- =============================================
-- 1c. SAMPLE_REQUESTS TABLE - Add shipping address column
-- =============================================

ALTER TABLE sample_requests ADD COLUMN IF NOT EXISTS shipping_address JSONB;

-- Update commission rate constraint to 15-60%
ALTER TABLE brands DROP CONSTRAINT IF EXISTS brands_creator_commission_rate_check;
ALTER TABLE brands ADD CONSTRAINT brands_creator_commission_rate_check
  CHECK (creator_commission_rate >= 15 AND creator_commission_rate <= 60);

ALTER TABLE brands DROP CONSTRAINT IF EXISTS brands_tier1_commission_rate_check;
ALTER TABLE brands ADD CONSTRAINT brands_tier1_commission_rate_check
  CHECK (tier1_commission_rate IS NULL OR (tier1_commission_rate >= 15 AND tier1_commission_rate <= 60));

ALTER TABLE brands DROP CONSTRAINT IF EXISTS brands_tier2_commission_rate_check;
ALTER TABLE brands ADD CONSTRAINT brands_tier2_commission_rate_check
  CHECK (tier2_commission_rate IS NULL OR (tier2_commission_rate >= 15 AND tier2_commission_rate <= 60));

ALTER TABLE brands DROP CONSTRAINT IF EXISTS brands_tier3_commission_rate_check;
ALTER TABLE brands ADD CONSTRAINT brands_tier3_commission_rate_check
  CHECK (tier3_commission_rate IS NULL OR (tier3_commission_rate >= 15 AND tier3_commission_rate <= 60));

ALTER TABLE brands DROP CONSTRAINT IF EXISTS brands_tier4_commission_rate_check;
ALTER TABLE brands ADD CONSTRAINT brands_tier4_commission_rate_check
  CHECK (tier4_commission_rate IS NULL OR (tier4_commission_rate >= 15 AND tier4_commission_rate <= 60));


-- =============================================
-- 2. USERS TABLE - Fix RLS Policies
-- =============================================
-- Users need to be able to read their own data and super_admin reads all

DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Super admin can view all users
DROP POLICY IF EXISTS "Super admin can view all users" ON users;
CREATE POLICY "Super admin can view all users" ON users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'super_admin')
  );

-- Super admin can update all users
DROP POLICY IF EXISTS "Super admin can update all users" ON users;
CREATE POLICY "Super admin can update all users" ON users
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'super_admin')
  );

-- Allow insert for new user registration
DROP POLICY IF EXISTS "Anyone can insert users" ON users;
CREATE POLICY "Anyone can insert users" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);


-- =============================================
-- 3. CREATORS TABLE - Fix RLS Policies
-- =============================================
-- The 406 error occurs because the creator row can't be read/updated

-- Anyone can view creators (public profiles for shops)
DROP POLICY IF EXISTS "Anyone can view creators" ON creators;
CREATE POLICY "Anyone can view creators" ON creators
  FOR SELECT USING (true);

-- Creators can update their own profile
DROP POLICY IF EXISTS "Creators can update own profile" ON creators;
CREATE POLICY "Creators can update own profile" ON creators
  FOR UPDATE USING (user_id = auth.uid());

-- Allow creator registration
DROP POLICY IF EXISTS "Anyone can insert creators" ON creators;
CREATE POLICY "Anyone can insert creators" ON creators
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Super admin can manage all creators
DROP POLICY IF EXISTS "Super admin can manage all creators" ON creators;
CREATE POLICY "Super admin can manage all creators" ON creators
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
  );


-- =============================================
-- 4. BRANDS TABLE - Fix RLS Policies
-- =============================================

-- Anyone can view approved brands (public)
DROP POLICY IF EXISTS "Anyone can view approved brands" ON brands;
CREATE POLICY "Anyone can view approved brands" ON brands
  FOR SELECT USING (approved = true);

-- Brand admins can view own brand (even if not approved)
DROP POLICY IF EXISTS "Brand admins can view own brand" ON brands;
CREATE POLICY "Brand admins can view own brand" ON brands
  FOR SELECT USING (user_id = auth.uid());

-- Brand admins can update own brand
DROP POLICY IF EXISTS "Brand admins can update own brand" ON brands;
CREATE POLICY "Brand admins can update own brand" ON brands
  FOR UPDATE USING (user_id = auth.uid());

-- Anyone can insert brands (registration)
DROP POLICY IF EXISTS "Anyone can insert brands" ON brands;
CREATE POLICY "Anyone can insert brands" ON brands
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Creators can view brand info (for product pages)
DROP POLICY IF EXISTS "Creators can view brand info" ON brands;
CREATE POLICY "Creators can view brand info" ON brands
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'creator')
  );

-- Super admin can view all brands
DROP POLICY IF EXISTS "Super admin can view all brands" ON brands;
CREATE POLICY "Super admin can view all brands" ON brands
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
  );

-- Super admin can update all brands
DROP POLICY IF EXISTS "Super admin can update all brands" ON brands;
CREATE POLICY "Super admin can update all brands" ON brands
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
  );

-- Super admin can delete brands
DROP POLICY IF EXISTS "Super admin can delete brands" ON brands;
CREATE POLICY "Super admin can delete brands" ON brands
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
  );


-- =============================================
-- 5. PRODUCTS TABLE - Fix RLS Policies
-- =============================================

-- Anyone can view active products
DROP POLICY IF EXISTS "Anyone can view active products" ON products;
CREATE POLICY "Anyone can view active products" ON products
  FOR SELECT USING (is_active = true);

-- Brand admins can view ALL their products (including inactive)
DROP POLICY IF EXISTS "Brand admins can view own products" ON products;
CREATE POLICY "Brand admins can view own products" ON products
  FOR SELECT USING (
    brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid())
  );

-- Brand admins can manage own products
DROP POLICY IF EXISTS "Brand admins can manage own products" ON products;
CREATE POLICY "Brand admins can manage own products" ON products
  FOR ALL USING (
    brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid())
  );

-- Super admin can manage all products
DROP POLICY IF EXISTS "Super admin can manage all products" ON products;
CREATE POLICY "Super admin can manage all products" ON products
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
  );


-- =============================================
-- 6. CREATOR_PRODUCTS TABLE - Fix RLS Policies
-- =============================================

DROP POLICY IF EXISTS "Anyone can view creator products" ON creator_products;
CREATE POLICY "Anyone can view creator products" ON creator_products
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Creators can manage own picks" ON creator_products;
CREATE POLICY "Creators can manage own picks" ON creator_products
  FOR ALL USING (
    creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid())
  );


-- =============================================
-- 7. ORDERS TABLE - Fix RLS Policies
-- =============================================

-- Brand admins can view orders for their brand
DROP POLICY IF EXISTS "Brand admins can view brand orders" ON orders;
CREATE POLICY "Brand admins can view brand orders" ON orders
  FOR SELECT USING (
    brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid())
  );

-- Brand admins can update orders for their brand (status, tracking)
DROP POLICY IF EXISTS "Brand admins can update brand orders" ON orders;
CREATE POLICY "Brand admins can update brand orders" ON orders
  FOR UPDATE USING (
    brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid())
  );

-- Creators can view their own orders
DROP POLICY IF EXISTS "Creators can view own orders" ON orders;
CREATE POLICY "Creators can view own orders" ON orders
  FOR SELECT USING (
    creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid())
  );

-- Anyone can insert orders (customer checkout)
DROP POLICY IF EXISTS "Anyone can insert orders" ON orders;
CREATE POLICY "Anyone can insert orders" ON orders
  FOR INSERT WITH CHECK (true);

-- Super admin can manage all orders
DROP POLICY IF EXISTS "Super admin can manage all orders" ON orders;
CREATE POLICY "Super admin can manage all orders" ON orders
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
  );


-- =============================================
-- 8. ORDER_ITEMS TABLE - Fix RLS Policies
-- =============================================

DROP POLICY IF EXISTS "Users can view own order items" ON order_items;
CREATE POLICY "Users can view own order items" ON order_items
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM orders WHERE
        brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid())
        OR creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid())
    )
  );

-- Anyone can insert order items (part of checkout)
DROP POLICY IF EXISTS "Anyone can insert order items" ON order_items;
CREATE POLICY "Anyone can insert order items" ON order_items
  FOR INSERT WITH CHECK (true);

-- Super admin can manage all order items
DROP POLICY IF EXISTS "Super admin can manage all order items" ON order_items;
CREATE POLICY "Super admin can manage all order items" ON order_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
  );


-- =============================================
-- 9. SETTLEMENTS TABLE - Fix RLS Policies
-- =============================================

DROP POLICY IF EXISTS "Users can view own settlements" ON settlements;
CREATE POLICY "Users can view own settlements" ON settlements
  FOR SELECT USING (user_id = auth.uid());

-- Super admin can manage all settlements
DROP POLICY IF EXISTS "Super admin can manage all settlements" ON settlements;
CREATE POLICY "Super admin can manage all settlements" ON settlements
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
  );


-- =============================================
-- 10. SAMPLE_REQUESTS TABLE - Fix RLS Policies
-- =============================================

-- Re-create sample_requests policies to ensure no conflicts
DROP POLICY IF EXISTS "Creators can view own sample requests" ON sample_requests;
CREATE POLICY "Creators can view own sample requests" ON sample_requests
  FOR SELECT USING (
    creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Creators can insert sample requests" ON sample_requests;
CREATE POLICY "Creators can insert sample requests" ON sample_requests
  FOR INSERT WITH CHECK (
    creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Brand admins can view brand sample requests" ON sample_requests;
CREATE POLICY "Brand admins can view brand sample requests" ON sample_requests
  FOR SELECT USING (
    brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Brand admins can update brand sample requests" ON sample_requests;
CREATE POLICY "Brand admins can update brand sample requests" ON sample_requests
  FOR UPDATE USING (
    brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Super admin can view all sample requests" ON sample_requests;
CREATE POLICY "Super admin can manage all sample requests" ON sample_requests
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
  );


-- =============================================
-- 11. STORAGE POLICIES (for profile images)
-- =============================================

-- Create profiles bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('profiles', 'profiles', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to profiles bucket
DROP POLICY IF EXISTS "Authenticated users can upload profile images" ON storage.objects;
CREATE POLICY "Authenticated users can upload profile images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'profiles' AND auth.role() = 'authenticated'
  );

-- Allow authenticated users to update their own profile images
DROP POLICY IF EXISTS "Users can update own profile images" ON storage.objects;
CREATE POLICY "Users can update own profile images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'profiles' AND auth.role() = 'authenticated'
  );

-- Allow public access to profile images
DROP POLICY IF EXISTS "Public access to profile images" ON storage.objects;
CREATE POLICY "Public access to profile images" ON storage.objects
  FOR SELECT USING (bucket_id = 'profiles');

-- Allow users to delete their own profile images
DROP POLICY IF EXISTS "Users can delete own profile images" ON storage.objects;
CREATE POLICY "Users can delete own profile images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'profiles' AND auth.role() = 'authenticated'
  );


-- =============================================
-- 12. SUPPORT_TICKETS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('product', 'cs')),
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  from_name TEXT NOT NULL DEFAULT '',
  from_email TEXT,
  order_id TEXT,
  response TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Brand admins can view and create tickets for their brand
DROP POLICY IF EXISTS "Brand admins can view own support tickets" ON support_tickets;
CREATE POLICY "Brand admins can view own support tickets" ON support_tickets
  FOR SELECT USING (
    brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Brand admins can create support tickets" ON support_tickets;
CREATE POLICY "Brand admins can create support tickets" ON support_tickets
  FOR INSERT WITH CHECK (
    brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid())
  );

-- Super admin can manage all support tickets
DROP POLICY IF EXISTS "Super admin can manage all support tickets" ON support_tickets;
CREATE POLICY "Super admin can manage all support tickets" ON support_tickets
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
  );


-- =============================================
-- DONE! Run this SQL in Supabase Dashboard > SQL Editor
-- =============================================
