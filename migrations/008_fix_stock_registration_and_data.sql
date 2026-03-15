-- =============================================
-- Migration 008: Fix Registration + Re-import CSV Stock Data
-- =============================================
-- Run this in your Supabase SQL Editor

SET search_path TO public;

-- Step 1: Populate registration from the correct nested JSONB path
UPDATE public.cars
SET registration = UPPER(
  REPLACE(autotrader_data->'autotraderData'->'vehicle'->>'registration', ' ', '')
)
WHERE registration IS NULL
  AND autotrader_data->'autotraderData'->'vehicle'->>'registration' IS NOT NULL
  AND autotrader_data->'autotraderData'->'vehicle'->>'registration' != '';

-- Verify how many were populated
SELECT COUNT(*) AS registrations_populated FROM public.cars WHERE registration IS NOT NULL;

-- =============================================
-- Step 2: Re-run CSV data updates (matched by registration, spaces stripped)
-- =============================================

UPDATE public.cars SET
  mot_expiry = '2026-11-05', mot_carry_out = false, v5_present = true,  num_keys = 2,
  service_history = '2 Services (1 Main Dealer)', stock_status = 'In Prep',
  work_needed = 'Take to Electrician (Stop start + service light reset)', priority = 'Normal'
WHERE UPPER(REPLACE(COALESCE(registration,''), ' ', '')) = 'KY68ZCV';

UPDATE public.cars SET
  mot_expiry = '2027-03-12', mot_carry_out = false, v5_present = true,  num_keys = 2,
  service_history = 'Yes (iDrive)', stock_status = 'Ready',
  work_needed = 'Check Rear FOG lights / Start Car', priority = 'Normal'
WHERE UPPER(REPLACE(COALESCE(registration,''), ' ', '')) = 'LS64EGC';

UPDATE public.cars SET
  mot_expiry = '2025-09-03', mot_carry_out = true,  v5_present = false, num_keys = 2,
  service_history = '5 Services (4 Main Dealer)', stock_status = 'Needs Work',
  work_needed = 'Replace Engine', priority = 'High'
WHERE UPPER(REPLACE(COALESCE(registration,''), ' ', '')) = 'OU67VUL';

UPDATE public.cars SET
  mot_expiry = '2026-09-11', mot_carry_out = true,  v5_present = false, num_keys = 2,
  service_history = 'No', stock_status = 'Ready',
  work_needed = NULL, priority = 'None'
WHERE UPPER(REPLACE(COALESCE(registration,''), ' ', '')) = 'AP71CZN';

UPDATE public.cars SET
  mot_expiry = '2026-10-11', mot_carry_out = false, v5_present = false, num_keys = 1,
  service_history = 'No', stock_status = 'Ready',
  work_needed = NULL, priority = 'None'
WHERE UPPER(REPLACE(COALESCE(registration,''), ' ', '')) = 'EU19NLZ';

UPDATE public.cars SET
  mot_expiry = '2027-03-09', mot_carry_out = false, v5_present = false, num_keys = 2,
  service_history = '3 Services', stock_status = 'Needs Work',
  work_needed = 'Take to BCA', priority = 'High'
WHERE UPPER(REPLACE(COALESCE(registration,''), ' ', '')) = 'R10DYK';

UPDATE public.cars SET
  mot_expiry = '2027-01-26', mot_carry_out = false, v5_present = true,  num_keys = 2,
  service_history = '5 Services', stock_status = 'Ready',
  work_needed = 'Engine tapping noise', priority = 'None'
WHERE UPPER(REPLACE(COALESCE(registration,''), ' ', '')) = 'YB65RDX';

UPDATE public.cars SET
  mot_expiry = '2026-12-05', mot_carry_out = false, v5_present = true,  num_keys = 2,
  service_history = '5 Services', stock_status = 'Needs Work',
  work_needed = 'Take to specialist / long start up', priority = 'Normal'
WHERE UPPER(REPLACE(COALESCE(registration,''), ' ', '')) = 'PX16ZNJ';

UPDATE public.cars SET
  mot_expiry = '2026-10-02', mot_carry_out = true,  v5_present = true,  num_keys = 2,
  service_history = '3 Services', stock_status = 'Ready',
  work_needed = NULL, priority = 'Normal'
WHERE UPPER(REPLACE(COALESCE(registration,''), ' ', '')) = 'YC68OUX';

UPDATE public.cars SET
  mot_expiry = '2026-09-24', mot_carry_out = true,  v5_present = true,  num_keys = 1,
  service_history = '1 Service', stock_status = 'Ready',
  work_needed = NULL, priority = 'None'
