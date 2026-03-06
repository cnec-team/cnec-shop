-- Stream E: 포인트 시스템 + 추천 리워드 + 등급 + 가이드 콘텐츠
-- 4개 테이블 + RLS + RPC + 시드 가이드 5건

-- ============================================================
-- 1. creator_points: 포인트 적립/사용 이력
-- ============================================================
CREATE TABLE IF NOT EXISTS creator_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  point_type VARCHAR(20) NOT NULL CHECK (point_type IN (
    'SIGNUP_BONUS','PERSONA_COMPLETE','FIRST_PRODUCT','FIRST_SALE',
    'REFERRAL_INVITE','REFERRAL_SALE','WEEKLY_ACTIVE','MONTHLY_TARGET',
    'WITHDRAW','ADMIN_ADJUST'
  )),
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  description TEXT,
  related_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_creator_points_creator_date
  ON creator_points (creator_id, created_at DESC);

-- ============================================================
-- 2. creator_referrals: 추천 시스템
-- ============================================================
CREATE TABLE IF NOT EXISTS creator_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  referred_id UUID REFERENCES creators(id) ON DELETE SET NULL,
  referral_code VARCHAR(20) UNIQUE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN (
    'PENDING','SIGNUP_COMPLETE','FIRST_SALE_COMPLETE'
  )),
  referrer_reward_total INTEGER NOT NULL DEFAULT 0,
  referred_reward_total INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_creator_referrals_referrer
  ON creator_referrals (referrer_id);
CREATE INDEX IF NOT EXISTS idx_creator_referrals_code
  ON creator_referrals (referral_code);

-- ============================================================
-- 3. creator_grades: 크리에이터 등급
-- ============================================================
CREATE TABLE IF NOT EXISTS creator_grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE UNIQUE,
  grade VARCHAR(10) NOT NULL DEFAULT 'ROOKIE' CHECK (grade IN (
    'ROOKIE','SILVER','GOLD','PLATINUM'
  )),
  monthly_sales INTEGER NOT NULL DEFAULT 0,
  commission_bonus_rate DECIMAL(5,4) NOT NULL DEFAULT 0,
  grade_updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 4. guides: 가이드 콘텐츠
-- ============================================================
CREATE TABLE IF NOT EXISTS guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  category VARCHAR(20) NOT NULL CHECK (category IN (
    'CREATOR_BEGINNER','CREATOR_SALES','BRAND_START','BRAND_OPTIMIZE'
  )),
  content_type VARCHAR(10) NOT NULL DEFAULT 'CARD' CHECK (content_type IN (
    'CARD','VIDEO','ARTICLE'
  )),
  content JSONB NOT NULL DEFAULT '{"sections":[]}',
  target_grade VARCHAR(10) NOT NULL DEFAULT 'ALL' CHECK (target_grade IN (
    'ALL','SILVER','GOLD','PLATINUM'
  )),
  display_order INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guides_published_order
  ON guides (is_published, display_order);

-- ============================================================
-- RLS 정책
-- ============================================================
ALTER TABLE creator_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE guides ENABLE ROW LEVEL SECURITY;

-- creator_points: 본인 READ만
CREATE POLICY "creator_points_select_own" ON creator_points
  FOR SELECT USING (
    creator_id IN (
      SELECT id FROM creators WHERE user_id = auth.uid()
    )
  );

-- creator_referrals: 본인(referrer 또는 referred) READ
CREATE POLICY "creator_referrals_select_own" ON creator_referrals
  FOR SELECT USING (
    referrer_id IN (SELECT id FROM creators WHERE user_id = auth.uid())
    OR referred_id IN (SELECT id FROM creators WHERE user_id = auth.uid())
  );

-- creator_grades: 본인 READ
CREATE POLICY "creator_grades_select_own" ON creator_grades
  FOR SELECT USING (
    creator_id IN (
      SELECT id FROM creators WHERE user_id = auth.uid()
    )
  );

-- guides: 공개된 가이드 READ + 어드민 CRUD
CREATE POLICY "guides_select_published" ON guides
  FOR SELECT USING (is_published = true);

