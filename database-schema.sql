-- =============================================
-- FNT Motor Group Database Schema
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- Cars Table
-- =============================================
CREATE TABLE cars (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    make VARCHAR(50) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INTEGER NOT NULL CHECK (year >= 1900 AND year <= EXTRACT(YEAR FROM CURRENT_DATE) + 1),
    price DECIMAL(10,2) NOT NULL CHECK (price > 0),
    mileage VARCHAR(20) NOT NULL,
    fuel_type VARCHAR(30) NOT NULL,
    transmission VARCHAR(20) NOT NULL,
    category VARCHAR(30) NOT NULL,
    description TEXT,
    cover_image_url TEXT,
    gallery_images TEXT[] DEFAULT '{}',
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- Users Table (for admin authentication)
-- =============================================
CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) DEFAULT 'employee' CHECK (role IN ('admin', 'employee')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- Indexes for Performance
-- =============================================
CREATE INDEX idx_cars_make ON cars(make);
CREATE INDEX idx_cars_category ON cars(category);
CREATE INDEX idx_cars_is_available ON cars(is_available);
CREATE INDEX idx_cars_price ON cars(price);
CREATE INDEX idx_cars_created_at ON cars(created_at);

-- =============================================
-- Row Level Security (RLS)
-- =============================================
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Public can read available cars
CREATE POLICY "Anyone can view available cars" ON cars
    FOR SELECT USING (is_available = true);

-- Only authenticated users can manage cars
CREATE POLICY "Authenticated users can manage cars" ON cars
    FOR ALL USING (auth.role() = 'authenticated');

-- Only authenticated users can view admin_users
CREATE POLICY "Only authenticated users can view admin users" ON admin_users
    FOR SELECT USING (auth.role() = 'authenticated');

-- =============================================
-- Insert Default Admin User
-- =============================================
INSERT INTO admin_users (email, password_hash, role) VALUES 
('admin@fntmotorgroup.com', crypt('FarisandTawhid', gen_salt('bf')), 'admin');

-- =============================================
-- Sample Car Data (for testing)
-- =============================================
INSERT INTO cars (make, model, year, price, mileage, fuel_type, transmission, category, description, cover_image_url) VALUES 
('Mercedes-Benz', 'C-Class AMG', 2022, 45000, '15,000', 'Petrol', 'Automatic', 'Luxury', 'Stunning Mercedes-Benz C-Class AMG with premium features and exceptional performance.', 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg'),
('BMW', '3 Series', 2021, 38000, '22,000', 'Petrol', 'Automatic', 'Luxury', 'Premium BMW 3 Series with elegant design and cutting-edge technology.', 'https://images.pexels.com/photos/1035108/pexels-photo-1035108.jpeg'),
('Audi', 'A4', 2023, 42000, '8,000', 'Petrol', 'Automatic', 'Luxury', 'Latest Audi A4 with advanced features and superior comfort.', 'https://images.pexels.com/photos/3752169/pexels-photo-3752169.jpeg');

-- =============================================
-- Functions for Updated Timestamp
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_cars_updated_at BEFORE UPDATE ON cars
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
