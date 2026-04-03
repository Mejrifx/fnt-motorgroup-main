-- =============================================
-- Add email_sent column to leads table
-- =============================================

ALTER TABLE leads ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT false;

-- Add comment
COMMENT ON COLUMN leads.email_sent IS 'Whether an email was sent to this lead';
