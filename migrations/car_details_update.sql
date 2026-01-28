-- Car Details Enhancement Database Update
-- This SQL adds new detail fields for comprehensive car information
-- Run this in your Supabase SQL Editor

-- 1. Add new columns to the cars table for detailed car information
ALTER TABLE cars 
ADD COLUMN IF NOT EXISTS colour TEXT,
ADD COLUMN IF NOT EXISTS engine TEXT,
ADD COLUMN IF NOT EXISTS style TEXT,
ADD COLUMN IF NOT EXISTS doors INTEGER,
ADD COLUMN IF NOT EXISTS road_tax TEXT;

-- 2. Update existing category values to match filter system exactly
-- This ensures proper filtering between admin and user interface
UPDATE cars SET category = 'Luxury' WHERE category IN ('luxury', 'Luxury');
UPDATE cars SET category = 'Sports' WHERE category IN ('sports', 'Sports', 'Sport');
UPDATE cars SET category = 'SUV' WHERE category IN ('suv', 'SUV', 'Suv');
UPDATE cars SET category = 'Electric' WHERE category IN ('electric', 'Electric');

-- 3. Add constraints to ensure data consistency
ALTER TABLE cars 
ADD CONSTRAINT check_doors CHECK (doors > 0 AND doors <= 10);

-- 4. Create indexes for better performance on new searchable fields
CREATE INDEX IF NOT EXISTS idx_cars_colour ON cars(colour);
CREATE INDEX IF NOT EXISTS idx_cars_engine ON cars(engine);
CREATE INDEX IF NOT EXISTS idx_cars_style ON cars(style);
CREATE INDEX IF NOT EXISTS idx_cars_doors ON cars(doors);

-- 5. Update the category constraint to match our filter options exactly
ALTER TABLE cars DROP CONSTRAINT IF EXISTS cars_category_check;
ALTER TABLE cars 
ADD CONSTRAINT cars_category_check 
CHECK (category IN ('Luxury', 'Sports', 'SUV', 'Electric'));

-- 6. Add sample data for existing cars (optional - you can remove this section)
-- This gives you some example data to work with
UPDATE cars 
SET 
  colour = CASE 
    WHEN id IN (SELECT id FROM cars LIMIT 1) THEN 'White'
    WHEN id IN (SELECT id FROM cars OFFSET 1 LIMIT 1) THEN 'Black'
    WHEN id IN (SELECT id FROM cars OFFSET 2 LIMIT 1) THEN 'Silver'
    ELSE 'Black'
  END,
  engine = CASE 
    WHEN fuel_type = 'Electric' THEN 'Electric Motor'
    WHEN fuel_type = 'Hybrid' THEN '2.0L Hybrid'
    WHEN fuel_type = 'Diesel' THEN '3.0L Diesel'
    ELSE '2.0L Petrol'
  END,
  style = category,
  doors = CASE 
    WHEN category = 'Sports' THEN 2
    WHEN category = 'SUV' THEN 5
    ELSE 4
  END,
  road_tax = CASE 
    WHEN fuel_type = 'Electric' THEN '£0'
    WHEN fuel_type = 'Hybrid' THEN '£180'
    WHEN price > 100000 THEN '£620'
    WHEN price > 50000 THEN '£415'
    ELSE '£180'
  END
WHERE colour IS NULL;

-- 7. Create a function to validate road tax format
CREATE OR REPLACE FUNCTION validate_road_tax(tax_value TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if the format is like £123 or £1,234
  RETURN tax_value ~ '^£[0-9,]+$';
END;
$$ LANGUAGE plpgsql;

-- Success message
SELECT 'Car details database update completed successfully! New fields: colour, engine, style, doors, road_tax' as message;
