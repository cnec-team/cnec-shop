-- =============================================
-- KviewShop Migration 003: Buyer System, Short URLs, Subscriptions & Advanced Features
-- =============================================
-- Features included:
-- 1. Buyer (구매자) role and profiles
-- 2. Short URL system for creator malls
-- 3. Subscription service for malls
-- 4. Community board/chat system
-- 5. Q&A and Review system with reward points
-- 6. Creator level system (Bronze to Diamond)
-- 7. Live shopping integration
-- 8. Live helper auto-chat bot system
-- 9. Buyer to Creator conversion system
-- =============================================

-- =============================================
-- 1. UPDATE USERS TABLE - Add buyer role
-- =============================================

-- Update role constraint to include 'buyer'
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('super_admin', 'brand_admin', 'creator', 'buyer'));


-- =============================================
-- 2. BUYERS TABLE - Buyer profiles
-- =============================================

CREATE TABLE IF NOT EXISTS buyers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  nickname TEXT NOT NULL,
  profile_image TEXT,
  phone TEXT,
  default_shipping_address JSONB,
  -- Reward points system
  points_balance INTEGER DEFAULT 0,
  total_points_earned INTEGER DEFAULT 0,
  total_points_used INTEGER DEFAULT 0,
  -- Stats
  total_orders INTEGER DEFAULT 0,
  total_spent NUMERIC DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  -- Preferences
  preferred_language TEXT DEFAULT 'ko',
  preferred_currency TEXT DEFAULT 'KRW',
  marketing_consent BOOLEAN DEFAULT false,
  -- Buyer to Creator conversion eligibility
  eligible_for_creator BOOLEAN DEFAULT false,
  creator_conversion_date TIMESTAMP WITH TIME ZONE,
  -- Instagram connection for review rewards
  instagram_username TEXT,
  instagram_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_buyers_user_id ON buyers(user_id);
CREATE INDEX IF NOT EXISTS idx_buyers_points_balance ON buyers(points_balance);
CREATE INDEX IF NOT EXISTS idx_buyers_eligible_for_creator ON buyers(eligible_for_creator);

CREATE TRIGGER update_buyers_updated_at
  BEFORE UPDATE ON buyers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- =============================================
-- 3. SHORT URLS TABLE - Creator mall short URLs
-- =============================================

CREATE TABLE IF NOT EXISTS short_urls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID REFERENCES creators(id) ON DELETE CASCADE,
  short_code TEXT UNIQUE NOT NULL,  -- e.g., 'sakura', 'beauty123'
  custom_domain TEXT,                -- Optional custom domain
  is_primary BOOLEAN DEFAULT false,  -- Primary URL for the shop
  -- Analytics
  total_clicks INTEGER DEFAULT 0,
  last_clicked_at TIMESTAMP WITH TIME ZONE,
  -- Settings
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  -- Source tracking (where the link is shared)
  source_tag TEXT,  -- 'instagram', 'youtube', 'tiktok', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Short code must be URL-safe: lowercase letters, numbers, underscores (3-20 chars)
ALTER TABLE short_urls DROP CONSTRAINT IF EXISTS short_urls_code_format;
ALTER TABLE short_urls ADD CONSTRAINT short_urls_code_format
  CHECK (short_code ~ '^[a-z0-9_]{3,20}$');

CREATE UNIQUE INDEX IF NOT EXISTS idx_short_urls_code ON short_urls(short_code);
CREATE INDEX IF NOT EXISTS idx_short_urls_creator ON short_urls(creator_id);

CREATE TRIGGER update_short_urls_updated_at
  BEFORE UPDATE ON short_urls
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Short URL analytics (click tracking)
CREATE TABLE IF NOT EXISTS short_url_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  short_url_id UUID REFERENCES short_urls(id) ON DELETE CASCADE,
  clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  referrer TEXT,
  user_agent TEXT,
  ip_country TEXT,
  device_type TEXT  -- 'mobile', 'desktop', 'tablet'
);

CREATE INDEX IF NOT EXISTS idx_short_url_analytics_url ON short_url_analytics(short_url_id);
CREATE INDEX IF NOT EXISTS idx_short_url_analytics_date ON short_url_analytics(clicked_at);


-- =============================================
-- 4. SUBSCRIPTIONS TABLE - Mall subscription service
-- =============================================

