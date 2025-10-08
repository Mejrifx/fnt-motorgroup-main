-- Test Different Categories
-- This will help us figure out what categories are actually allowed

-- Test 1: Try 'SUV' (this was failing)
INSERT INTO cars (
  make, model, year, price, mileage, fuel_type, transmission, category, 
  description, colour, engine, doors, road_tax, is_available, created_at, updated_at
) VALUES 
  ('Dacia', 'Test SUV', 2021, 20000, '30000', 'Petrol', 'Manual', 'SUV', 
   'Test SUV entry.', 'Blue', '1.5', '5', '1', true, NOW(), NOW());

-- Test 2: Try 'suv' (lowercase)
INSERT INTO cars (
  make, model, year, price, mileage, fuel_type, transmission, category, 
  description, colour, engine, doors, road_tax, is_available, created_at, updated_at
) VALUES 
  ('Dacia', 'Test suv', 2021, 20000, '30000', 'Petrol', 'Manual', 'suv', 
   'Test suv entry.', 'Blue', '1.5', '5', '1', true, NOW(), NOW());

-- Test 3: Try 'Crossover' (alternative)
INSERT INTO cars (
  make, model, year, price, mileage, fuel_type, transmission, category, 
  description, colour, engine, doors, road_tax, is_available, created_at, updated_at
) VALUES 
  ('Dacia', 'Test Crossover', 2021, 20000, '30000', 'Petrol', 'Manual', 'Crossover', 
   'Test Crossover entry.', 'Blue', '1.5', '5', '1', true, NOW(), NOW());

-- Success message
SELECT 'Category tests completed!' as message;
