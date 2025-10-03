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

// Using Supabase's built-in User type from @supabase/supabase-js
