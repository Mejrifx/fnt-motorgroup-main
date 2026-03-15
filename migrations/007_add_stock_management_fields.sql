-- =============================================
-- Migration 007: Add Stock Management Fields
-- =============================================
-- Purpose: Add internal stock tracking columns used by the Stock Management
--          admin panel (MOT, V5, keys, service history, status, work needed etc.)
-- Run this in your Supabase SQL Editor

SET search_path TO public;

-- 1. Add new columns
ALTER TABLE public.cars
  ADD COLUMN IF NOT EXISTS registration         TEXT,
  ADD COLUMN IF NOT EXISTS mot_expiry           DATE,
  ADD COLUMN IF NOT EXISTS mot_carry_out        BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS v5_present           BOOLEAN,
  ADD COLUMN IF NOT EXISTS num_keys             INTEGER DEFAULT 2,
  ADD COLUMN IF NOT EXISTS service_history      TEXT,
  ADD COLUMN IF NOT EXISTS stock_status         TEXT,
  ADD COLUMN IF NOT EXISTS work_needed          TEXT,
  ADD COLUMN IF NOT EXISTS priority             TEXT DEFAULT 'Normal',
  ADD COLUMN IF NOT EXISTS has_video            BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_diagnostic_report BOOLEAN DEFAULT false;

-- 2. Add value constraints
ALTER TABLE public.cars
  DROP CONSTRAINT IF EXISTS check_stock_status,
  DROP CONSTRAINT IF EXISTS check_priority;

ALTER TABLE public.cars
  ADD CONSTRAINT check_stock_status
    CHECK (stock_status IN ('Ready', 'In Prep', 'Needs Work') OR stock_status IS NULL),
  ADD CONSTRAINT check_priority
    CHECK (priority IN ('None', 'Normal', 'High') OR priority IS NULL);

-- 3. Populate registration from autotrader_data for existing synced cars
UPDATE public.cars
SET registration = autotrader_data->>'registration'
WHERE registration IS NULL
  AND autotrader_data IS NOT NULL
  AND autotrader_data->>'registration' IS NOT NULL
  AND autotrader_data->>'registration' != '';

-- 4. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_cars_registration  ON public.cars(registration);
CREATE INDEX IF NOT EXISTS idx_cars_stock_status  ON public.cars(stock_status);
CREATE INDEX IF NOT EXISTS idx_cars_priority      ON public.cars(priority);
CREATE INDEX IF NOT EXISTS idx_cars_mot_expiry    ON public.cars(mot_expiry);

-- =============================================
-- 5. Populate CSV data (matched on registration)
--    Work needed of "Ready" is stored as NULL.
-- =============================================

UPDATE public.cars SET
  mot_expiry = '2026-11-05', mot_carry_out = false, v5_present = true,  num_keys = 2,
  service_history = '2 Services (1 Main Dealer)', stock_status = 'In Prep',
  work_needed = 'Take to Electrician (Stop start + service light reset)', priority = 'Normal'
WHERE UPPER(REPLACE(registration, ' ', '')) = 'KY68ZCV';

UPDATE public.cars SET
  mot_expiry = '2027-03-12', mot_carry_out = false, v5_present = true,  num_keys = 2,
  service_history = 'Yes (iDrive)', stock_status = 'Ready',
  work_needed = 'Check Rear FOG lights / Start Car', priority = 'Normal'
WHERE UPPER(REPLACE(registration, ' ', '')) = 'LS64EGC';

UPDATE public.cars SET
  mot_expiry = '2025-09-03', mot_carry_out = true,  v5_present = false, num_keys = 2,
  service_history = '5 Services (4 Main Dealer)', stock_status = 'Needs Work',
  work_needed = 'Replace Engine', priority = 'High'
WHERE UPPER(REPLACE(registration, ' ', '')) = 'OU67VUL';

UPDATE public.cars SET
  mot_expiry = '2026-09-11', mot_carry_out = true,  v5_present = false, num_keys = 2,
  service_history = 'No', stock_status = 'Ready',
  work_needed = NULL, priority = 'None'
WHERE UPPER(REPLACE(registration, ' ', '')) = 'AP71CZN';

UPDATE public.cars SET
  mot_expiry = '2026-10-11', mot_carry_out = false, v5_present = false, num_keys = 1,
  service_history = 'No', stock_status = 'Ready',
  work_needed = NULL, priority = 'None'
WHERE UPPER(REPLACE(registration, ' ', '')) = 'EU19NLZ';

UPDATE public.cars SET
  mot_expiry = '2027-03-09', mot_carry_out = false, v5_present = false, num_keys = 2,
  service_history = '3 Services', stock_status = 'Needs Work',
  work_needed = 'Take to BCA', priority = 'High'
WHERE UPPER(REPLACE(registration, ' ', '')) = 'R10DYK';

