-- =============================================
-- Add notes_history column to leads table
-- =============================================

ALTER TABLE leads ADD COLUMN IF NOT EXISTS notes_history JSONB DEFAULT '[]'::jsonb;

-- Add comment
COMMENT ON COLUMN leads.notes_history IS 'Journal-style timestamped notes history for tracking lead activity';
