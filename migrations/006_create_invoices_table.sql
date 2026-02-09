-- Create invoices table for tracking all generated invoices
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

-- Create index for faster queries
CREATE INDEX idx_invoices_type ON invoices(invoice_type);
CREATE INDEX idx_invoices_date ON invoices(invoice_date DESC);
CREATE INDEX idx_invoices_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_customer ON invoices(customer_name);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_invoices_updated_at
BEFORE UPDATE ON invoices
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to read all invoices
CREATE POLICY "Allow authenticated users to read invoices"
ON invoices FOR SELECT
TO authenticated
USING (true);

-- Create policy to allow authenticated users to insert invoices
CREATE POLICY "Allow authenticated users to insert invoices"
ON invoices FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create policy to allow authenticated users to update invoices
CREATE POLICY "Allow authenticated users to update invoices"
ON invoices FOR UPDATE
TO authenticated
USING (true);

-- Create policy to allow authenticated users to delete invoices
CREATE POLICY "Allow authenticated users to delete invoices"
ON invoices FOR DELETE
TO authenticated
USING (true);
