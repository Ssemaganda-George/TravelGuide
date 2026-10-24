-- ============================================================================
-- COMPLETE MIGRATION FOR TRIP INSIGHTS
-- Run this in Supabase SQL Editor to apply all schema changes at once
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. TRAVEL TIME COLUMN (for destination content)
-- ---------------------------------------------------------------------------
ALTER TABLE destination_content
ADD COLUMN IF NOT EXISTS travel_time TEXT;

-- Optional: Set default for existing Sipi Falls record
UPDATE destination_content
SET travel_time = '~5 hrs from Kampala'
WHERE place_id = (SELECT id FROM places WHERE slug = 'sipi-falls');

-- ---------------------------------------------------------------------------
-- 2. STAY TIERS UPDATE (comfort -> luxury)
-- ---------------------------------------------------------------------------
-- No schema change needed, just data normalization in application code
-- The STAY_TIERS constant updated in lib/tiers.ts to: [["budget", "Budget"], ["mid", "Mid-range"], ["luxury", "Luxury"]]

-- ---------------------------------------------------------------------------
-- 3. PARTNER METRICS & BILLING (major enhancement)
-- ---------------------------------------------------------------------------

-- Add billing & tracking columns to partners table
ALTER TABLE partners
ADD COLUMN IF NOT EXISTS page_views BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS inquiry_clicks BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'expired', 'cancelled')),
ADD COLUMN IF NOT EXISTS subscription_price NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_payment_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE;

-- Create partner_metrics table for detailed daily tracking with country breakdown
CREATE TABLE IF NOT EXISTS partner_metrics (
  id BIGSERIAL PRIMARY KEY,
  partner_id UUID REFERENCES partners(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  page_views BIGINT DEFAULT 0,
  inquiry_clicks BIGINT DEFAULT 0,
  whatsapp_clicks BIGINT DEFAULT 0,
  email_clicks BIGINT DEFAULT 0,
  country TEXT,  -- ISO country code (e.g., 'UG', 'US', 'GB')
  UNIQUE(partner_id, date, country)
);

-- Enable RLS
ALTER TABLE partner_metrics ENABLE ROW LEVEL SECURITY;

-- Policy: admins can view all metrics
DROP POLICY IF EXISTS "admins_view_all_metrics" ON partner_metrics;
CREATE POLICY "admins_view_all_metrics" ON partner_metrics
  FOR SELECT USING (is_admin());

-- Note: No partner-specific policy since partners table doesn't have user_id column
-- Partners are managed by admins via the admin dashboard

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_partner_metrics_partner_date ON partner_metrics(partner_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_partner_metrics_date ON partner_metrics(date DESC);
CREATE INDEX IF NOT EXISTS idx_partner_metrics_country ON partner_metrics(country);
CREATE INDEX IF NOT EXISTS idx_partners_subscription ON partners(subscription_status, trial_ends_at);

-- ---------------------------------------------------------------------------
-- 4. RPC FUNCTION FOR INCREMENTING METRICS
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION increment_partner_metric(p_partner_id UUID, p_metric TEXT, p_country TEXT DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO partner_metrics (partner_id, date, page_views, inquiry_clicks, whatsapp_clicks, email_clicks, country)
  VALUES (p_partner_id, CURRENT_DATE, 0, 0, 0, 0, COALESCE(p_country, 'unknown'))
  ON CONFLICT (partner_id, date, country) DO UPDATE SET
    page_views = partner_metrics.page_views + CASE WHEN p_metric = 'page_views' THEN 1 ELSE 0 END,
    inquiry_clicks = partner_metrics.inquiry_clicks + CASE WHEN p_metric = 'inquiry_clicks' THEN 1 ELSE 0 END,
    whatsapp_clicks = partner_metrics.whatsapp_clicks + CASE WHEN p_metric = 'whatsapp_clicks' THEN 1 ELSE 0 END,
    email_clicks = partner_metrics.email_clicks + CASE WHEN p_metric = 'email_clicks' THEN 1 ELSE 0 END;
END;
$$;

GRANT EXECUTE ON FUNCTION increment_partner_metric(UUID, TEXT, TEXT) TO authenticated;

-- ---------------------------------------------------------------------------
-- 5. HELPER VIEW FOR DAILY AGGREGATES (optional, for easier querying)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW partner_daily_summary AS
SELECT 
  pm.partner_id,
  p.name as partner_name,
  p.type as partner_type,
  pm.date,
  SUM(pm.page_views) as page_views,
  SUM(pm.inquiry_clicks) as inquiry_clicks,
  SUM(pm.whatsapp_clicks) as whatsapp_clicks,
  SUM(pm.email_clicks) as email_clicks,
  COUNT(DISTINCT pm.country) as countries_count
FROM partner_metrics pm
JOIN partners p ON p.id = pm.partner_id
GROUP BY pm.partner_id, p.name, p.type, pm.date;

-- ---------------------------------------------------------------------------
-- 6. HELPER VIEW FOR COUNTRY BREAKDOWN
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW partner_country_breakdown AS
SELECT 
  pm.partner_id,
  p.name as partner_name,
  pm.country,
  SUM(pm.page_views) as total_page_views,
  SUM(pm.inquiry_clicks) as total_inquiries,
  SUM(pm.whatsapp_clicks) as total_whatsapp,
  SUM(pm.email_clicks) as total_emails,
  COUNT(DISTINCT pm.date) as active_days
FROM partner_metrics pm
JOIN partners p ON p.id = pm.partner_id
GROUP BY pm.partner_id, p.name, pm.country;

-- ---------------------------------------------------------------------------
-- 7. ADD created_at COLUMN TO PARTNERS AND SET DEFAULT trial_ends_at
-- ---------------------------------------------------------------------------
ALTER TABLE partners
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Update existing partners to have trial_ends_at (30 days from created_at if not set)
UPDATE partners
SET trial_ends_at = created_at + INTERVAL '30 days'
WHERE trial_ends_at IS NULL AND created_at IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 8. SAMPLE DATA for testing (optional, remove in production)
-- ---------------------------------------------------------------------------
-- INSERT INTO partner_metrics (partner_id, date, page_views, inquiry_clicks, whatsapp_clicks, email_clicks, country)
-- SELECT id, CURRENT_DATE - (n || ' days')::INTERVAL, 
--   (random() * 100)::INT, (random() * 20)::INT, (random() * 15)::INT, (random() * 10)::INT,
--   (ARRAY['UG','US','GB','KE','TZ','RW','ZA','DE','FR','CA'])[1 + (random() * 9)::INT]
-- FROM partners, generate_series(0, 30) n;

