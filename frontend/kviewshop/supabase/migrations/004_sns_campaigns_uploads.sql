-- =============================================
-- KviewShop Migration 004: SNS Campaign Upload Tracking
-- =============================================
-- Features:
-- 1. SNS Campaigns - Track SNS content campaigns per country/event
-- 2. SNS Uploads - Track creator SNS URL submissions per campaign
-- =============================================

-- =============================================
-- 1. SNS CAMPAIGNS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS sns_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  country TEXT NOT NULL CHECK (country IN ('KR', 'JP', 'US', 'TW')),
  campaign_type TEXT NOT NULL DEFAULT '기획' CHECK (campaign_type IN ('기획', '숏폼', '리뷰', '라이브')),
  event_name TEXT NOT NULL,                -- e.g., '올영', '메가와리', 'Amazon'
  period_weeks INTEGER NOT NULL DEFAULT 4, -- Duration in weeks
  start_date DATE,
  end_date DATE,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ENDED', 'DRAFT')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 2. SNS UPLOADS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS sns_uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sns_campaign_id UUID NOT NULL REFERENCES sns_campaigns(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  creator_name TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('youtube', 'instagram', 'tiktok')),
  sns_url TEXT,
  video_title TEXT,
  upload_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (upload_status IN ('PENDING', 'UPLOADED', 'VERIFIED', 'REJECTED')),
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  notes TEXT,
  uploaded_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sns_campaign_id, creator_id, platform)
);

-- =============================================
-- 3. INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_sns_campaigns_country ON sns_campaigns(country);
CREATE INDEX IF NOT EXISTS idx_sns_campaigns_status ON sns_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_sns_campaigns_event ON sns_campaigns(event_name);
CREATE INDEX IF NOT EXISTS idx_sns_uploads_campaign ON sns_uploads(sns_campaign_id);
CREATE INDEX IF NOT EXISTS idx_sns_uploads_creator ON sns_uploads(creator_id);
CREATE INDEX IF NOT EXISTS idx_sns_uploads_status ON sns_uploads(upload_status);

-- =============================================
-- 4. RLS POLICIES
-- =============================================

ALTER TABLE sns_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE sns_uploads ENABLE ROW LEVEL SECURITY;

-- Super admin can do everything
CREATE POLICY "Super admin full access on sns_campaigns"
  ON sns_campaigns FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'super_admin')
  );

CREATE POLICY "Super admin full access on sns_uploads"
  ON sns_uploads FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'super_admin')
  );

-- Creators can view their own uploads
CREATE POLICY "Creators can view own sns_uploads"
  ON sns_uploads FOR SELECT
  USING (
    creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid())
  );

-- Creators can insert/update their own uploads
CREATE POLICY "Creators can manage own sns_uploads"
  ON sns_uploads FOR INSERT
  WITH CHECK (
    creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid())
  );

CREATE POLICY "Creators can update own sns_uploads"
  ON sns_uploads FOR UPDATE
  USING (
    creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid())
  );

-- Everyone can view active campaigns
CREATE POLICY "All users can view active sns_campaigns"
  ON sns_campaigns FOR SELECT
  USING (status = 'ACTIVE' OR EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'super_admin'));
