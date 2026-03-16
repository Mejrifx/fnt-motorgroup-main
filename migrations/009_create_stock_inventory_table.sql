-- =============================================
-- Migration 009: Create stock_inventory table
-- =============================================
-- A dedicated table for physical stock management, completely separate
-- from the AutoTrader-synced 'cars' table.
-- Run this in your Supabase SQL Editor

SET search_path TO public;

-- Create the table
CREATE TABLE IF NOT EXISTS public.stock_inventory (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_model            TEXT NOT NULL,
  make                 TEXT NOT NULL,
  model                TEXT NOT NULL,
  registration         TEXT,
  mot_expiry           DATE,
  mot_carry_out        BOOLEAN DEFAULT false,
  v5_present           BOOLEAN,
  num_keys             INTEGER DEFAULT 2,
  service_history      TEXT,
  stock_status         TEXT DEFAULT 'Ready' CHECK (stock_status IN ('Ready', 'In Prep', 'Needs Work')),
  work_needed          TEXT,
  priority             TEXT DEFAULT 'Normal' CHECK (priority IN ('None', 'Normal', 'High')),
  has_video            BOOLEAN DEFAULT false,
  has_diagnostic_report BOOLEAN DEFAULT false,
  notes                TEXT,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE public.stock_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage stock_inventory"
  ON public.stock_inventory FOR ALL
  USING (auth.role() = 'authenticated');

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_stock_inventory_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_stock_inventory_updated_at ON public.stock_inventory;
CREATE TRIGGER trg_stock_inventory_updated_at
  BEFORE UPDATE ON public.stock_inventory
  FOR EACH ROW EXECUTE FUNCTION public.update_stock_inventory_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_stock_registration  ON public.stock_inventory(registration);
CREATE INDEX IF NOT EXISTS idx_stock_status        ON public.stock_inventory(stock_status);
CREATE INDEX IF NOT EXISTS idx_stock_priority      ON public.stock_inventory(priority);

-- =============================================
-- Insert all 46 cars from the CSV
-- work_needed = NULL where CSV says "Ready" (no work needed)
-- =============================================

INSERT INTO public.stock_inventory
  (car_model, make, model, registration, mot_expiry, mot_carry_out, v5_present, num_keys, service_history, stock_status, work_needed, priority, has_video, has_diagnostic_report)
VALUES
  ('Alfa Romeo Giulia',    'Alfa Romeo',  'Giulia',              'KY68ZCV',  '2026-11-05', false, true,  2, '2 Services (1 Main Dealer)',       'In Prep',    'Take to Electrician (Stop start + service light reset)', 'Normal', false, false),
  ('BMW 420d',             'BMW',         '420d',                'LS64EGC',  '2027-03-12', false, true,  2, 'Yes (iDrive)',                      'Ready',      'Check Rear FOG lights / Start Car',                      'Normal', false, false),
  ('Jaguar XE',            'Jaguar',      'XE',                  'OU67VUL',  '2025-03-09', true,  false, 2, '5 Services (4 Main Dealer)',        'Needs Work', 'Replace Engine',                                         'High',   false, false),
  ('Dacia Sandero',        'Dacia',       'Sandero',             'AP71CZN',  '2026-09-11', true,  false, 2, 'No',                               'Ready',      NULL,                                                     'None',   false, false),
  ('Nissan Juke',          'Nissan',      'Juke',                'EU19NLZ',  '2026-10-11', false, false, 1, 'No',                               'Ready',      NULL,                                                     'None',   false, false),
  ('Range Rover Evoque',   'Land Rover',  'Range Rover Evoque',  'R10DYK',   '2027-03-09', false, false, 2, '3 Services',                       'Needs Work', 'Take to BCA',                                            'High',   false, false),
  ('VW Golf R',            'Volkswagen',  'Golf R',              'YB65RDX',  '2027-01-26', false, true,  2, '5 Services',                       'Ready',      'Engine tapping noise',                                   'None',   false, false),
  ('Mini Countryman',      'MINI',        'Countryman',          'PX16ZNJ',  '2026-12-05', false, true,  2, '5 Services',                       'Needs Work', 'Take to specialist / long start up',                     'Normal', false, false),
  ('Range Rover Evoque',   'Land Rover',  'Range Rover Evoque',  'YC68OUX',  '2026-10-02', true,  true,  2, '3 Services',                       'Ready',      NULL,                                                     'Normal', false, false),
  ('Mercedes A Class',     'Mercedes',    'A Class',             'PO70UUW',  '2026-09-24', true,  true,  1, '1 Service',                        'Ready',      NULL,                                                     'None',   false, false),
  ('Audi Q5',              'Audi',        'Q5',                  'NU64ONN',  '2026-12-21', false, true,  2, 'Unknown',                          'Ready',      NULL,                                                     'Normal', false, false),
  ('VW Golf GTI',          'Volkswagen',  'Golf GTI',            'VK19ZNX',  '2027-01-16', false, true,  2, '3 Main Dealer Services',           'Ready',      NULL,                                                     'None',   false, false),
  ('Land Rover Discovery', 'Land Rover',  'Discovery',           'GD17SMD',  '2027-01-15', false, true,  2, '5 Services',                       'In Prep',    'Audio/Radio Issue',                                      'High',   false, false),
  ('Range Rover Velar',    'Land Rover',  'Range Rover Velar',   'SO18YRY',  '2026-10-19', false, true,  2, '3 Services (2 Main Dealer)',        'Ready',      NULL,                                                     'None',   false, false),
  ('Honda Civic',          'Honda',       'Civic',               'GX19VBA',  '2026-05-05', true,  true,  2, 'Unknown',                          'Needs Work', 'Check timing chain',                                     'Normal', false, false),
  ('Jaguar F-Pace',        'Jaguar',      'F-Pace',              'NV68LGU',  '2026-07-13', true,  true,  2, '5 Services (3 Main Dealer)',        'Ready',      NULL,                                                     'None',   false, false),
  ('Jaguar F-Pace',        'Jaguar',      'F-Pace',              'SW66UOG',  '2027-01-27', false, true,  2, '3 Services',                       'In Prep',    'Engine Swap',                                            'High',   false, false),
  ('Audi S3',              'Audi',        'S3',                  'DF69EOD',  '2027-02-17', false, true,  2, '5 Services',                       'Needs Work', 'Airbag Light - Needs electrician',                       'High',   false, false),
  ('Range Rover Evoque',   'Land Rover',  'Range Rover Evoque',  'GF66XPV',  '2026-02-23', true,  true,  2, '10 Services',                      'In Prep',    'DPF Delete',                                             'Normal', false, false),
  ('Jaguar F-Pace',        'Jaguar',      'F-Pace',              'YY16ZWV',  '2026-11-28', false, true,  2, '5 Services (2 Main Dealer)',        'Ready',      NULL,                                                     'Normal', false, false),
  ('Mercedes A45',         'Mercedes',    'A45',                 'ET67XBL',  '2027-02-20', false, false, 1, '5 Services (4 Main Dealer)',        'Ready',      NULL,                                                     'None',   false, false),
  ('Jeep Renegade',        'Jeep',        'Renegade',            'PE64VYW',  '2027-01-29', false, true,  2, 'FSH',                              'Ready',      'Daytime running light bottom right',                     'Normal', false, false),
  ('Jaguar F-Pace',        'Jaguar',      'F-Pace',              'MJ17ZHR',  '2026-11-07', false, false, 1, '3 Services (2 Main Dealer)',        'Ready',      NULL,                                                     'None',   false, false),
  ('Audi Q7',              'Audi',        'Q7',                  'GV19ZVL',  '2025-09-22', true,  true,  1, 'Unknown',                          'Needs Work', 'Engine Replacement',                                     'High',   false, false),
  ('Kia Sorento',          'Kia',         'Sorento',             'LX66OTJ',  '2026-09-09', true,  true,  1, '4 Services',                       'Needs Work', 'Fit Headlight Washer + order outer electric boot handle', 'Normal', false, false),
  ('Land Rover Discovery', 'Land Rover',  'Discovery',           'AE18TZW',  '2027-02-19', false, true,  2, '3 Services',                       'Ready',      'Paint door handle',                                      'Normal', false, false),
  ('Audi Q5',              'Audi',        'Q5',                  'FP65HDC',  '2027-02-20', false, true,  2, 'No',                               'Needs Work', 'Puncture front right / put EGR Plate',                   'Normal', false, false),
  ('Mercedes A Class',     'Mercedes',    'A Class',             'Y666BFC',  '2026-01-08', true,  true,  2, '4 Services',                       'Needs Work', 'DPF Clean / Fit new Turbo',                              'High',   false, false),
  ('Mercedes A Class',     'Mercedes',    'A Class',             'RFZ8561',  '2026-02-27', true,  true,  2, '5 Services (4 Main Dealer)',        'Needs Work', 'Fuel pressure sensor',                                   'High',   false, false),
  ('Jaguar XF',            'Jaguar',      'XF',                  'YO66NNE',  '2027-01-27', false, true,  2, '2 Services',                       'Needs Work', 'Engine Mount (Shaking) / Key Battery',                   'Normal', false, false),
  ('Jaguar F-Pace',        'Jaguar',      'F-Pace',              'ML17JBY',  '2027-02-19', false, true,  2, '3 Services (1 Main Dealer)',        'Needs Work', 'Check timing chain / Service',                           'Normal', false, false),
  ('Range Rover Evoque',   'Land Rover',  'Range Rover Evoque',  'PJ17YUW',  '2027-03-09', false, false, 2, '4 Services (3 Main Dealer)',        'Ready',      'Service',                                                'Normal', false, false),
  ('Toyota Yaris',         'Toyota',      'Yaris',               'FP66TSU',  '2026-08-09', true,  false, 1, 'No',                               'Needs Work', 'Needs Electrician / Battery (Starting) Issue',           'High',   false, false),
  ('Range Rover Evoque',   'Land Rover',  'Range Rover Evoque',  'HJ65YYU',  '2027-03-17', false, true,  2, '5 Services',                       'Ready',      NULL,                                                     'Normal', false, false),
  ('Land Rover Discovery', 'Land Rover',  'Discovery',           'GJ16HCC',  '2026-10-15', false, false, 2, '10 Services (3 Main Dealer)',       'Ready',      NULL,                                                     'None',   false, false),
  ('Range Rover Evoque',   'Land Rover',  'Range Rover Evoque',  'YG19LXT',  '2027-03-11', false, true,  2, '4 Services',                       'Ready',      'Smells like bin',                                        'Normal', false, false),
  ('Range Rover Evoque',   'Land Rover',  'Range Rover Evoque',  'DA16XUC',  '2027-03-12', false, true,  2, '3 Services (2 Main Dealer)',        'Ready',      'Service',                                                'Normal', false, false),
  ('Jaguar F-Pace',        'Jaguar',      'F-Pace',              'BF18PPV',  '2027-03-03', false, true,  2, '6 Services (2 Main Dealer)',        'Ready',      NULL,                                                     'Normal', false, false),
  ('Audi A4',              'Audi',        'A4',                  'PX22YJJ',  '2027-02-12', false, true,  1, '3 Services',                       'Ready',      NULL,                                                     'None',   false, false),
  ('Jaguar XJ',            'Jaguar',      'XJ',                  'AY53MAC',  '2026-10-19', false, true,  2, 'FSH',                              'Needs Work', 'Take to electrician / Repair E-brake & pan roof',        'Normal', false, false),
  ('Land Rover Discovery', 'Land Rover',  'Discovery',           'SB68WKS',  '2026-10-19', false, true,  2, '1 Service',                        'Needs Work', 'Full Check',                                             'Normal', false, false),
  ('Jaguar XE',            'Jaguar',      'XE',                  'MV67VZW',  '2027-03-12', false, true,  2, '6 Services (4 Main Dealer)',        'Ready',      NULL,                                                     'Normal', false, false),
  ('BMW 520d',             'BMW',         '520d',                'WP61AZO',  '2026-07-28', true,  true,  1, 'Unknown',                          'Needs Work', 'Service + Headlights',                                   'Normal', false, false),
  ('Vauxhall Vivaro',      'Vauxhall',    'Vivaro',              'VU68CWK',  '2026-06-28', true,  true,  1, 'Unknown',                          'Needs Work', 'Airbag Light + Parking sensors - Needs electrician',     'Normal', false, false),
  ('Range Rover Evoque',   'Land Rover',  'Range Rover Evoque',  'MF69TZO',  '2027-01-30', false, true,  2, 'Unknown (3 Main Dealer)',           'Ready',      NULL,                                                     'None',   false, false);

SELECT COUNT(*) AS total_inserted FROM public.stock_inventory;