UPDATE public.cars SET
  mot_expiry = '2027-01-26', mot_carry_out = false, v5_present = true,  num_keys = 2,
  service_history = '5 Services', stock_status = 'Ready',
  work_needed = 'Engine tapping noise', priority = 'None'
WHERE UPPER(REPLACE(registration, ' ', '')) = 'YB65RDX';

UPDATE public.cars SET
  mot_expiry = '2026-12-05', mot_carry_out = false, v5_present = true,  num_keys = 2,
  service_history = '5 Services', stock_status = 'Needs Work',
  work_needed = 'Take to specialist / long start up', priority = 'Normal'
WHERE UPPER(REPLACE(registration, ' ', '')) = 'PX16ZNJ';

UPDATE public.cars SET
  mot_expiry = '2026-10-02', mot_carry_out = true,  v5_present = true,  num_keys = 2,
  service_history = '3 Services', stock_status = 'Ready',
  work_needed = NULL, priority = 'Normal'
WHERE UPPER(REPLACE(registration, ' ', '')) = 'YC68OUX';

UPDATE public.cars SET
  mot_expiry = '2026-09-24', mot_carry_out = true,  v5_present = true,  num_keys = 1,
  service_history = '1 Service', stock_status = 'Ready',
  work_needed = NULL, priority = 'None'
WHERE UPPER(REPLACE(registration, ' ', '')) = 'PO70UUW';

UPDATE public.cars SET
  mot_expiry = '2026-12-21', mot_carry_out = false, v5_present = true,  num_keys = 2,
  service_history = 'Unknown', stock_status = 'Ready',
  work_needed = NULL, priority = 'Normal'
WHERE UPPER(REPLACE(registration, ' ', '')) = 'NU64ONN';

UPDATE public.cars SET
  mot_expiry = '2027-01-16', mot_carry_out = false, v5_present = true,  num_keys = 2,
  service_history = '3 Main Dealer', stock_status = 'Ready',
  work_needed = NULL, priority = 'None'
WHERE UPPER(REPLACE(registration, ' ', '')) = 'VK19ZNX';

UPDATE public.cars SET
  mot_expiry = '2027-01-15', mot_carry_out = false, v5_present = true,  num_keys = 2,
  service_history = '5 Services', stock_status = 'In Prep',
  work_needed = 'Audio/Radio Issue', priority = 'High'
WHERE UPPER(REPLACE(registration, ' ', '')) = 'GD17SMD';

UPDATE public.cars SET
  mot_expiry = '2026-10-19', mot_carry_out = false, v5_present = true,  num_keys = 2,
  service_history = '3 Services (2 Main Dealer)', stock_status = 'Ready',
  work_needed = NULL, priority = 'None'
WHERE UPPER(REPLACE(registration, ' ', '')) = 'SO18YRY';

UPDATE public.cars SET
  mot_expiry = '2026-05-05', mot_carry_out = true,  v5_present = true,  num_keys = 2,
  service_history = 'Unknown', stock_status = 'Needs Work',
  work_needed = 'Check timing chain', priority = 'Normal'
WHERE UPPER(REPLACE(registration, ' ', '')) = 'GX19VBA';

UPDATE public.cars SET
  mot_expiry = '2026-07-13', mot_carry_out = true,  v5_present = true,  num_keys = 2,
  service_history = '5 Services (3 Main Dealer)', stock_status = 'Ready',
  work_needed = NULL, priority = 'None'
WHERE UPPER(REPLACE(registration, ' ', '')) = 'NV68LGU';

UPDATE public.cars SET
  mot_expiry = '2027-01-27', mot_carry_out = false, v5_present = true,  num_keys = 2,
  service_history = '3 Services', stock_status = 'In Prep',
  work_needed = 'Engine Swap', priority = 'High'
WHERE UPPER(REPLACE(registration, ' ', '')) = 'SW66UOG';

UPDATE public.cars SET
  mot_expiry = '2027-02-17', mot_carry_out = false, v5_present = true,  num_keys = 2,
  service_history = '5 Services', stock_status = 'Needs Work',
  work_needed = 'Airbag Light - Needs electrician', priority = 'High'
WHERE UPPER(REPLACE(registration, ' ', '')) = 'DF69EOD';

UPDATE public.cars SET
  mot_expiry = '2026-02-23', mot_carry_out = true,  v5_present = true,  num_keys = 2,
  service_history = '10 Services', stock_status = 'In Prep',
  work_needed = 'DPF Delete', priority = 'Normal'
WHERE UPPER(REPLACE(registration, ' ', '')) = 'GF66XPV';

UPDATE public.cars SET
  mot_expiry = '2026-11-28', mot_carry_out = false, v5_present = true,  num_keys = 2,
  service_history = '5 Services (2 Main Dealer)', stock_status = 'Ready',
  work_needed = NULL, priority = 'Normal'
