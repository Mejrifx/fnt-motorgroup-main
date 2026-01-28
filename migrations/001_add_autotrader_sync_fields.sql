-- =============================================
-- Migration 001: Add AutoTrader Sync Tracking Fields
-- =============================================
-- Purpose: Add columns to cars table to track AutoTrader synchronization
-- Author: FNT Motor Group
-- Date: 2026-01-28

-- Add AutoTrader sync tracking columns to cars table
ALTER TABLE cars 
ADD COLUMN IF NOT EXISTS autotrader_id TEXT,
ADD COLUMN IF NOT EXISTS autotrader_advertiser_id TEXT,
ADD COLUMN IF NOT EXISTS synced_from_autotrader BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sync_override BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS autotrader_data JSONB;

-- Create index on autotrader_id for fast lookups during sync
CREATE INDEX IF NOT EXISTS idx_cars_autotrader_id ON cars(autotrader_id);

-- Create index on synced_from_autotrader for filtering
CREATE INDEX IF NOT EXISTS idx_cars_synced_from_autotrader ON cars(synced_from_autotrader);

-- Create index on sync_override for sync logic
CREATE INDEX IF NOT EXISTS idx_cars_sync_override ON cars(sync_override);

-- Add comment to explain the fields
COMMENT ON COLUMN cars.autotrader_id IS 'AutoTrader unique listing ID';
COMMENT ON COLUMN cars.autotrader_advertiser_id IS 'AutoTrader advertiser ID (10042804)';
COMMENT ON COLUMN cars.synced_from_autotrader IS 'True if this car was imported from AutoTrader';
COMMENT ON COLUMN cars.sync_override IS 'True if admin manually edited, stops auto-sync';
COMMENT ON COLUMN cars.last_synced_at IS 'Timestamp of last successful sync from AutoTrader';
COMMENT ON COLUMN cars.autotrader_data IS 'Raw AutoTrader API response for debugging';

-- Verification query
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'cars' 
AND column_name IN ('autotrader_id', 'autotrader_advertiser_id', 'synced_from_autotrader', 'sync_override', 'last_synced_at', 'autotrader_data')
ORDER BY column_name;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Migration 001 completed successfully: AutoTrader sync tracking fields added to cars table';
END $$;
