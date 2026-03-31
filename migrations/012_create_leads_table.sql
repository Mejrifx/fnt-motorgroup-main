-- =============================================
-- Leads Table for CRM/Lead Tracking
-- =============================================

CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Customer Information
    customer_name VARCHAR(200) NOT NULL,
    customer_email VARCHAR(255),
    customer_phone VARCHAR(50),
    
    -- Lead Source
    source VARCHAR(100) NOT NULL, -- e.g., 'Car Gurus', 'Auto Trader', 'Facebook', 'Website', 'Walk-in', etc.
    
    -- Enquired Car
    car_id UUID REFERENCES cars(id) ON DELETE SET NULL,
    car_details TEXT, -- Fallback if car_id is null or car is deleted (e.g., "2021 BMW 3 Series")
    
    -- Lead Status & Communication
    status VARCHAR(50) DEFAULT 'new', -- e.g., 'new', 'contacted', 'in_progress', 'qualified', 'converted', 'lost'
    contacted BOOLEAN DEFAULT false,
    contact_date TIMESTAMP WITH TIME ZONE,
    answered BOOLEAN DEFAULT false,
    message_left BOOLEAN DEFAULT false,
    email_sent BOOLEAN DEFAULT false,
    
    -- Priority
    priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high'
    
    -- Notes and Communication History
    notes TEXT,
    communication_history JSONB DEFAULT '[]'::jsonb, -- Array of {date, type, notes, user}
    
    -- Lead Quality & Interest Level
    interest_level VARCHAR(20), -- 'low', 'medium', 'high'
    budget_range VARCHAR(100),
    timeframe VARCHAR(100), -- e.g., 'immediate', 'within 1 week', 'within 1 month', 'just browsing'
    
    -- Follow-up
    follow_up_date TIMESTAMP WITH TIME ZONE,
    next_action TEXT,
    
    -- Conversion
    converted BOOLEAN DEFAULT false,
    converted_date TIMESTAMP WITH TIME ZONE,
    sale_value DECIMAL(10,2),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- =============================================
-- Indexes for Performance
-- =============================================
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_source ON leads(source);
CREATE INDEX idx_leads_car_id ON leads(car_id);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX idx_leads_contacted ON leads(contacted);
CREATE INDEX idx_leads_follow_up_date ON leads(follow_up_date);
CREATE INDEX idx_leads_converted ON leads(converted);
CREATE INDEX idx_leads_priority ON leads(priority);

-- =============================================
-- Row Level Security (RLS)
-- =============================================
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can view leads
CREATE POLICY "Authenticated users can view leads" ON leads
    FOR SELECT USING (auth.role() = 'authenticated');

-- Only authenticated users can insert leads
CREATE POLICY "Authenticated users can insert leads" ON leads
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Only authenticated users can update leads
CREATE POLICY "Authenticated users can update leads" ON leads
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Only authenticated users can delete leads
CREATE POLICY "Authenticated users can delete leads" ON leads
    FOR DELETE USING (auth.role() = 'authenticated');

-- =============================================
-- Function to Update Timestamp
-- =============================================
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- Comments
-- =============================================
COMMENT ON TABLE leads IS 'Customer leads and enquiries tracking for FNT Motor Group';
COMMENT ON COLUMN leads.source IS 'Lead source (e.g., Car Gurus, Auto Trader, Facebook, Website)';
COMMENT ON COLUMN leads.status IS 'Current lead status (new, contacted, in_progress, qualified, converted, lost)';
COMMENT ON COLUMN leads.communication_history IS 'JSON array of communication logs with timestamps and notes';
