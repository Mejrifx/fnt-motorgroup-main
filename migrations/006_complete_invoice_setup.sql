-- =====================================================
-- COMPLETE INVOICE SYSTEM SETUP
-- Run this entire script in Supabase SQL Editor
-- =====================================================

-- Part 1: Create invoices table (if not already created)
-- =====================================================

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE NOT NULL,
  invoice_type TEXT NOT NULL CHECK (invoice_type IN ('fnt_sale', 'fnt_purchase', 'tnt_service')),
  invoice_date DATE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  vehicle_make TEXT,
  vehicle_model TEXT,
  vehicle_reg TEXT,
  total_amount NUMERIC(10, 2),
  pdf_url TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_invoices_type ON invoices(invoice_type);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(invoice_date DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_name);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;
CREATE TRIGGER update_invoices_updated_at
BEFORE UPDATE ON invoices
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read invoices" ON invoices;
DROP POLICY IF EXISTS "Allow authenticated users to insert invoices" ON invoices;
DROP POLICY IF EXISTS "Allow authenticated users to update invoices" ON invoices;
DROP POLICY IF EXISTS "Allow authenticated users to delete invoices" ON invoices;

-- Create policies for authenticated users
CREATE POLICY "Allow authenticated users to read invoices"
ON invoices FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert invoices"
ON invoices FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update invoices"
ON invoices FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to delete invoices"
ON invoices FOR DELETE
TO authenticated
USING (true);

-- Part 2: Create Storage Bucket (via SQL - if supported)
-- =====================================================
-- Note: Storage bucket creation via SQL requires direct access to storage schema
-- If this fails, you'll need to create it via Dashboard:
-- 1. Go to Storage → Create bucket
-- 2. Name: invoices
-- 3. Public: YES
-- 4. File size limit: 10485760 (10MB)
-- 5. Allowed MIME types: application/pdf

-- Insert storage bucket (this may require elevated permissions)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'invoices',
  'invoices', 
  true,
  10485760,
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['application/pdf'];

-- Part 3: Storage Policies
-- =====================================================

-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public downloads" ON storage.objects;

-- Policy 1: Allow authenticated users to upload to invoices bucket
CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'invoices');

-- Policy 2: Allow authenticated users to update in invoices bucket
CREATE POLICY "Allow authenticated updates"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'invoices');

-- Policy 3: Allow public access to download from invoices bucket
CREATE POLICY "Allow public downloads"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'invoices');

-- Policy 4: Allow authenticated users to delete from invoices bucket
CREATE POLICY "Allow authenticated deletes"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'invoices');

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================
-- If you see "Success" messages, everything is set up!
-- 
-- If the storage bucket creation failed, manually create it in Dashboard:
-- Storage → New bucket → Name: invoices, Public: YES
-- =====================================================