CREATE POLICY "guides_admin_all" ON guides
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- ============================================================
-- RPC: award_points (원자적 포인트 적립)
-- ============================================================
CREATE OR REPLACE FUNCTION award_points(
  p_creator_id UUID,
  p_type TEXT,
  p_amount INTEGER,
  p_description TEXT DEFAULT NULL,
  p_related_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
  v_point_id UUID;
BEGIN
  -- 현재 잔액 조회 (최신 레코드 기준, 없으면 0)
  SELECT COALESCE(
    (SELECT balance_after FROM creator_points
     WHERE creator_id = p_creator_id
     ORDER BY created_at DESC
     LIMIT 1),
    0
  ) INTO v_current_balance;

  v_new_balance := v_current_balance + p_amount;

  -- 출금 시 잔액 부족 체크
  IF p_amount < 0 AND v_new_balance < 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient balance',
      'balance', v_current_balance
    );
  END IF;

  INSERT INTO creator_points (creator_id, point_type, amount, balance_after, description, related_id)
  VALUES (p_creator_id, p_type, p_amount, v_new_balance, p_description, p_related_id)
  RETURNING id INTO v_point_id;

  RETURN jsonb_build_object(
    'success', true,
    'point_id', v_point_id,
    'balance', v_new_balance
  );
END;
$$;

-- ============================================================
-- RPC: calculate_creator_grades (월간 등급 일괄 업데이트, cron용)
-- ============================================================
CREATE OR REPLACE FUNCTION calculate_creator_grades()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_creator RECORD;
  v_monthly_sales INTEGER;
  v_new_grade TEXT;
  v_bonus_rate DECIMAL(5,4);
  v_start_date TIMESTAMPTZ;
BEGIN
  -- 전월 시작/끝 계산
  v_start_date := date_trunc('month', NOW() - INTERVAL '1 month');

  FOR v_creator IN SELECT id FROM creators LOOP
    -- 전월 CONFIRMED 주문 합계
    SELECT COALESCE(SUM(total_amount), 0)::INTEGER
    INTO v_monthly_sales
    FROM orders
    WHERE creator_id = v_creator.id
      AND status = 'CONFIRMED'
      AND paid_at >= v_start_date
      AND paid_at < date_trunc('month', NOW());

    -- 등급 결정
    IF v_monthly_sales >= 2000000 THEN
      v_new_grade := 'PLATINUM';
      v_bonus_rate := 0.03;
    ELSIF v_monthly_sales >= 500000 THEN
      v_new_grade := 'GOLD';
      v_bonus_rate := 0.02;
    ELSIF v_monthly_sales >= 100000 THEN
      v_new_grade := 'SILVER';
      v_bonus_rate := 0.01;
    ELSE
      v_new_grade := 'ROOKIE';
      v_bonus_rate := 0;
    END IF;

    -- UPSERT
    INSERT INTO creator_grades (creator_id, grade, monthly_sales, commission_bonus_rate, grade_updated_at)
    VALUES (v_creator.id, v_new_grade, v_monthly_sales, v_bonus_rate, NOW())
    ON CONFLICT (creator_id) DO UPDATE SET
      grade = EXCLUDED.grade,
      monthly_sales = EXCLUDED.monthly_sales,
      commission_bonus_rate = EXCLUDED.commission_bonus_rate,
      grade_updated_at = NOW();
  END LOOP;
END;
$$;

