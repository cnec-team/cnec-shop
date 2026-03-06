-- Stream B: Creator Onboarding - 페르소나 + 미션 테이블

-- 1. Creator 테이블에 age_range, interests 컬럼 추가
ALTER TABLE creators ADD COLUMN IF NOT EXISTS age_range VARCHAR(20);
ALTER TABLE creators ADD COLUMN IF NOT EXISTS interests TEXT[];
ALTER TABLE creators ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false;

-- 2. creator_missions: 30일 미션 추적
CREATE TABLE IF NOT EXISTS creator_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  mission_key VARCHAR(30) NOT NULL CHECK (mission_key IN (
    'SHOP_OPEN','FIRST_PRODUCT','SNS_SHARE','FIVE_PRODUCTS','FIRST_SALE'
  )),
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  reward_amount INTEGER NOT NULL DEFAULT 0,
  reward_claimed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(creator_id, mission_key)
);

CREATE INDEX IF NOT EXISTS idx_creator_missions_creator
  ON creator_missions (creator_id);

-- RLS
ALTER TABLE creator_missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "creator_missions_select_own" ON creator_missions
  FOR SELECT USING (
    creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid())
  );

-- 3. 크리에이터 프로필 이미지 스토리지 버킷 (Supabase storage policy는 대시보드에서 설정)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('creator-profiles', 'creator-profiles', true)
-- ON CONFLICT DO NOTHING;

-- 4. 크리에이터 생성 시 자동으로 5개 미션 레코드 생성하는 함수
CREATE OR REPLACE FUNCTION init_creator_missions(p_creator_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO creator_missions (creator_id, mission_key, reward_amount, is_completed, completed_at)
  VALUES
    (p_creator_id, 'SHOP_OPEN', 0, true, NOW()),
    (p_creator_id, 'FIRST_PRODUCT', 1000, false, NULL),
    (p_creator_id, 'SNS_SHARE', 2000, false, NULL),
    (p_creator_id, 'FIVE_PRODUCTS', 3000, false, NULL),
    (p_creator_id, 'FIRST_SALE', 5000, false, NULL)
  ON CONFLICT (creator_id, mission_key) DO NOTHING;
END;
$$;

-- 5. 미션 완료 체크 및 보상 함수
CREATE OR REPLACE FUNCTION check_and_complete_mission(p_creator_id UUID, p_mission_key TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_mission RECORD;
  v_result JSONB;
BEGIN
  SELECT * INTO v_mission
  FROM creator_missions
  WHERE creator_id = p_creator_id AND mission_key = p_mission_key;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Mission not found');
  END IF;

  IF v_mission.is_completed THEN
    RETURN jsonb_build_object('success', true, 'already_completed', true);
  END IF;

  -- Mark mission as completed
  UPDATE creator_missions
  SET is_completed = true, completed_at = NOW()
  WHERE id = v_mission.id;

  -- Award points if reward > 0 and not yet claimed
  IF v_mission.reward_amount > 0 AND NOT v_mission.reward_claimed THEN
    PERFORM award_points(
      p_creator_id,
      CASE p_mission_key
        WHEN 'FIRST_PRODUCT' THEN 'FIRST_PRODUCT'
        WHEN 'SNS_SHARE' THEN 'WEEKLY_ACTIVE'
        WHEN 'FIVE_PRODUCTS' THEN 'MONTHLY_TARGET'
        WHEN 'FIRST_SALE' THEN 'FIRST_SALE'
        ELSE 'ADMIN_ADJUST'
      END,
      v_mission.reward_amount,
      '30일 미션: ' || p_mission_key,
      v_mission.id
    );

    UPDATE creator_missions
    SET reward_claimed = true
    WHERE id = v_mission.id;
  END IF;

  RETURN jsonb_build_object('success', true, 'reward', v_mission.reward_amount);
END;
$$;
