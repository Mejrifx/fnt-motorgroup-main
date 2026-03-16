import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// Types for our database
export interface Car {
  id: string
  make: string
  model: string
  year: number
  price: number
  mileage: string
  fuel_type: string
  transmission: string
  category: string
  description: string
  cover_image_url: string
  cover_image_path: string | null
  gallery_images: string[]
  gallery_image_paths: string[]
  colour: string | null
  engine: string | null
  style: string | null
  doors: number | null
  road_tax: string | null
  is_available: boolean
  created_at: string
  updated_at: string
  // AutoTrader sync fields
  autotrader_id?: string | null
  autotrader_advertiser_id?: string | null
  synced_from_autotrader?: boolean
  sync_override?: boolean
  last_synced_at?: string | null
  autotrader_data?: any
  // Stock management fields
  registration?: string | null
  mot_expiry?: string | null
  mot_carry_out?: boolean | null
  v5_present?: boolean | null
  num_keys?: number | null
  service_history?: string | null
  stock_status?: 'Ready' | 'In Prep' | 'Needs Work' | null
  work_needed?: string | null
  priority?: 'None' | 'Normal' | 'High' | null
  has_video?: boolean | null
  has_diagnostic_report?: boolean | null
}

export interface Review {
  id: string
  customer_name: string
  review_text: string
  rating: number
  vehicle_purchased: string | null
  review_date: string
  is_featured: boolean
  created_at: string
  updated_at: string
}

export interface StockItem {
  id: string
  car_model: string
  make: string
  model: string
  registration: string | null
  mot_expiry: string | null
  mot_carry_out: boolean | null
  v5_present: boolean | null
  num_keys: number | null
  service_history: string | null
  stock_status: 'Ready' | 'In Prep' | 'Needs Work' | null
  work_needed: string | null
  priority: 'None' | 'Normal' | 'High' | null
  has_video: boolean | null
  has_diagnostic_report: boolean | null
  notes: string | null
  created_at: string
  updated_at: string
}

// Using Supabase's built-in User type from @supabase/supabase-js