CREATE TABLE IF NOT EXISTS mall_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id UUID REFERENCES buyers(id) ON DELETE CASCADE,
  creator_id UUID REFERENCES creators(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')),
  -- Notification preferences
  notify_new_products BOOLEAN DEFAULT true,
  notify_sales BOOLEAN DEFAULT true,
  notify_live_streams BOOLEAN DEFAULT true,
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(buyer_id, creator_id)
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_buyer ON mall_subscriptions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_creator ON mall_subscriptions(creator_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON mall_subscriptions(status);


-- =============================================
-- 5. COMMUNITY BOARD SYSTEM
-- =============================================

-- Creator mall community settings
ALTER TABLE creators ADD COLUMN IF NOT EXISTS community_enabled BOOLEAN DEFAULT false;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS community_type TEXT DEFAULT 'board';

-- Community posts (게시판)
CREATE TABLE IF NOT EXISTS community_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID REFERENCES creators(id) ON DELETE CASCADE,  -- Which mall
  buyer_id UUID REFERENCES buyers(id) ON DELETE SET NULL,     -- Who posted
  title TEXT,
  content TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  -- Engagement
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  -- Moderation
  is_pinned BOOLEAN DEFAULT false,
  is_hidden BOOLEAN DEFAULT false,
  hidden_reason TEXT,
  -- Type
  post_type TEXT DEFAULT 'general' CHECK (post_type IN ('general', 'review', 'question', 'announcement')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_community_posts_creator ON community_posts(creator_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_buyer ON community_posts(buyer_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_type ON community_posts(post_type);
CREATE INDEX IF NOT EXISTS idx_community_posts_created ON community_posts(created_at DESC);

CREATE TRIGGER update_community_posts_updated_at
  BEFORE UPDATE ON community_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Community comments
CREATE TABLE IF NOT EXISTS community_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES buyers(id) ON DELETE SET NULL,
  parent_comment_id UUID REFERENCES community_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  is_hidden BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_community_comments_post ON community_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_buyer ON community_comments(buyer_id);

CREATE TRIGGER update_community_comments_updated_at
  BEFORE UPDATE ON community_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Post likes
CREATE TABLE IF NOT EXISTS community_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES buyers(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, buyer_id)
);


-- =============================================
-- 6. PRODUCT Q&A SYSTEM
-- =============================================

CREATE TABLE IF NOT EXISTS product_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES buyers(id) ON DELETE SET NULL,
  question TEXT NOT NULL,
  -- Answer (by brand admin or creator)
  answer TEXT,
  answered_by UUID REFERENCES users(id),
  answered_at TIMESTAMP WITH TIME ZONE,
  -- Status
  is_public BOOLEAN DEFAULT true,
  is_answered BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_questions_product ON product_questions(product_id);
CREATE INDEX IF NOT EXISTS idx_product_questions_buyer ON product_questions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_product_questions_answered ON product_questions(is_answered);

CREATE TRIGGER update_product_questions_updated_at
  BEFORE UPDATE ON product_questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- =============================================
-- 7. PRODUCT REVIEWS WITH REWARD POINTS
-- =============================================

CREATE TABLE IF NOT EXISTS product_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES buyers(id) ON DELETE SET NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,  -- Verified purchase
  -- Review content
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  content TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  -- Instagram integration
  instagram_post_url TEXT,
  instagram_verified BOOLEAN DEFAULT false,
  -- Reward points
  points_awarded INTEGER DEFAULT 0,  -- 500 for text, 1000 for instagram
  points_awarded_at TIMESTAMP WITH TIME ZONE,
  -- Stats
  helpful_count INTEGER DEFAULT 0,
  -- Moderation
  is_verified_purchase BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_reviews_product ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_buyer ON product_reviews(buyer_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_rating ON product_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_product_reviews_featured ON product_reviews(is_featured);

CREATE TRIGGER update_product_reviews_updated_at
  BEFORE UPDATE ON product_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Review helpful votes
CREATE TABLE IF NOT EXISTS review_helpful_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID REFERENCES product_reviews(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES buyers(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(review_id, buyer_id)
);


-- =============================================
-- 8. REWARD POINTS HISTORY
-- =============================================

CREATE TABLE IF NOT EXISTS points_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id UUID REFERENCES buyers(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,  -- Positive for earn, negative for use
  balance_after INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'review_text',           -- 500 points for text review
    'review_instagram',      -- 1000 points for instagram review
    'purchase',              -- Points from purchase
    'referral',              -- Referral bonus
    'event',                 -- Event/promotion bonus
    'expiry',                -- Points expired
    'use_order',             -- Used for order discount
    'admin_adjustment'       -- Manual adjustment by admin
  )),
  reference_id UUID,         -- ID of related record (review_id, order_id, etc.)
  description TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_points_history_buyer ON points_history(buyer_id);
CREATE INDEX IF NOT EXISTS idx_points_history_type ON points_history(type);
CREATE INDEX IF NOT EXISTS idx_points_history_created ON points_history(created_at DESC);


-- =============================================
-- 9. CREATOR LEVEL SYSTEM (Bronze to Diamond)
-- =============================================

-- Add level columns to creators table
ALTER TABLE creators ADD COLUMN IF NOT EXISTS level TEXT DEFAULT 'bronze';
ALTER TABLE creators ADD COLUMN IF NOT EXISTS level_points INTEGER DEFAULT 0;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS level_updated_at TIMESTAMP WITH TIME ZONE;

-- Level thresholds and benefits
CREATE TABLE IF NOT EXISTS creator_levels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  level_name TEXT UNIQUE NOT NULL,
  min_points INTEGER NOT NULL,
  commission_bonus NUMERIC DEFAULT 0,  -- Additional commission %
  badge_color TEXT,
  badge_icon TEXT,
  benefits JSONB DEFAULT '[]',  -- Array of benefit descriptions
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default level definitions
INSERT INTO creator_levels (level_name, min_points, commission_bonus, badge_color, badge_icon, benefits) VALUES
  ('bronze', 0, 0, '#CD7F32', 'medal', '["기본 커미션율", "월간 리포트"]'),
  ('silver', 1000, 1, '#C0C0C0', 'award', '["커미션 +1%", "우선 샘플 배송", "월간 리포트"]'),
  ('gold', 5000, 2, '#FFD700', 'crown', '["커미션 +2%", "전용 담당자 배정", "프로모션 우선 참여"]'),
  ('platinum', 15000, 3, '#E5E4E2', 'gem', '["커미션 +3%", "독점 상품 액세스", "마케팅 지원"]'),
  ('diamond', 50000, 5, '#B9F2FF', 'diamond', '["커미션 +5%", "브랜드 콜라보 기회", "VIP 이벤트 초대", "전용 마케팅 예산"]')
ON CONFLICT (level_name) DO NOTHING;

-- Creator level history (tracking level changes)
CREATE TABLE IF NOT EXISTS creator_level_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID REFERENCES creators(id) ON DELETE CASCADE,
  from_level TEXT,
  to_level TEXT NOT NULL,
  points_at_change INTEGER NOT NULL,
  reason TEXT,  -- 'monthly_sales', 'special_promotion', 'admin_adjustment'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_creator_level_history_creator ON creator_level_history(creator_id);


-- =============================================
-- 10. LIVE SHOPPING INTEGRATION
-- =============================================

CREATE TABLE IF NOT EXISTS live_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID REFERENCES creators(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  -- Platform info
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'youtube', 'tiktok', 'internal')),
  external_url TEXT,  -- URL to the live stream
  stream_key TEXT,    -- For internal streaming
  -- Timing
  scheduled_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'ended', 'cancelled')),
  -- Featured products for this live
  featured_product_ids UUID[] DEFAULT '{}',
  -- Stats
  peak_viewers INTEGER DEFAULT 0,
  total_viewers INTEGER DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  total_revenue NUMERIC DEFAULT 0,
  -- Settings
  chat_enabled BOOLEAN DEFAULT true,
  bot_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_live_sessions_creator ON live_sessions(creator_id);
CREATE INDEX IF NOT EXISTS idx_live_sessions_status ON live_sessions(status);
CREATE INDEX IF NOT EXISTS idx_live_sessions_scheduled ON live_sessions(scheduled_at);

CREATE TRIGGER update_live_sessions_updated_at
  BEFORE UPDATE ON live_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Live session products (quick purchase links)
CREATE TABLE IF NOT EXISTS live_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  live_session_id UUID REFERENCES live_sessions(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  -- Live-only pricing
  live_price_usd NUMERIC,
  live_price_jpy NUMERIC,
  -- Stats
  clicks INTEGER DEFAULT 0,
  orders INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_live_products_session ON live_products(live_session_id);


-- =============================================
-- 11. LIVE HELPER AUTO-CHAT BOT SYSTEM
-- =============================================

CREATE TABLE IF NOT EXISTS live_bot_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID REFERENCES creators(id) ON DELETE CASCADE UNIQUE,
  is_enabled BOOLEAN DEFAULT false,
  -- Bot messages configuration
  welcome_message TEXT DEFAULT '안녕하세요! 오늘 라이브에 오신 것을 환영합니다! 🎉',
  -- Auto product link interval (seconds)
  product_link_interval INTEGER DEFAULT 300,  -- 5 minutes
  -- Scheduled messages (array of {time_offset: seconds, message: string})
  scheduled_messages JSONB DEFAULT '[]',
  -- Auto responses (keyword triggers)
  auto_responses JSONB DEFAULT '{}',  -- {"가격": "상품 가격은 화면에서 확인해주세요!", "배송": "배송은 2-3일 소요됩니다"}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER update_live_bot_settings_updated_at
  BEFORE UPDATE ON live_bot_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Live chat messages (including bot messages)
CREATE TABLE IF NOT EXISTS live_chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  live_session_id UUID REFERENCES live_sessions(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES buyers(id) ON DELETE SET NULL,
  is_bot_message BOOLEAN DEFAULT false,
  message TEXT NOT NULL,
  -- Product link attached to message
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_link TEXT,
  -- Metadata
  is_pinned BOOLEAN DEFAULT false,
  is_hidden BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_live_chat_session ON live_chat_messages(live_session_id);
CREATE INDEX IF NOT EXISTS idx_live_chat_created ON live_chat_messages(created_at);


-- =============================================
-- 12. BUYER TO CREATOR CONVERSION SYSTEM
-- =============================================

CREATE TABLE IF NOT EXISTS creator_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id UUID REFERENCES buyers(id) ON DELETE CASCADE,
  -- Application info
  desired_username TEXT NOT NULL,
  display_name TEXT NOT NULL,
  bio TEXT,
  instagram_url TEXT,
  youtube_url TEXT,
  tiktok_url TEXT,
  follower_count INTEGER,
  -- Motivation
  motivation TEXT,
  content_plan TEXT,
  -- Review
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  -- Converted creator
  created_creator_id UUID REFERENCES creators(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_creator_applications_buyer ON creator_applications(buyer_id);
CREATE INDEX IF NOT EXISTS idx_creator_applications_status ON creator_applications(status);

CREATE TRIGGER update_creator_applications_updated_at
  BEFORE UPDATE ON creator_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-eligibility criteria settings
CREATE TABLE IF NOT EXISTS conversion_criteria (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  min_orders INTEGER DEFAULT 5,
  min_reviews INTEGER DEFAULT 3,
  min_spent NUMERIC DEFAULT 100,  -- USD
  min_account_age_days INTEGER DEFAULT 30,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default criteria
INSERT INTO conversion_criteria (min_orders, min_reviews, min_spent, min_account_age_days)
VALUES (5, 3, 100, 30)
ON CONFLICT DO NOTHING;


-- =============================================
-- 13. CREATOR SHOP SETTINGS (Enhanced)
-- =============================================

-- Additional shop customization columns
ALTER TABLE creators ADD COLUMN IF NOT EXISTS shop_settings JSONB DEFAULT '{
  "show_footer": true,
  "footer_type": "full",
  "show_social_links": true,
  "show_subscriber_count": false,
  "layout": "grid",
  "products_per_row": 3,
  "show_prices": true,
  "currency_display": "local",
  "announcement": "",
  "announcement_active": false
}'::jsonb;

-- Background settings
ALTER TABLE creators ADD COLUMN IF NOT EXISTS background_color TEXT DEFAULT '#1a1a1a';
ALTER TABLE creators ADD COLUMN IF NOT EXISTS background_image TEXT;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS text_color TEXT DEFAULT '#ffffff';


-- =============================================
-- 14. LEGAL FOOTER CONTENT (Multi-language)
-- =============================================

CREATE TABLE IF NOT EXISTS legal_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_type TEXT NOT NULL CHECK (content_type IN (
    'terms_of_service',
    'privacy_policy',
    'refund_policy',
    'shipping_policy',
    'business_info',
    'contact_info'
  )),
  country TEXT NOT NULL,  -- 'KR', 'US', 'JP', 'GLOBAL'
  language TEXT NOT NULL, -- 'ko', 'en', 'ja'
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,
  effective_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(content_type, country, language)
);

CREATE INDEX IF NOT EXISTS idx_legal_content_type ON legal_content(content_type);
CREATE INDEX IF NOT EXISTS idx_legal_content_country ON legal_content(country);

CREATE TRIGGER update_legal_content_updated_at
  BEFORE UPDATE ON legal_content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default legal content placeholders
INSERT INTO legal_content (content_type, country, language, title, content) VALUES
-- Korean
('terms_of_service', 'KR', 'ko', '이용약관', '서비스 이용약관 내용...'),
('privacy_policy', 'KR', 'ko', '개인정보처리방침', '개인정보 처리방침 내용...'),
('refund_policy', 'KR', 'ko', '환불정책', '상품 수령 후 7일 이내 환불 가능...'),
('business_info', 'KR', 'ko', '사업자정보', '상호: (주)케이뷰샵 | 대표: | 사업자등록번호: | 통신판매업신고: | 주소: | 고객센터:'),
-- US
('terms_of_service', 'US', 'en', 'Terms of Service', 'Terms of Service content...'),
('privacy_policy', 'US', 'en', 'Privacy Policy', 'Privacy Policy content...'),
('refund_policy', 'US', 'en', 'Refund Policy', 'Full refund within 30 days of purchase...'),
('business_info', 'US', 'en', 'Business Information', 'Company: KviewShop Inc. | Address: | Contact:'),
-- Japan
('terms_of_service', 'JP', 'ja', '利用規約', '利用規約の内容...'),
('privacy_policy', 'JP', 'ja', 'プライバシーポリシー', 'プライバシーポリシーの内容...'),
('refund_policy', 'JP', 'ja', '返品・返金ポリシー', '商品到着後7日以内の返品可能...'),
('business_info', 'JP', 'ja', '事業者情報', '会社名: KviewShop Japan | 代表: | 所在地: | 特定商取引法に基づく表記')
ON CONFLICT (content_type, country, language) DO NOTHING;


-- =============================================
-- 15. UPDATE ORDERS TABLE - Add buyer reference
-- =============================================

ALTER TABLE orders ADD COLUMN IF NOT EXISTS buyer_id UUID REFERENCES buyers(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON orders(buyer_id);


-- =============================================
-- 16. WISHLIST / CART PERSISTENCE
-- =============================================

CREATE TABLE IF NOT EXISTS buyer_wishlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id UUID REFERENCES buyers(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  creator_id UUID REFERENCES creators(id) ON DELETE CASCADE,  -- Which mall
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(buyer_id, product_id, creator_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlist_buyer ON buyer_wishlist(buyer_id);

CREATE TABLE IF NOT EXISTS buyer_cart (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id UUID REFERENCES buyers(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  creator_id UUID REFERENCES creators(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(buyer_id, product_id, creator_id)
);

CREATE INDEX IF NOT EXISTS idx_cart_buyer ON buyer_cart(buyer_id);

CREATE TRIGGER update_buyer_cart_updated_at
  BEFORE UPDATE ON buyer_cart
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- =============================================
-- 17. ROW LEVEL SECURITY POLICIES
-- =============================================

-- Enable RLS on new tables
ALTER TABLE buyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE short_urls ENABLE ROW LEVEL SECURITY;
ALTER TABLE short_url_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE mall_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_helpful_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_level_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_bot_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversion_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyer_wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyer_cart ENABLE ROW LEVEL SECURITY;

-- Buyers policies
CREATE POLICY "Buyers can view own profile" ON buyers FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Buyers can update own profile" ON buyers FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Anyone can insert buyers" ON buyers FOR INSERT WITH CHECK (true);

-- Short URLs policies
CREATE POLICY "Anyone can view active short urls" ON short_urls FOR SELECT USING (is_active = true);
CREATE POLICY "Creators can manage own short urls" ON short_urls FOR ALL USING (
  creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid())
);

-- Subscriptions policies
CREATE POLICY "Buyers can manage own subscriptions" ON mall_subscriptions FOR ALL USING (
  buyer_id IN (SELECT id FROM buyers WHERE user_id = auth.uid())
);
CREATE POLICY "Creators can view own subscribers" ON mall_subscriptions FOR SELECT USING (
  creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid())
);

-- Community posts policies
CREATE POLICY "Anyone can view public posts" ON community_posts FOR SELECT USING (is_hidden = false);
CREATE POLICY "Buyers can create posts" ON community_posts FOR INSERT WITH CHECK (
  buyer_id IN (SELECT id FROM buyers WHERE user_id = auth.uid())
);
CREATE POLICY "Buyers can update own posts" ON community_posts FOR UPDATE USING (
  buyer_id IN (SELECT id FROM buyers WHERE user_id = auth.uid())
);
CREATE POLICY "Creators can moderate mall posts" ON community_posts FOR UPDATE USING (
  creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid())
);

-- Reviews policies
CREATE POLICY "Anyone can view approved reviews" ON product_reviews FOR SELECT USING (is_approved = true);
CREATE POLICY "Buyers can create reviews" ON product_reviews FOR INSERT WITH CHECK (
  buyer_id IN (SELECT id FROM buyers WHERE user_id = auth.uid())
);
CREATE POLICY "Buyers can update own reviews" ON product_reviews FOR UPDATE USING (
  buyer_id IN (SELECT id FROM buyers WHERE user_id = auth.uid())
);

-- Points history policies
CREATE POLICY "Buyers can view own points history" ON points_history FOR SELECT USING (
  buyer_id IN (SELECT id FROM buyers WHERE user_id = auth.uid())
);

-- Live sessions policies
CREATE POLICY "Anyone can view live sessions" ON live_sessions FOR SELECT USING (true);
CREATE POLICY "Creators can manage own live sessions" ON live_sessions FOR ALL USING (
  creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid())
);

-- Legal content is public
CREATE POLICY "Anyone can view legal content" ON legal_content FOR SELECT USING (is_active = true);

-- Wishlist/Cart policies
CREATE POLICY "Buyers can manage own wishlist" ON buyer_wishlist FOR ALL USING (
  buyer_id IN (SELECT id FROM buyers WHERE user_id = auth.uid())
);
CREATE POLICY "Buyers can manage own cart" ON buyer_cart FOR ALL USING (
  buyer_id IN (SELECT id FROM buyers WHERE user_id = auth.uid())
);

-- Super admin policies (can do everything)
CREATE POLICY "Super admin full access buyers" ON buyers FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
);
CREATE POLICY "Super admin full access short_urls" ON short_urls FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
);
CREATE POLICY "Super admin full access subscriptions" ON mall_subscriptions FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
);
CREATE POLICY "Super admin full access reviews" ON product_reviews FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
);
CREATE POLICY "Super admin full access legal" ON legal_content FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
);


