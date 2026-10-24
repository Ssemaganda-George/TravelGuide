-- RPC function to increment partner metrics
CREATE OR REPLACE FUNCTION increment_partner_metric(p_partner_id UUID, p_metric TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO partner_metrics (partner_id, date, page_views, inquiry_clicks, whatsapp_clicks, email_clicks)
  VALUES (p_partner_id, CURRENT_DATE, 0, 0, 0, 0)
  ON CONFLICT (partner_id, date) DO UPDATE SET
    page_views = partner_metrics.page_views + CASE WHEN p_metric = 'page_views' THEN 1 ELSE 0 END,
    inquiry_clicks = partner_metrics.inquiry_clicks + CASE WHEN p_metric = 'inquiry_clicks' THEN 1 ELSE 0 END,
    whatsapp_clicks = partner_metrics.whatsapp_clicks + CASE WHEN p_metric = 'whatsapp_clicks' THEN 1 ELSE 0 END,
    email_clicks = partner_metrics.email_clicks + CASE WHEN p_metric = 'email_clicks' THEN 1 ELSE 0 END;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION increment_partner_metric(UUID, TEXT) TO authenticated;

-- Also update the partners table aggregated counts periodically (could be a cron job)
-- For now, we'll just use the daily metrics table

