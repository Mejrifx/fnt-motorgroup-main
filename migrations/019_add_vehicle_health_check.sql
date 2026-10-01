-- =============================================
-- Migration 019: Vehicle health check
-- =============================================
-- Forecourt checklist on each stock row: fuel level, punctures,
-- cleanliness, smell, and the rest of the health check.
-- Run this in your Supabase SQL Editor.

SET search_path TO public;

ALTER TABLE public.stock_inventory
  ADD COLUMN IF NOT EXISTS health_check JSONB;

COMMENT ON COLUMN public.stock_inventory.health_check IS
  'Forecourt health check. Check fields are pass, fail, or null. Shape: fuel_level, fuel_sufficient, punctures, exterior_clean, interior_clean, smell, warning_lights, starts_and_runs, lights_working, windscreen, tyres, notes, checked_at.';

SELECT 'Migration 019 done: stock_inventory.health_check' AS message;