-- =============================================
-- 18. FUNCTIONS & TRIGGERS
-- =============================================

-- Function to update buyer eligibility for creator conversion
CREATE OR REPLACE FUNCTION check_buyer_creator_eligibility()
RETURNS TRIGGER AS $$
DECLARE
  criteria RECORD;
  buyer_data RECORD;
BEGIN
  -- Get active criteria
  SELECT * INTO criteria FROM conversion_criteria WHERE is_active = true LIMIT 1;

  -- Get buyer stats
  SELECT
    total_orders,
    total_reviews,
    total_spent,
    EXTRACT(DAY FROM NOW() - created_at) as account_age_days
  INTO buyer_data
  FROM buyers WHERE id = NEW.buyer_id;

  -- Check if buyer meets criteria
  IF buyer_data.total_orders >= criteria.min_orders
     AND buyer_data.total_reviews >= criteria.min_reviews
     AND buyer_data.total_spent >= criteria.min_spent
     AND buyer_data.account_age_days >= criteria.min_account_age_days THEN
    UPDATE buyers SET eligible_for_creator = true WHERE id = NEW.buyer_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger after order completion to check eligibility
CREATE OR REPLACE TRIGGER check_eligibility_after_order
AFTER UPDATE ON orders
FOR EACH ROW
WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
EXECUTE FUNCTION check_buyer_creator_eligibility();

