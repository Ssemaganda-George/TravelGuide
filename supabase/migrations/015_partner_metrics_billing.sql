-- Partner metrics and billing enhancements
ALTER TABLE partners
ADD COLUMN IF NOT EXISTS page_views BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS inquiry_clicks BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trial', -- 'trial', 'active', 'expired', 'cancelled'
ADD COLUMN IF NOT EXISTS subscription_price NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_payment_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE;

-- Create partner_metrics table for detailed tracking
CREATE TABLE IF NOT EXISTS partner_metrics (
  id BIGSERIAL PRIMARY KEY,
  partner_id UUID REFERENCES partners(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  page_views BIGINT DEFAULT 0,
  inquiry_clicks BIGINT DEFAULT 0,
  whatsapp_clicks BIGINT DEFAULT 0,
  email_clicks BIGINT DEFAULT 0,
  UNIQUE(partner_id, date)
);

-- Enable RLS
ALTER TABLE partner_metrics ENABLE ROW LEVEL SECURITY;

-- Policy: admins can view all metrics
CREATE POLICY "admins_view_all_metrics" ON partner_metrics
  FOR SELECT USING (is_admin());

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_partner_metrics_partner_date ON partner_metrics(partner_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_partners_subscription ON partners(subscription_status, trial_ends_at);