WHERE UPPER(REPLACE(COALESCE(registration,''), ' ', '')) = 'PO70UUW';

UPDATE public.cars SET
  mot_expiry = '2026-12-21', mot_carry_out = false, v5_present = true,  num_keys = 2,
  service_history = 'Unknown', stock_status = 'Ready',
  work_needed = NULL, priority = 'Normal'
WHERE UPPER(REPLACE(COALESCE(registration,''), ' ', '')) = 'NU64ONN';

UPDATE public.cars SET
  mot_expiry = '2027-01-16', mot_carry_out = false, v5_present = true,  num_keys = 2,
  service_history = '3 Main Dealer Services', stock_status = 'Ready',
  work_needed = NULL, priority = 'None'
WHERE UPPER(REPLACE(COALESCE(registration,''), ' ', '')) = 'VK19ZNX';

UPDATE public.cars SET
  mot_expiry = '2027-01-15', mot_carry_out = false, v5_present = true,  num_keys = 2,
  service_history = '5 Services', stock_status = 'In Prep',
  work_needed = 'Audio/Radio Issue', priority = 'High'
WHERE UPPER(REPLACE(COALESCE(registration,''), ' ', '')) = 'GD17SMD';

UPDATE public.cars SET
  mot_expiry = '2026-10-19', mot_carry_out = false, v5_present = true,  num_keys = 2,
  service_history = '3 Services (2 Main Dealer)', stock_status = 'Ready',
  work_needed = NULL, priority = 'None'
WHERE UPPER(REPLACE(COALESCE(registration,''), ' ', '')) = 'SO18YRY';

UPDATE public.cars SET
  mot_expiry = '2026-05-05', mot_carry_out = true,  v5_present = true,  num_keys = 2,
  service_history = 'Unknown', stock_status = 'Needs Work',
  work_needed = 'Check timing chain', priority = 'Normal'
WHERE UPPER(REPLACE(COALESCE(registration,''), ' ', '')) = 'GX19VBA';

UPDATE public.cars SET
  mot_expiry = '2026-07-13', mot_carry_out = true,  v5_present = true,  num_keys = 2,
  service_history = '5 Services (3 Main Dealer)', stock_status = 'Ready',
  work_needed = NULL, priority = 'None'
WHERE UPPER(REPLACE(COALESCE(registration,''), ' ', '')) = 'NV68LGU';

UPDATE public.cars SET
  mot_expiry = '2027-01-27', mot_carry_out = false, v5_present = true,  num_keys = 2,
  service_history = '3 Services', stock_status = 'In Prep',
  work_needed = 'Engine Swap', priority = 'High'
WHERE UPPER(REPLACE(COALESCE(registration,''), ' ', '')) = 'SW66UOG';

UPDATE public.cars SET
  mot_expiry = '2027-02-17', mot_carry_out = false, v5_present = true,  num_keys = 2,
  service_history = '5 Services', stock_status = 'Needs Work',
  work_needed = 'Airbag Light - Needs electrician', priority = 'High'
WHERE UPPER(REPLACE(COALESCE(registration,''), ' ', '')) = 'DF69EOD';

UPDATE public.cars SET
  mot_expiry = '2026-02-23', mot_carry_out = true,  v5_present = true,  num_keys = 2,
  service_history = '10 Services', stock_status = 'In Prep',
  work_needed = 'DPF Delete', priority = 'Normal'
WHERE UPPER(REPLACE(COALESCE(registration,''), ' ', '')) = 'GF66XPV';

UPDATE public.cars SET
  mot_expiry = '2026-11-28', mot_carry_out = false, v5_present = true,  num_keys = 2,
  service_history = '5 Services (2 Main Dealer)', stock_status = 'Ready',
  work_needed = NULL, priority = 'Normal'
WHERE UPPER(REPLACE(COALESCE(registration,''), ' ', '')) = 'YY16ZWV';

UPDATE public.cars SET
  mot_expiry = '2027-02-20', mot_carry_out = false, v5_present = false, num_keys = 1,
  service_history = '5 Services (4 Main Dealer)', stock_status = 'Ready',
  work_needed = NULL, priority = 'None'
WHERE UPPER(REPLACE(COALESCE(registration,''), ' ', '')) = 'ET67XBL';

UPDATE public.cars SET
  mot_expiry = '2027-01-29', mot_carry_out = false, v5_present = true,  num_keys = 2,
  service_history = 'FSH', stock_status = 'Ready',
  work_needed = 'Daytime running light bottom right', priority = 'Normal'
WHERE UPPER(REPLACE(COALESCE(registration,''), ' ', '')) = 'PE64VYW';