WHERE UPPER(REPLACE(registration, ' ', '')) = 'YY16ZWV';

UPDATE public.cars SET
  mot_expiry = '2027-02-20', mot_carry_out = false, v5_present = false, num_keys = 1,
  service_history = '5 Services (4 Main Dealer)', stock_status = 'Ready',
  work_needed = NULL, priority = 'None'
WHERE UPPER(REPLACE(registration, ' ', '')) = 'ET67XBL';

UPDATE public.cars SET
  mot_expiry = '2027-01-29', mot_carry_out = false, v5_present = true,  num_keys = 2,
  service_history = 'FSH', stock_status = 'Ready',
  work_needed = 'Daytime running light bottom right', priority = 'Normal'
WHERE UPPER(REPLACE(registration, ' ', '')) = 'PE64VYW';

UPDATE public.cars SET
  mot_expiry = '2026-11-07', mot_carry_out = false, v5_present = false, num_keys = 1,
  service_history = '3 Services (2 Main Dealer)', stock_status = 'Ready',
  work_needed = NULL, priority = 'None'
WHERE UPPER(REPLACE(registration, ' ', '')) = 'MJ17ZHR';

UPDATE public.cars SET
  mot_expiry = '2025-09-22', mot_carry_out = true,  v5_present = true,  num_keys = 1,
  service_history = 'Unknown', stock_status = 'Needs Work',
  work_needed = 'Engine Replacement', priority = 'High'
WHERE UPPER(REPLACE(registration, ' ', '')) = 'GV19ZVL';

UPDATE public.cars SET
  mot_expiry = '2026-09-09', mot_carry_out = true,  v5_present = true,  num_keys = 1,
  service_history = '4 Services', stock_status = 'Needs Work',
  work_needed = 'Fit Headlight Washer + order outer electric boot handle', priority = 'Normal'
WHERE UPPER(REPLACE(registration, ' ', '')) = 'LX66OTJ';

UPDATE public.cars SET
  mot_expiry = '2027-02-19', mot_carry_out = false, v5_present = true,  num_keys = 2,
  service_history = '3 Services', stock_status = 'Ready',
  work_needed = 'Paint door handle', priority = 'Normal'
WHERE UPPER(REPLACE(registration, ' ', '')) = 'AE18TZW';

UPDATE public.cars SET
  mot_expiry = '2027-02-20', mot_carry_out = false, v5_present = true,  num_keys = 2,
  service_history = 'No', stock_status = 'Needs Work',
  work_needed = 'Puncture front right / put EGR Plate', priority = 'Normal'
WHERE UPPER(REPLACE(registration, ' ', '')) = 'FP65HDC';

UPDATE public.cars SET
  mot_expiry = '2026-01-08', mot_carry_out = true,  v5_present = true,  num_keys = 2,
  service_history = '4 Services', stock_status = 'Needs Work',
  work_needed = 'DPF Clean / Fit new Turbo', priority = 'High'
WHERE UPPER(REPLACE(registration, ' ', '')) = 'Y666BFC';

UPDATE public.cars SET
  mot_expiry = '2026-02-27', mot_carry_out = true,  v5_present = true,  num_keys = 2,
  service_history = '5 Services (4 Main Dealer)', stock_status = 'Needs Work',
  work_needed = 'Fuel pressure sensor', priority = 'High'
WHERE UPPER(REPLACE(registration, ' ', '')) = 'RFZ8561';

UPDATE public.cars SET
  mot_expiry = '2027-01-27', mot_carry_out = false, v5_present = true,  num_keys = 2,
  service_history = '2 Services', stock_status = 'Needs Work',
  work_needed = 'Engine Mount (Shaking) / Key Battery', priority = 'Normal'
WHERE UPPER(REPLACE(registration, ' ', '')) = 'YO66NNE';

UPDATE public.cars SET
  mot_expiry = '2027-02-19', mot_carry_out = false, v5_present = true,  num_keys = 2,
  service_history = '3 Services (1 Main Dealer)', stock_status = 'Needs Work',
  work_needed = 'Check timing chain / Service', priority = 'Normal'
WHERE UPPER(REPLACE(registration, ' ', '')) = 'ML17JBY';

UPDATE public.cars SET
  mot_expiry = '2027-03-09', mot_carry_out = false, v5_present = false, num_keys = 2,
  service_history = '4 Services (3 Main Dealer)', stock_status = 'Ready',
  work_needed = 'Service', priority = 'Normal'
WHERE UPPER(REPLACE(registration, ' ', '')) = 'PJ17YUW';

