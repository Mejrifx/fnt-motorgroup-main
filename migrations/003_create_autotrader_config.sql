-- =============================================
-- Migration 003: Create AutoTrader Config Table
-- =============================================
-- Purpose: Store AutoTrader API configuration and sync state
-- Author: FNT Motor Group
-- Date: 2026-01-28

-- Create autotrader_config table
CREATE TABLE IF NOT EXISTS autotrader_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    environment VARCHAR(20) NOT NULL CHECK (environment IN ('sandbox', 'production')),
    last_full_sync TIMESTAMP WITH TIME ZONE,
    sync_enabled BOOLEAN DEFAULT true,
    sync_interval_minutes INTEGER DEFAULT 30 CHECK (sync_interval_minutes > 0),
    config_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for quick config lookups
CREATE INDEX IF NOT EXISTS idx_autotrader_config_environment ON autotrader_config(environment);

-- Enable Row Level Security
ALTER TABLE autotrader_config ENABLE ROW LEVEL SECURITY;

-- Policy: Only authenticated users (admins) can manage config
CREATE POLICY "Authenticated users can view config" ON autotrader_config
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update config" ON autotrader_config
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert config" ON autotrader_config
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_autotrader_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_autotrader_config_updated_at 
BEFORE UPDATE ON autotrader_config
    FOR EACH ROW EXECUTE FUNCTION update_autotrader_config_updated_at();

-- Add table and column comments
COMMENT ON TABLE autotrader_config IS 'AutoTrader API configuration and sync settings';
COMMENT ON COLUMN autotrader_config.environment IS 'API environment: sandbox or production';
COMMENT ON COLUMN autotrader_config.last_full_sync IS 'Timestamp of last completed full sync';
COMMENT ON COLUMN autotrader_config.sync_enabled IS 'Master switch to enable/disable auto-sync';
COMMENT ON COLUMN autotrader_config.sync_interval_minutes IS 'How often to run sync (in minutes)';
COMMENT ON COLUMN autotrader_config.config_data IS 'Additional configuration as JSON';

-- Insert initial sandbox configuration
INSERT INTO autotrader_config (environment, sync_enabled, sync_interval_minutes, config_data)
VALUES (
    'sandbox',
    true,
    30,
    jsonb_build_object(
        'advertiser_id', '10042804',
        'webhook_enabled', false,
        'notes', 'Initial sandbox configuration for development and testing'
    )
)
ON CONFLICT DO NOTHING;

-- Verification query
SELECT 
    id,
    environment,
    sync_enabled,
    sync_interval_minutes,
    created_at
FROM autotrader_config;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Migration 003 completed successfully: autotrader_config table created with sandbox configuration';
END $$;