-- Function to award review points
CREATE OR REPLACE FUNCTION award_review_points()
RETURNS TRIGGER AS $$
DECLARE
  points_amount INTEGER;
  current_balance INTEGER;
BEGIN
  -- Determine points based on review type
  IF NEW.instagram_post_url IS NOT NULL AND NEW.instagram_verified = true THEN
    points_amount := 1000;  -- Instagram review
  ELSE
    points_amount := 500;   -- Text review
  END IF;

  -- Get current balance
  SELECT points_balance INTO current_balance FROM buyers WHERE id = NEW.buyer_id;

  -- Update buyer points
  UPDATE buyers
  SET
    points_balance = points_balance + points_amount,
    total_points_earned = total_points_earned + points_amount,
    total_reviews = total_reviews + 1
  WHERE id = NEW.buyer_id;

  -- Record points history
  INSERT INTO points_history (buyer_id, amount, balance_after, type, reference_id, description)
  VALUES (
    NEW.buyer_id,
    points_amount,
    current_balance + points_amount,
    CASE WHEN NEW.instagram_post_url IS NOT NULL THEN 'review_instagram' ELSE 'review_text' END,
    NEW.id,
    CASE WHEN NEW.instagram_post_url IS NOT NULL
      THEN '인스타그램 리뷰 적립금'
      ELSE '텍스트 리뷰 적립금'
    END
  );

  -- Update review record
  NEW.points_awarded := points_amount;
  NEW.points_awarded_at := NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER award_points_on_review