UPDATE public.cars SET
  mot_expiry = '2026-11-07', mot_carry_out = false, v5_present = false, num_keys = 1,
  service_history = '3 Services (2 Main Dealer)', stock_status = 'Ready',
  work_needed = NULL, priority = 'None'
WHERE UPPER(REPLACE(COALESCE(registration,''), ' ', '')) = 'MJ17ZHR';

UPDATE public.cars SET
  mot_expiry = '2025-09-22', mot_carry_out = true,  v5_present = true,  num_keys = 1,
  service_history = 'Unknown', stock_status = 'Needs Work',
  work_needed = 'Engine Replacement', priority = 'High'
WHERE UPPER(REPLACE(COALESCE(registration,''), ' ', '')) = 'GV19ZVL';

UPDATE public.cars SET
  mot_expiry = '2026-09-09', mot_carry_out = true,  v5_present = true,  num_keys = 1,
  service_history = '4 Services', stock_status = 'Needs Work',
  work_needed = 'Fit Headlight Washer + order outer electric boot handle', priority = 'Normal'
WHERE UPPER(REPLACE(COALESCE(registration,''), ' ', '')) = 'LX66OTJ';

UPDATE public.cars SET
  mot_expiry = '2027-02-19', mot_carry_out = false, v5_present = true,  num_keys = 2,
  service_history = '3 Services', stock_status = 'Ready',
  work_needed = 'Paint door handle', priority = 'Normal'
WHERE UPPER(REPLACE(COALESCE(registration,''), ' ', '')) = 'AE18TZW';

UPDATE public.cars SET
  mot_expiry = '2027-02-20', mot_carry_out = false, v5_present = true,  num_keys = 2,
  service_history = 'No', stock_status = 'Needs Work',
  work_needed = 'Puncture front right / put EGR Plate', priority = 'Normal'
WHERE UPPER(REPLACE(COALESCE(registration,''), ' ', '')) = 'FP65HDC';

UPDATE public.cars SET
  mot_expiry = '2026-01-08', mot_carry_out = true,  v5_present = true,  num_keys = 2,
  service_history = '4 Services', stock_status = 'Needs Work',
  work_needed = 'DPF Clean / Fit new Turbo', priority = 'High'
WHERE UPPER(REPLACE(COALESCE(registration,''), ' ', '')) = 'Y666BFC';

UPDATE public.cars SET
  mot_expiry = '2026-02-27', mot_carry_out = true,  v5_present = true,  num_keys = 2,
  service_history = '5 Services (4 Main Dealer)', stock_status = 'Needs Work',
  work_needed = 'Fuel pressure sensor', priority = 'High'
WHERE UPPER(REPLACE(COALESCE(registration,''), ' ', '')) = 'RFZ8561';

UPDATE public.cars SET
  mot_expiry = '2027-01-27', mot_carry_out = false, v5_present = true,  num_keys = 2,
  service_history = '2 Services', stock_status = 'Needs Work',
  work_needed = 'Engine Mount (Shaking) / Key Battery', priority = 'Normal'
WHERE UPPER(REPLACE(COALESCE(registration,''), ' ', '')) = 'YO66NNE';

UPDATE public.cars SET
  mot_expiry = '2027-02-19', mot_carry_out = false, v5_present = true,  num_keys = 2,
  service_history = '3 Services (1 Main Dealer)', stock_status = 'Needs Work',
  work_needed = 'Check timing chain / Service', priority = 'Normal'
WHERE UPPER(REPLACE(COALESCE(registration,''), ' ', '')) = 'ML17JBY';

UPDATE public.cars SET
  mot_expiry = '2027-03-09', mot_carry_out = false, v5_present = false, num_keys = 2,
  service_history = '4 Services (3 Main Dealer)', stock_status = 'Ready',
  work_needed = 'Service', priority = 'Normal'
WHERE UPPER(REPLACE(COALESCE(registration,''), ' ', '')) = 'PJ17YUW';

UPDATE public.cars SET
  mot_expiry = '2026-08-09', mot_carry_out = true,  v5_present = false, num_keys = 1,
  service_history = 'No', stock_status = 'Needs Work',
  work_needed = 'Needs Electrician / Battery (Starting) Issue', priority = 'High'
WHERE UPPER(REPLACE(COALESCE(registration,''), ' ', '')) = 'FP66TSU';

UPDATE public.cars SET
  mot_expiry = '2027-03-17', mot_carry_out = false, v5_present = true,  num_keys = 2,
  service_history = '5 Services', stock_status = 'Ready',
  work_needed = NULL, priority = 'Normal'
