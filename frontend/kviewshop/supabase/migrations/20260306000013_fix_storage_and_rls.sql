-- Fix: Storage 버킷 + 누락된 RLS 정책 보완
-- 이슈: 브라우저 테스트에서 400/403 에러 다수 발생

-- ============================================================
-- 1. Storage 버킷: products (크리에이터 프로필 이미지 포함)
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

-- products 버킷 정책
DROP POLICY IF EXISTS "Authenticated users can upload to products" ON storage.objects;
CREATE POLICY "Authenticated users can upload to products" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'products' AND auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "Authenticated users can update products files" ON storage.objects;
CREATE POLICY "Authenticated users can update products files" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'products' AND auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "Public read products files" ON storage.objects;
CREATE POLICY "Public read products files" ON storage.objects
  FOR SELECT USING (bucket_id = 'products');

DROP POLICY IF EXISTS "Authenticated users can delete products files" ON storage.objects;
CREATE POLICY "Authenticated users can delete products files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'products' AND auth.role() = 'authenticated'
  );

-- ============================================================
-- 2. creator_points: INSERT 정책 (service_role 외 API route에서도 사용)
-- ============================================================
DROP POLICY IF EXISTS "Service can insert creator_points" ON creator_points;
CREATE POLICY "Service can insert creator_points" ON creator_points
  FOR INSERT WITH CHECK (
    creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid())
  );

-- ============================================================
-- 3. creator_referrals: INSERT 정책 (첫 추천코드 생성 시)
-- ============================================================
DROP POLICY IF EXISTS "Creators can insert own referrals" ON creator_referrals;
CREATE POLICY "Creators can insert own referrals" ON creator_referrals
  FOR INSERT WITH CHECK (
    referrer_id IN (SELECT id FROM creators WHERE user_id = auth.uid())
  );

-- UPDATE 정책 (추천 상태 업데이트)
DROP POLICY IF EXISTS "Creators can update own referrals" ON creator_referrals;
CREATE POLICY "Creators can update own referrals" ON creator_referrals
  FOR UPDATE USING (
    referrer_id IN (SELECT id FROM creators WHERE user_id = auth.uid())
  );

-- ============================================================
-- 4. creator_grades: INSERT/UPDATE 정책
-- ============================================================
DROP POLICY IF EXISTS "Service can manage creator_grades" ON creator_grades;
CREATE POLICY "Service can manage creator_grades" ON creator_grades
  FOR ALL USING (
    creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid())
  );

-- ============================================================
-- 5. guides: 비공개 가이드도 어드민이 볼 수 있도록 보완
-- ============================================================
-- (이미 guides_admin_all 정책이 있으므로 추가 불필요)

-- ============================================================
-- 6. creator_missions: INSERT 정책 (onboarding 시 생성)
-- ============================================================
DROP POLICY IF EXISTS "Creators can insert own missions" ON creator_missions;
CREATE POLICY "Creators can insert own missions" ON creator_missions
  FOR INSERT WITH CHECK (
    creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid())
  );

-- UPDATE 정책 (미션 완료 시)
DROP POLICY IF EXISTS "Creators can update own missions" ON creator_missions;
CREATE POLICY "Creators can update own missions" ON creator_missions
  FOR UPDATE USING (
    creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid())
  );

-- ============================================================
-- 7. shop_visits: INSERT 정책 (방문 기록)
-- ============================================================
ALTER TABLE shop_visits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert shop_visits" ON shop_visits;
CREATE POLICY "Anyone can insert shop_visits" ON shop_visits
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Creators can view own shop_visits" ON shop_visits;
CREATE POLICY "Creators can view own shop_visits" ON shop_visits
  FOR SELECT USING (
    creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Admin can view all shop_visits" ON shop_visits;
CREATE POLICY "Admin can view all shop_visits" ON shop_visits
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
  );

-- ============================================================
-- 8. conversions: SELECT 정책 (브랜드/크리에이터 정산 조회)
-- ============================================================
ALTER TABLE conversions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Creators can view own conversions" ON conversions;
CREATE POLICY "Creators can view own conversions" ON conversions
  FOR SELECT USING (
    creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Brand admins can view brand conversions" ON conversions;
CREATE POLICY "Brand admins can view brand conversions" ON conversions
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM orders WHERE brand_id IN (
        SELECT id FROM brands WHERE user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Admin can manage all conversions" ON conversions;
CREATE POLICY "Admin can manage all conversions" ON conversions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
  );

-- Anyone can insert (payment webhook creates conversions)
DROP POLICY IF EXISTS "Anyone can insert conversions" ON conversions;
CREATE POLICY "Anyone can insert conversions" ON conversions
  FOR INSERT WITH CHECK (true);
