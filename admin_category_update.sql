-- Database Update for Category Changes and Field Updates
-- This SQL updates existing data to match the new category system
-- Run this in your Supabase SQL Editor

-- 1. Update existing category values to match new system
-- Change "Sports" to "4x4" and "SUV" to "Van"
UPDATE cars 
SET category = '4x4' 
WHERE category = 'Sports';

UPDATE cars 
SET category = 'Van' 
WHERE category = 'SUV';

-- 2. Update the category constraint to match our new filter options
ALTER TABLE cars DROP CONSTRAINT IF EXISTS cars_category_check;
ALTER TABLE cars 
ADD CONSTRAINT cars_category_check 
CHECK (category IN ('Saloon', 'Hatchback', 'Estate', 'Van', 'Coupe', 'Convertible', '4x4'));

-- 3. Update sample data for road_tax field (now represents Previous Owners)
-- Clear existing road tax data since it now represents previous owners count
UPDATE cars 
SET road_tax = CASE 
  WHEN id IN (SELECT id FROM cars ORDER BY id LIMIT 1) THEN '1'
  WHEN id IN (SELECT id FROM cars ORDER BY id OFFSET 1 LIMIT 1) THEN '2'
  WHEN id IN (SELECT id FROM cars ORDER BY id OFFSET 2 LIMIT 1) THEN '1'
  WHEN id IN (SELECT id FROM cars ORDER BY id OFFSET 3 LIMIT 1) THEN '3'
  WHEN id IN (SELECT id FROM cars ORDER BY id OFFSET 4 LIMIT 1) THEN '1'
  WHEN id IN (SELECT id FROM cars ORDER BY id OFFSET 5 LIMIT 1) THEN '2'
  ELSE '1'
END
WHERE road_tax IS NOT NULL;

-- 4. Update style field to match category (since style is now redundant with category)
UPDATE cars 
SET style = category
WHERE style IS NULL OR style != category;

-- 5. Add comment to road_tax column to clarify its new purpose
COMMENT ON COLUMN cars.road_tax IS 'Previous Owners count (changed from Road Tax)';

-- Success message
SELECT 'Database update completed successfully! Categories updated: Sports->4x4, SUV->Van. Road tax field now represents Previous Owners.' as message;
