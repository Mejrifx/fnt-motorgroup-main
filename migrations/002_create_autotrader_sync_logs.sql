-- =============================================
-- Migration 002: Create AutoTrader Sync Logs Table
-- =============================================
-- Purpose: Track all AutoTrader sync attempts for monitoring and debugging
-- Author: FNT Motor Group
-- Date: 2026-01-28

-- Create autotrader_sync_logs table
CREATE TABLE IF NOT EXISTS autotrader_sync_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sync_type VARCHAR(20) NOT NULL CHECK (sync_type IN ('full_sync', 'webhook', 'manual')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'partial', 'failed')),
    cars_added INTEGER DEFAULT 0 CHECK (cars_added >= 0),
    cars_updated INTEGER DEFAULT 0 CHECK (cars_updated >= 0),
    cars_marked_unavailable INTEGER DEFAULT 0 CHECK (cars_marked_unavailable >= 0),
    error_message TEXT,
    sync_duration_ms INTEGER CHECK (sync_duration_ms >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sync_logs_created_at ON autotrader_sync_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_logs_status ON autotrader_sync_logs(status);
CREATE INDEX IF NOT EXISTS idx_sync_logs_sync_type ON autotrader_sync_logs(sync_type);

-- Enable Row Level Security
ALTER TABLE autotrader_sync_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Only authenticated users (admins) can view sync logs
CREATE POLICY "Authenticated users can view sync logs" ON autotrader_sync_logs
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policy: Only authenticated users (admins) can insert sync logs
CREATE POLICY "Authenticated users can insert sync logs" ON autotrader_sync_logs
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Add table comment
COMMENT ON TABLE autotrader_sync_logs IS 'Logs all AutoTrader synchronization attempts';
COMMENT ON COLUMN autotrader_sync_logs.sync_type IS 'Type of sync: full_sync, webhook, or manual';
COMMENT ON COLUMN autotrader_sync_logs.status IS 'Sync result: success, partial, or failed';
COMMENT ON COLUMN autotrader_sync_logs.cars_added IS 'Number of cars added in this sync';
COMMENT ON COLUMN autotrader_sync_logs.cars_updated IS 'Number of cars updated in this sync';
COMMENT ON COLUMN autotrader_sync_logs.cars_marked_unavailable IS 'Number of cars marked unavailable';
COMMENT ON COLUMN autotrader_sync_logs.error_message IS 'Error details if sync failed';
COMMENT ON COLUMN autotrader_sync_logs.sync_duration_ms IS 'How long the sync took in milliseconds';

-- Create function to automatically clean up old logs (keep last 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_sync_logs()
RETURNS void AS $$
BEGIN
    DELETE FROM autotrader_sync_logs
    WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Verification query
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'autotrader_sync_logs'
ORDER BY ordinal_position;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Migration 002 completed successfully: autotrader_sync_logs table created';
END $$;
