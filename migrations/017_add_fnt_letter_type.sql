-- =============================================
-- Migration 017: Add fnt_letter document type
-- =============================================
-- Letters to customers (confirming agreed work, deposits, collection
-- arrangements and so on) are stored in the same table as the invoices, so they
-- inherit the existing history, search, edit and signed-URL handling.
--
-- Letters carry no total, so total_amount stays null on those rows.
--
-- Run this in your Supabase SQL Editor
-- =============================================

SET search_path TO public;

-- 1. Drop the existing CHECK constraint
ALTER TABLE invoices
  DROP CONSTRAINT IF EXISTS invoices_invoice_type_check;

-- 2. Recreate it with 'fnt_letter' included
ALTER TABLE invoices
  ADD CONSTRAINT invoices_invoice_type_check
  CHECK (invoice_type IN ('fnt_sale', 'fnt_purchase', 'fnt_finance', 'tnt_service', 'fnt_letter'));

-- 3. Verify
SELECT
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'invoices'::regclass
  AND conname = 'invoices_invoice_type_check';

SELECT 'Migration 017 complete: fnt_letter type added' AS message;
