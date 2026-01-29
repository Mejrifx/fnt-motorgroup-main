-- =============================================
-- Migration 004: Fix AutoTrader Sync Logs RLS Policies
-- =============================================
-- Purpose: Fix Row Level Security policies to allow authenticated users to read sync logs
-- Author: FNT Motor Group
-- Date: 2026-01-29
-- Issue: 406 errors when admin dashboard tries to fetch sync logs

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can view sync logs" ON autotrader_sync_logs;
DROP POLICY IF EXISTS "Authenticated users can insert sync logs" ON autotrader_sync_logs;

-- Recreate policies with correct permissions
-- Allow authenticated users to view sync logs (for admin dashboard)
CREATE POLICY "Authenticated users can view sync logs" ON autotrader_sync_logs
    FOR SELECT 
    USING (auth.uid() IS NOT NULL);

-- Allow service role to insert sync logs (for Netlify Functions)
CREATE POLICY "Service role can insert sync logs" ON autotrader_sync_logs
    FOR INSERT 
    WITH CHECK (true);

-- Allow service role to update sync logs (for Netlify Functions)
CREATE POLICY "Service role can update sync logs" ON autotrader_sync_logs
    FOR UPDATE 
    USING (true);

-- Add comment explaining the policies
COMMENT ON POLICY "Authenticated users can view sync logs" ON autotrader_sync_logs IS 
    'Allows authenticated admin users to view sync history in dashboard';

COMMENT ON POLICY "Service role can insert sync logs" ON autotrader_sync_logs IS 
    'Allows Netlify Functions to log sync results using service role key';

-- Verification query
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'autotrader_sync_logs'
ORDER BY policyname;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Migration 004 completed successfully: autotrader_sync_logs RLS policies fixed';
END $$;