WHERE UPPER(REPLACE(COALESCE(registration,''), ' ', '')) = 'HJ65YYU';

UPDATE public.cars SET
  mot_expiry = '2026-10-15', mot_carry_out = false, v5_present = true,  num_keys = 2,
  service_history = '10 Services (2 Main Dealer)', stock_status = 'Ready',
  work_needed = NULL, priority = 'None'
WHERE UPPER(REPLACE(COALESCE(registration,''), ' ', '')) = 'GJ16HCC';

UPDATE public.cars SET
  mot_expiry = '2027-03-11', mot_carry_out = false, v5_present = true,  num_keys = 2,
  service_history = '4 Services', stock_status = 'Ready',
  work_needed = 'Smells like bin', priority = 'Normal'
WHERE UPPER(REPLACE(COALESCE(registration,''), ' ', '')) = 'YG19LXT';

UPDATE public.cars SET
  mot_expiry = '2027-03-12', mot_carry_out = false, v5_present = true,  num_keys = 2,
  service_history = '3 Services (2 Main Dealer)', stock_status = 'Ready',
  work_needed = 'Service', priority = 'Normal'
WHERE UPPER(REPLACE(COALESCE(registration,''), ' ', '')) = 'DA16XUC';

UPDATE public.cars SET
  mot_expiry = '2027-03-03', mot_carry_out = false, v5_present = true,  num_keys = 2,
  service_history = '6 Services (2 Main Dealer)', stock_status = 'Ready',
  work_needed = NULL, priority = 'Normal'
WHERE UPPER(REPLACE(COALESCE(registration,''), ' ', '')) = 'BF18PPV';

UPDATE public.cars SET
  mot_expiry = '2027-02-12', mot_carry_out = false, v5_present = true,  num_keys = 1,
  service_history = '3 Services', stock_status = 'Ready',
  work_needed = NULL, priority = 'None'
WHERE UPPER(REPLACE(COALESCE(registration,''), ' ', '')) = 'PX22YJJ';

UPDATE public.cars SET
  mot_expiry = '2026-10-19', mot_carry_out = false, v5_present = true,  num_keys = 2,
  service_history = 'FSH', stock_status = 'Needs Work',
  work_needed = 'Take to electrician / Repair E-brake & pan roof', priority = 'Normal'
WHERE UPPER(REPLACE(COALESCE(registration,''), ' ', '')) = 'AY53MAC';

UPDATE public.cars SET
  mot_expiry = '2026-10-19', mot_carry_out = false, v5_present = true,  num_keys = 2,
  service_history = '1 Service', stock_status = 'Needs Work',
  work_needed = 'Full Check', priority = 'Normal'
WHERE UPPER(REPLACE(COALESCE(registration,''), ' ', '')) = 'SB68WKS';

UPDATE public.cars SET
  mot_expiry = '2027-03-12', mot_carry_out = false, v5_present = true,  num_keys = 2,
  service_history = '6 Services (4 Main Dealer)', stock_status = 'Ready',
  work_needed = NULL, priority = 'Normal'
WHERE UPPER(REPLACE(COALESCE(registration,''), ' ', '')) = 'MV67VZW';

UPDATE public.cars SET
  mot_expiry = '2026-07-28', mot_carry_out = true,  v5_present = true,  num_keys = 1,
  service_history = 'Unknown', stock_status = 'Needs Work',
  work_needed = 'Service + Headlights', priority = 'Normal'
WHERE UPPER(REPLACE(COALESCE(registration,''), ' ', '')) = 'WP61AZO';

UPDATE public.cars SET
  mot_expiry = '2026-06-28', mot_carry_out = true,  v5_present = true,  num_keys = 1,
  service_history = 'Unknown', stock_status = 'Needs Work',
  work_needed = 'Airbag Light + Parking sensors - Needs electrician', priority = 'Normal'
WHERE UPPER(REPLACE(COALESCE(registration,''), ' ', '')) = 'VU68CWK';

UPDATE public.cars SET
  mot_expiry = '2027-01-30', mot_carry_out = false, v5_present = true,  num_keys = 2,
  service_history = 'Unknown (3 Main Dealer)', stock_status = 'Ready',
  work_needed = NULL, priority = 'None'
WHERE UPPER(REPLACE(COALESCE(registration,''), ' ', '')) = 'MF69TZO';

-- Final check: show how many cars have stock data populated
SELECT
  COUNT(*) AS total_cars,
  COUNT(registration)  AS with_registration,
  COUNT(stock_status)  AS with_stock_status,
  COUNT(mot_expiry)    AS with_mot_expiry,
  COUNT(v5_present)    AS with_v5
FROM public.cars;
