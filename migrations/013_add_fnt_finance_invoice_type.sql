-- =============================================
-- Migration 013: Add fnt_finance invoice type
-- =============================================
-- Adds support for Finance Invoice type to bill finance companies
-- (e.g., Santander, Black Horse) when vehicles are sold through financing.
--
-- Run this in your Supabase SQL Editor
-- =============================================

SET search_path TO public;

-- 1. Drop the old CHECK constraint
ALTER TABLE invoices
  DROP CONSTRAINT IF EXISTS invoices_invoice_type_check;

-- 2. Add new CHECK constraint with 'fnt_finance' included
ALTER TABLE invoices
  ADD CONSTRAINT invoices_invoice_type_check
  CHECK (invoice_type IN ('fnt_sale', 'fnt_purchase', 'fnt_finance', 'tnt_service'));

-- 3. Verify the constraint was added
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'invoices'::regclass
  AND conname = 'invoices_invoice_type_check';

SELECT 'Migration 013 complete: fnt_finance invoice type added' AS message;