UPDATE public.cars SET
  mot_expiry = '2026-08-09', mot_carry_out = true,  v5_present = false, num_keys = 1,
  service_history = 'No', stock_status = 'Needs Work',
  work_needed = 'Needs Electrician / Battery (Starting) Issue', priority = 'High'
WHERE UPPER(REPLACE(registration, ' ', '')) = 'FP66TSU';

UPDATE public.cars SET
  mot_expiry = '2027-03-17', mot_carry_out = false, v5_present = true,  num_keys = 2,
  service_history = '5 Services', stock_status = 'Ready',
  work_needed = NULL, priority = 'Normal'
WHERE UPPER(REPLACE(registration, ' ', '')) = 'HJ65YYU';

-- GJ16 HCC appears twice in CSV (duplicate reg). Using second entry (V5 = Yes).
UPDATE public.cars SET
  mot_expiry = '2026-10-15', mot_carry_out = false, v5_present = true,  num_keys = 2,
  service_history = '10 Services (2 Main Dealer)', stock_status = 'Ready',
  work_needed = NULL, priority = 'None'
WHERE UPPER(REPLACE(registration, ' ', '')) = 'GJ16HCC';

UPDATE public.cars SET
  mot_expiry = '2027-03-11', mot_carry_out = false, v5_present = true,  num_keys = 2,
  service_history = '4 Services', stock_status = 'Ready',
  work_needed = 'Smells like bin', priority = 'Normal'
WHERE UPPER(REPLACE(registration, ' ', '')) = 'YG19LXT';

UPDATE public.cars SET
  mot_expiry = '2027-03-12', mot_carry_out = false, v5_present = true,  num_keys = 2,
  service_history = '3 Services (2 Main Dealer)', stock_status = 'Ready',
  work_needed = 'Service', priority = 'Normal'
WHERE UPPER(REPLACE(registration, ' ', '')) = 'DA16XUC';

UPDATE public.cars SET
  mot_expiry = '2027-03-03', mot_carry_out = false, v5_present = true,  num_keys = 2,
  service_history = '6 Services (2 Main Dealer)', stock_status = 'Ready',
  work_needed = NULL, priority = 'Normal'
WHERE UPPER(REPLACE(registration, ' ', '')) = 'BF18PPV';

UPDATE public.cars SET
  mot_expiry = '2027-02-12', mot_carry_out = false, v5_present = true,  num_keys = 1,
  service_history = '3 Services', stock_status = 'Ready',
  work_needed = NULL, priority = 'None'
WHERE UPPER(REPLACE(registration, ' ', '')) = 'PX22YJJ';

UPDATE public.cars SET
  mot_expiry = '2026-10-19', mot_carry_out = false, v5_present = true,  num_keys = 2,
  service_history = 'FSH', stock_status = 'Needs Work',
  work_needed = 'Take to electrician / Repair E-brake & pan roof', priority = 'Normal'
WHERE UPPER(REPLACE(registration, ' ', '')) = 'AY53MAC';

UPDATE public.cars SET
  mot_expiry = '2026-10-19', mot_carry_out = false, v5_present = true,  num_keys = 2,
  service_history = '1 Service', stock_status = 'Needs Work',
  work_needed = 'Full Check', priority = 'Normal'
WHERE UPPER(REPLACE(registration, ' ', '')) = 'SB68WKS';

UPDATE public.cars SET
  mot_expiry = '2027-03-12', mot_carry_out = false, v5_present = true,  num_keys = 2,
  service_history = '6 Services (4 Main Dealer)', stock_status = 'Ready',
  work_needed = NULL, priority = 'Normal'
WHERE UPPER(REPLACE(registration, ' ', '')) = 'MV67VZW';

UPDATE public.cars SET
  mot_expiry = '2026-07-28', mot_carry_out = true,  v5_present = true,  num_keys = 1,
  service_history = 'Unknown', stock_status = 'Needs Work',
  work_needed = 'Service + Headlights', priority = 'Normal'
WHERE UPPER(REPLACE(registration, ' ', '')) = 'WP61AZO';

UPDATE public.cars SET
  mot_expiry = '2026-06-28', mot_carry_out = true,  v5_present = true,  num_keys = 1,
  service_history = 'Unknown', stock_status = 'Needs Work',
  work_needed = 'Airbag Light + Parking sensors - Needs electrician', priority = 'Normal'
WHERE UPPER(REPLACE(registration, ' ', '')) = 'VU68CWK';

UPDATE public.cars SET
  mot_expiry = '2027-01-30', mot_carry_out = false, v5_present = true,  num_keys = 2,
  service_history = 'Unknown (3 Main Dealer)', stock_status = 'Ready',
  work_needed = NULL, priority = 'None'
WHERE UPPER(REPLACE(registration, ' ', '')) = 'MF69TZO';

SELECT 'Migration 007 completed: Stock management fields added and CSV data imported.' AS message;
