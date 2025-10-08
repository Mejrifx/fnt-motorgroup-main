-- Add Mainstream Car Brands and Models to Database
-- This SQL script adds sample cars for all the new mainstream brands
-- Run this in your Supabase SQL Editor

-- Note: This script only ADDS new data - it doesn't modify existing data
-- It's safe to run multiple times (uses INSERT ... ON CONFLICT DO NOTHING)

-- Sample cars for new mainstream brands
INSERT INTO cars (
  make, model, year, price, mileage, fuel_type, transmission, category, 
  description, colour, engine, doors, road_tax, is_available, created_at, updated_at
) VALUES 
  -- Alfa Romeo
  ('Alfa Romeo', 'Giulietta', 2019, 18500, '45000', 'Petrol', 'Manual', 'Hatchback', 
   'Beautiful Italian design with sporty performance. Full service history.', 'Red', '1.4 Turbo', '5', '1', true, NOW(), NOW()),
  ('Alfa Romeo', 'Giulia', 2020, 28500, '32000', 'Petrol', 'Automatic', 'Saloon', 
   'Luxury Italian saloon with exceptional handling and premium interior.', 'Black', '2.0 Turbo', '4', '1', true, NOW(), NOW()),
  ('Alfa Romeo', 'Stelvio', 2021, 35000, '25000', 'Petrol', 'Automatic', 'SUV', 
   'Premium SUV with Italian flair and dynamic performance.', 'White', '2.0 Turbo', '5', '1', true, NOW(), NOW()),

  -- Citroen
  ('Citroen', 'C3', 2020, 12500, '38000', 'Petrol', 'Manual', 'Hatchback', 
   'Comfortable and economical city car with modern features.', 'Blue', '1.2 PureTech', '5', '1', true, NOW(), NOW()),
  ('Citroen', 'C4', 2021, 18500, '28000', 'Diesel', 'Manual', 'Hatchback', 
   'Spacious family car with excellent fuel economy.', 'Silver', '1.5 BlueHDi', '5', '1', true, NOW(), NOW()),
  ('Citroen', 'C5 Aircross', 2022, 24500, '15000', 'Petrol', 'Automatic', 'SUV', 
   'Comfortable SUV with advanced suspension and modern technology.', 'Grey', '1.6 PureTech', '5', '1', true, NOW(), NOW()),

  -- Cupra
  ('Cupra', 'Leon', 2021, 26500, '22000', 'Petrol', 'Manual', 'Hatchback', 
   'Sporty performance hatchback with premium features.', 'Copper', '2.0 TSI', '5', '1', true, NOW(), NOW()),
  ('Cupra', 'Formentor', 2022, 32500, '18000', 'Petrol', 'Automatic', 'SUV', 
   'High-performance SUV with striking design and dynamic handling.', 'Black', '2.0 TSI', '5', '1', true, NOW(), NOW()),

  -- Fiat
  ('Fiat', '500', 2020, 11500, '42000', 'Petrol', 'Manual', 'Hatchback', 
   'Iconic Italian city car with retro charm and modern efficiency.', 'White', '1.0 TwinAir', '3', '1', true, NOW(), NOW()),
  ('Fiat', '500X', 2021, 19500, '30000', 'Petrol', 'Manual', 'SUV', 
   'Compact SUV with Italian style and practical features.', 'Red', '1.0 Turbo', '5', '1', true, NOW(), NOW()),
  ('Fiat', 'Panda', 2019, 8500, '55000', 'Petrol', 'Manual', 'Hatchback', 
   'Reliable and economical city car perfect for urban driving.', 'Yellow', '1.2 Fire', '5', '1', true, NOW(), NOW()),

  -- Ford
  ('Ford', 'Fiesta', 2020, 13500, '40000', 'Petrol', 'Manual', 'Hatchback', 
   'Popular supermini with excellent handling and fuel economy.', 'Blue', '1.0 EcoBoost', '5', '1', true, NOW(), NOW()),
  ('Ford', 'Focus', 2021, 19500, '35000', 'Petrol', 'Manual', 'Hatchback', 
   'Well-equipped family hatchback with great driving dynamics.', 'Silver', '1.0 EcoBoost', '5', '1', true, NOW(), NOW()),
  ('Ford', 'Mustang', 2022, 45000, '12000', 'Petrol', 'Automatic', 'Coupe', 
   'Iconic American muscle car with powerful V8 engine.', 'Red', '5.0 V8', '2', '1', true, NOW(), NOW()),
  ('Ford', 'Kuga', 2021, 28500, '25000', 'Diesel', 'Automatic', 'SUV', 
   'Spacious family SUV with advanced safety features.', 'White', '2.0 EcoBlue', '5', '1', true, NOW(), NOW()),

  -- Honda
  ('Honda', 'Civic', 2021, 22500, '28000', 'Petrol', 'Manual', 'Hatchback', 
   'Reliable and efficient hatchback with Honda quality.', 'Grey', '1.0 VTEC Turbo', '5', '1', true, NOW(), NOW()),
  ('Honda', 'CR-V', 2022, 32500, '15000', 'Hybrid', 'Automatic', 'SUV', 
   'Efficient hybrid SUV with spacious interior and advanced technology.', 'Black', '2.0 Hybrid', '5', '1', true, NOW(), NOW()),
  ('Honda', 'Jazz', 2020, 16500, '35000', 'Petrol', 'Manual', 'Hatchback', 
   'Practical supermini with excellent space utilization.', 'Blue', '1.3 i-VTEC', '5', '1', true, NOW(), NOW()),

  -- Mitsubishi
  ('Mitsubishi', 'Outlander', 2021, 28500, '22000', 'Petrol', 'Automatic', 'SUV', 
   'Reliable SUV with excellent off-road capabilities.', 'White', '2.4 MIVEC', '5', '1', true, NOW(), NOW()),
  ('Mitsubishi', 'Eclipse Cross', 2022, 24500, '18000', 'Petrol', 'Automatic', 'SUV', 
   'Stylish crossover with modern design and efficient engine.', 'Red', '1.5 Turbo', '5', '1', true, NOW(), NOW()),

  -- Hyundai
  ('Hyundai', 'i30', 2021, 19500, '30000', 'Petrol', 'Manual', 'Hatchback', 
   'Well-equipped family hatchback with excellent warranty.', 'Silver', '1.0 T-GDi', '5', '1', true, NOW(), NOW()),
  ('Hyundai', 'Tucson', 2022, 29500, '12000', 'Petrol', 'Automatic', 'SUV', 
   'Modern SUV with advanced safety features and premium interior.', 'Blue', '1.6 T-GDi', '5', '1', true, NOW(), NOW()),
  ('Hyundai', 'Kona', 2021, 22500, '25000', 'Electric', 'Automatic', 'SUV', 
   'Electric SUV with impressive range and modern technology.', 'White', 'Electric', '5', '1', true, NOW(), NOW()),

  -- Kia
  ('Kia', 'Ceed', 2021, 18500, '32000', 'Petrol', 'Manual', 'Hatchback', 
   'Reliable family car with excellent warranty and modern features.', 'Grey', '1.0 T-GDi', '5', '1', true, NOW(), NOW()),
  ('Kia', 'Sportage', 2022, 27500, '15000', 'Petrol', 'Automatic', 'SUV', 
   'Popular SUV with great value and comprehensive equipment.', 'Black', '1.6 T-GDi', '5', '1', true, NOW(), NOW()),
  ('Kia', 'Niro', 2021, 26500, '20000', 'Hybrid', 'Automatic', 'SUV', 
   'Efficient hybrid SUV with excellent fuel economy.', 'Green', '1.6 Hybrid', '5', '1', true, NOW(), NOW()),

  -- Peugeot
  ('Peugeot', '208', 2021, 18500, '28000', 'Petrol', 'Manual', 'Hatchback', 
   'Stylish supermini with premium interior and modern technology.', 'Red', '1.2 PureTech', '5', '1', true, NOW(), NOW()),
  ('Peugeot', '308', 2022, 22500, '15000', 'Petrol', 'Manual', 'Hatchback', 
   'Sophisticated family hatchback with French flair.', 'Blue', '1.2 PureTech', '5', '1', true, NOW(), NOW()),
  ('Peugeot', '3008', 2021, 27500, '20000', 'Petrol', 'Automatic', 'SUV', 
   'Premium SUV with distinctive design and advanced features.', 'White', '1.6 PureTech', '5', '1', true, NOW(), NOW()),

  -- Seat
  ('Seat', 'Ibiza', 2020, 15500, '35000', 'Petrol', 'Manual', 'Hatchback', 
   'Sporty supermini with Spanish character and VW reliability.', 'Yellow', '1.0 TSI', '5', '1', true, NOW(), NOW()),
  ('Seat', 'Leon', 2021, 21500, '25000', 'Petrol', 'Manual', 'Hatchback', 
   'Dynamic family hatchback with sporty styling.', 'Silver', '1.5 TSI', '5', '1', true, NOW(), NOW()),
  ('Seat', 'Ateca', 2022, 26500, '12000', 'Petrol', 'Automatic', 'SUV', 
   'Practical SUV with sporty design and excellent handling.', 'Grey', '1.5 TSI', '5', '1', true, NOW(), NOW()),

  -- Suzuki
  ('Suzuki', 'Swift', 2021, 14500, '30000', 'Petrol', 'Manual', 'Hatchback', 
   'Fun-to-drive supermini with excellent reliability.', 'Red', '1.0 Boosterjet', '5', '1', true, NOW(), NOW()),
  ('Suzuki', 'Vitara', 2022, 22500, '15000', 'Petrol', 'Automatic', 'SUV', 
   'Compact SUV with excellent off-road capabilities.', 'White', '1.4 Boosterjet', '5', '1', true, NOW(), NOW()),
  ('Suzuki', 'Jimny', 2021, 19500, '20000', 'Petrol', 'Manual', 'SUV', 
   'Iconic off-roader with legendary capability and character.', 'Green', '1.5 K15B', '3', '1', true, NOW(), NOW()),

  -- Toyota
  ('Toyota', 'Yaris', 2021, 18500, '25000', 'Hybrid', 'Automatic', 'Hatchback', 
   'Efficient hybrid supermini with Toyota reliability.', 'Blue', '1.5 Hybrid', '5', '1', true, NOW(), NOW()),
  ('Toyota', 'Corolla', 2022, 23500, '12000', 'Hybrid', 'Automatic', 'Hatchback', 
   'Reliable family car with excellent hybrid efficiency.', 'Silver', '1.8 Hybrid', '5', '1', true, NOW(), NOW()),
  ('Toyota', 'RAV4', 2021, 32500, '18000', 'Hybrid', 'Automatic', 'SUV', 
   'Popular SUV with hybrid technology and excellent reliability.', 'White', '2.5 Hybrid', '5', '1', true, NOW(), NOW()),
  ('Toyota', 'Prius', 2020, 24500, '30000', 'Hybrid', 'Automatic', 'Hatchback', 
   'Pioneering hybrid with exceptional fuel economy.', 'Grey', '1.8 Hybrid', '5', '1', true, NOW(), NOW()),

  -- Volkswagen
  ('Volkswagen', 'Polo', 2021, 19500, '25000', 'Petrol', 'Manual', 'Hatchback', 
   'Premium supermini with excellent build quality.', 'Blue', '1.0 TSI', '5', '1', true, NOW(), NOW()),
  ('Volkswagen', 'Golf', 2022, 25500, '12000', 'Petrol', 'Manual', 'Hatchback', 
   'Iconic family hatchback with premium features.', 'Black', '1.5 TSI', '5', '1', true, NOW(), NOW()),
  ('Volkswagen', 'Tiguan', 2021, 29500, '20000', 'Petrol', 'Automatic', 'SUV', 
   'Popular SUV with German engineering and quality.', 'White', '1.5 TSI', '5', '1', true, NOW(), NOW()),
  ('Volkswagen', 'ID.3', 2022, 28500, '8000', 'Electric', 'Automatic', 'Hatchback', 
   'Modern electric hatchback with impressive range.', 'Grey', 'Electric', '5', '1', true, NOW(), NOW()),

  -- Vauxhall
  ('Vauxhall', 'Corsa', 2021, 17500, '28000', 'Petrol', 'Manual', 'Hatchback', 
   'Popular supermini with modern design and efficient engines.', 'Red', '1.2 Turbo', '5', '1', true, NOW(), NOW()),
  ('Vauxhall', 'Astra', 2022, 22500, '15000', 'Petrol', 'Manual', 'Hatchback', 
   'Well-equipped family hatchback with comfortable ride.', 'Silver', '1.2 Turbo', '5', '1', true, NOW(), NOW()),
  ('Vauxhall', 'Mokka', 2021, 23500, '20000', 'Petrol', 'Automatic', 'SUV', 
   'Stylish compact SUV with modern technology.', 'Blue', '1.2 Turbo', '5', '1', true, NOW(), NOW()),
  ('Vauxhall', 'Crossland', 2022, 21500, '18000', 'Petrol', 'Manual', 'SUV', 
   'Practical crossover with excellent value for money.', 'White', '1.2 Turbo', '5', '1', true, NOW(), NOW()),

  -- Volvo
  ('Volvo', 'XC40', 2021, 32500, '20000', 'Petrol', 'Automatic', 'SUV', 
   'Premium compact SUV with Scandinavian design and safety.', 'Black', '2.0 T5', '5', '1', true, NOW(), NOW()),
  ('Volvo', 'XC60', 2022, 42500, '12000', 'Petrol', 'Automatic', 'SUV', 
   'Luxury SUV with advanced safety features and premium interior.', 'White', '2.0 T5', '5', '1', true, NOW(), NOW()),
  ('Volvo', 'S60', 2021, 28500, '25000', 'Petrol', 'Automatic', 'Saloon', 
   'Elegant saloon with Volvo safety and Scandinavian luxury.', 'Grey', '2.0 T4', '4', '1', true, NOW(), NOW()),
  ('Volvo', 'V60', 2022, 29500, '15000', 'Petrol', 'Automatic', 'Estate', 
   'Practical estate with premium features and excellent safety.', 'Blue', '2.0 T4', '5', '1', true, NOW(), NOW()),

  -- Dacia
  ('Dacia', 'Sandero', 2021, 12500, '35000', 'Petrol', 'Manual', 'Hatchback', 
   'Affordable supermini with excellent value for money and reliability.', 'Red', '1.0 TCe', '5', '1', true, NOW(), NOW()),
  ('Dacia', 'Sandero Stepway', 2022, 15500, '25000', 'Petrol', 'Manual', 'Hatchback', 
   'Raised Sandero with crossover styling and practical features.', 'White', '1.0 TCe', '5', '1', true, NOW(), NOW()),
  ('Dacia', 'Duster', 2021, 19500, '30000', 'Diesel', 'Manual', 'SUV', 
   'Robust SUV with excellent off-road capability and great value.', 'Grey', '1.5 dCi', '5', '1', true, NOW(), NOW()),
  ('Dacia', 'Duster', 2022, 22500, '18000', 'Petrol', 'Manual', 'SUV', 
   'Popular SUV with practical design and affordable running costs.', 'Blue', '1.3 TCe', '5', '1', true, NOW(), NOW()),
  ('Dacia', 'Logan', 2020, 11500, '40000', 'Petrol', 'Manual', 'Saloon', 
   'Spacious saloon with excellent value and practical features.', 'Silver', '1.0 TCe', '4', '1', true, NOW(), NOW()),
  ('Dacia', 'Jogger', 2022, 18500, '20000', 'Petrol', 'Manual', 'Estate', 
   'Versatile 7-seater estate with excellent space and practicality.', 'Green', '1.0 TCe', '5', '1', true, NOW(), NOW()),
  ('Dacia', 'Spring', 2022, 16500, '15000', 'Electric', 'Automatic', 'Hatchback', 
   'Affordable electric city car with zero emissions and low running costs.', 'White', 'Electric', '5', '1', true, NOW(), NOW())

ON CONFLICT (make, model, year, mileage) DO NOTHING;

-- Success message
SELECT 'Mainstream car brands and models (including Dacia) added successfully!' as message;