BEFORE INSERT ON product_reviews
FOR EACH ROW
WHEN (NEW.is_approved = true)
EXECUTE FUNCTION award_review_points();

-- Function to update creator level based on points
CREATE OR REPLACE FUNCTION update_creator_level()
RETURNS TRIGGER AS $$
DECLARE
  new_level TEXT;
BEGIN
  -- Determine new level based on points
  SELECT level_name INTO new_level
  FROM creator_levels
  WHERE min_points <= NEW.level_points
  ORDER BY min_points DESC
  LIMIT 1;

  -- If level changed, record history
  IF new_level != OLD.level THEN
    INSERT INTO creator_level_history (creator_id, from_level, to_level, points_at_change, reason)
    VALUES (NEW.id, OLD.level, new_level, NEW.level_points, 'points_threshold');

    NEW.level := new_level;
    NEW.level_updated_at := NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_level_on_points_change
BEFORE UPDATE OF level_points ON creators
FOR EACH ROW
EXECUTE FUNCTION update_creator_level();

-- Function to increment short URL clicks
CREATE OR REPLACE FUNCTION increment_short_url_clicks()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE short_urls
  SET
    total_clicks = total_clicks + 1,
    last_clicked_at = NOW()
  WHERE id = NEW.short_url_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_clicks_on_analytics
