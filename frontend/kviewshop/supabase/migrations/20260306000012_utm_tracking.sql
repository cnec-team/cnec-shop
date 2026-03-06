-- Add UTM attribution data to shop_visits
ALTER TABLE shop_visits ADD COLUMN IF NOT EXISTS attribution_data JSONB DEFAULT '{}';
