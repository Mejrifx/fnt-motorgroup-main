-- Add Dacia Car Models to Database
-- This SQL script adds Dacia cars to your Supabase database
-- Run this in your Supabase SQL Editor

-- Note: This script only ADDS new data - it doesn't modify existing data
-- Safe to run - will add Dacia models to your cars table

-- Dacia car models
INSERT INTO cars (
  make, model, year, price, mileage, fuel_type, transmission, category, 
  description, colour, engine, doors, road_tax, is_available, created_at, updated_at
) VALUES 
  -- Dacia Sandero
  ('Dacia', 'Sandero', 2021, 12500, '35000', 'Petrol', 'Manual', 'hatchback', 
   'Affordable supermini with excellent value for money and reliability.', 'Red', '1.0 TCe', '5', '1', true, NOW(), NOW()),
  
  -- Dacia Sandero Stepway
  ('Dacia', 'Sandero Stepway', 2022, 15500, '25000', 'Petrol', 'Manual', 'hatchback', 
   'Raised Sandero with crossover styling and practical features.', 'White', '1.0 TCe', '5', '1', true, NOW(), NOW()),
  
  -- Dacia Duster (Diesel)
  ('Dacia', 'Duster', 2021, 19500, '30000', 'Diesel', 'Manual', 'suv', 
   'Robust SUV with excellent off-road capability and great value.', 'Grey', '1.5 dCi', '5', '1', true, NOW(), NOW()),
  
  -- Dacia Duster (Petrol)
  ('Dacia', 'Duster', 2022, 22500, '18000', 'Petrol', 'Manual', 'suv', 
   'Popular SUV with practical design and affordable running costs.', 'Blue', '1.3 TCe', '5', '1', true, NOW(), NOW()),
  
  -- Dacia Logan
  ('Dacia', 'Logan', 2020, 11500, '40000', 'Petrol', 'Manual', 'saloon', 
   'Spacious saloon with excellent value and practical features.', 'Silver', '1.0 TCe', '4', '1', true, NOW(), NOW()),
  
  -- Dacia Jogger
  ('Dacia', 'Jogger', 2022, 18500, '20000', 'Petrol', 'Manual', 'estate', 
   'Versatile 7-seater estate with excellent space and practicality.', 'Green', '1.0 TCe', '5', '1', true, NOW(), NOW()),
  
  -- Dacia Spring (Electric)
  ('Dacia', 'Spring', 2022, 16500, '15000', 'Electric', 'Automatic', 'hatchback', 
   'Affordable electric city car with zero emissions and low running costs.', 'White', 'Electric', '5', '1', true, NOW(), NOW());

-- Success message
SELECT 'Dacia car models added successfully!' as message;