-- ============================================================
-- 시드 데이터: 가이드 5건
-- ============================================================
INSERT INTO guides (title, category, content_type, content, target_grade, display_order, is_published)
VALUES
  (
    '내 셀렉트샵 시작하기',
    'CREATOR_BEGINNER', 'CARD',
    '{"sections":[{"type":"heading","text":"셀렉트샵이란?"},{"type":"paragraph","text":"크넥 셀렉트샵은 내가 직접 큐레이션한 상품을 판매하는 나만의 온라인 스토어입니다. 복잡한 사입이나 재고 관리 없이, 마음에 드는 상품을 골라 내 샵에 추가하면 바로 판매를 시작할 수 있습니다."},{"type":"tip","text":"첫 상품을 추가하면 1,000 포인트가 적립됩니다!"},{"type":"heading","text":"시작하는 방법"},{"type":"paragraph","text":"1. 크리에이터 센터에서 샵 정보를 설정하세요.\n2. 브랜드 상품을 둘러보고 마음에 드는 상품을 내 샵에 추가하세요.\n3. 내 샵 링크를 SNS에 공유하면 끝!"}]}'::jsonb,
    'ALL', 1, true
  ),
  (
    '프로필 매력적으로 꾸미기',
    'CREATOR_BEGINNER', 'CARD',
    '{"sections":[{"type":"heading","text":"첫인상이 중요합니다"},{"type":"paragraph","text":"방문자가 내 셀렉트샵에 처음 들어왔을 때, 프로필이 매력적이면 상품도 더 신뢰하게 됩니다. 프로필 사진, 커버 이미지, 자기소개를 꼼꼼히 작성해보세요."},{"type":"tip","text":"피부 타입과 퍼스널 컬러를 입력하면 방문자에게 더 전문적으로 보입니다."},{"type":"heading","text":"좋은 프로필 작성법"},{"type":"paragraph","text":"- 밝고 선명한 프로필 사진을 사용하세요.\n- 자기소개에 내 피부 고민과 뷰티 철학을 담으세요.\n- SNS 채널을 연결하면 신뢰도가 올라갑니다."}]}'::jsonb,
    'ALL', 2, true
  ),
  (
    '인스타에서 내 샵 홍보하는 법',
    'CREATOR_SALES', 'CARD',
    '{"sections":[{"type":"heading","text":"인스타그램 활용 전략"},{"type":"paragraph","text":"인스타그램은 뷰티 크리에이터에게 가장 효과적인 홍보 채널입니다. 스토리, 릴스, 피드를 활용해 자연스럽게 상품을 소개해보세요."},{"type":"tip","text":"링크인바이오에 내 셀렉트샵 URL을 넣어두세요!"},{"type":"heading","text":"효과적인 콘텐츠 유형"},{"type":"paragraph","text":"1. Before/After 비교 사진\n2. 일상에서 사용하는 모습 (릴스)\n3. 솔직한 사용 후기 (스토리)\n4. 공구 기간 한정 할인 안내"}]}'::jsonb,
    'ALL', 3, true
  ),
  (
    '잘 파는 크리에이터의 비밀',
    'CREATOR_SALES', 'CARD',
    '{"sections":[{"type":"heading","text":"상위 크리에이터의 공통점"},{"type":"paragraph","text":"크넥에서 높은 판매 실적을 올리는 크리에이터들에게는 몇 가지 공통된 습관이 있습니다."},{"type":"heading","text":"핵심 습관 4가지"},{"type":"paragraph","text":"1. 매일 1개 이상 콘텐츠 업로드\n2. 직접 사용한 상품만 추천\n3. 팔로워 DM에 빠르게 답변\n4. 공구 시작 전 예고 콘텐츠 제작"},{"type":"tip","text":"꾸준함이 핵심입니다. 매주 활동하면 1,000 포인트 보상도 받을 수 있어요!"}]}'::jsonb,
    'ALL', 4, true
  ),
  (
    '공구 전환율 높이는 5가지',
    'CREATOR_SALES', 'CARD',
    '{"sections":[{"type":"heading","text":"전환율이란?"},{"type":"paragraph","text":"전환율은 내 셀렉트샵을 방문한 사람 중 실제로 구매한 비율입니다. 전환율이 높을수록 같은 방문자 수로 더 많은 매출을 올릴 수 있습니다."},{"type":"heading","text":"전환율 높이는 5가지 방법"},{"type":"paragraph","text":"1. 상품 설명에 나만의 리뷰를 추가하세요.\n2. 한정 수량/기간을 강조하세요.\n3. 배송비 무료 상품을 전면에 배치하세요.\n4. 세트 구성으로 객단가를 높이세요.\n5. 구매 후기를 스토리로 공유해주세요."},{"type":"tip","text":"크넥 크리에이터 센터의 판매 현황에서 전환율을 확인할 수 있습니다."}]}'::jsonb,
    'ALL', 5, true
  );
