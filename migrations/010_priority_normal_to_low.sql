-- =============================================
-- Migration 010: Change priority "Normal" to "Low"
-- =============================================
-- Run this in your Supabase SQL Editor

SET search_path TO public;

-- 1. Drop old check constraint first (so we can write 'Low')
ALTER TABLE public.stock_inventory
  DROP CONSTRAINT IF EXISTS stock_inventory_priority_check;

-- 2. Update all existing rows from Normal → Low
UPDATE public.stock_inventory
SET priority = 'Low'
WHERE priority = 'Normal';

-- 3. Add new check constraint and default
ALTER TABLE public.stock_inventory
  ADD CONSTRAINT stock_inventory_priority_check
  CHECK (priority IN ('None', 'Low', 'High'));

ALTER TABLE public.stock_inventory
  ALTER COLUMN priority SET DEFAULT 'Low';

SELECT 'Migration 010 done: priority Normal → Low' AS message;