AFTER INSERT ON short_url_analytics
FOR EACH ROW
EXECUTE FUNCTION increment_short_url_clicks();


-- =============================================
-- 19. SAMPLE DATA FOR TESTING
-- =============================================

-- Create a sample short URL for existing creator
DO $$
DECLARE
  creator_uuid UUID;
BEGIN
  SELECT id INTO creator_uuid FROM creators WHERE username = 'sakura_beauty' LIMIT 1;
  IF creator_uuid IS NOT NULL THEN
    INSERT INTO short_urls (creator_id, short_code, is_primary, source_tag)
    VALUES (creator_uuid, 'sakura', true, 'general')
    ON CONFLICT (short_code) DO NOTHING;

    INSERT INTO short_urls (creator_id, short_code, is_primary, source_tag)
    VALUES (creator_uuid, 'sakura_ig', false, 'instagram')
    ON CONFLICT (short_code) DO NOTHING;

    INSERT INTO short_urls (creator_id, short_code, is_primary, source_tag)
    VALUES (creator_uuid, 'sakura_yt', false, 'youtube')
    ON CONFLICT (short_code) DO NOTHING;
  END IF;
END $$;


-- =============================================
-- MIGRATION COMPLETE!
-- =============================================
-- Run this SQL in Supabase Dashboard > SQL Editor
-- After running, verify tables exist with: SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
