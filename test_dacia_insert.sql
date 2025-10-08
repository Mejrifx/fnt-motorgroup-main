-- Test Dacia Insert - Single Entry
-- This is a test to see what's causing the constraint error

INSERT INTO cars (
  make, model, year, price, mileage, fuel_type, transmission, category, 
  description, colour, engine, doors, road_tax, is_available, created_at, updated_at
) VALUES 
  ('Dacia', 'Sandero', 2021, 12500, '35000', 'Petrol', 'Manual', 'Hatchback', 
   'Affordable supermini with excellent value for money and reliability.', 'Red', '1.0 TCe', '5', '1', true, NOW(), NOW());

-- Success message
SELECT 'Test Dacia entry added successfully!' as message;
