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

// Placeholder image as inline SVG data URI — can NEVER fail to load
export const PLACEHOLDER_IMAGE = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="250" viewBox="0 0 400 250"><rect fill="#f3f4f6" width="400" height="250"/><g fill="#9ca3af"><rect x="175" y="85" width="50" height="40" rx="4"/><circle cx="188" cy="100" r="5"/><path d="M178 121l12-15 8 10 6-5 18 14H178z"/></g><text x="200" y="155" font-family="Arial,sans-serif" font-size="14" fill="#6b7280" text-anchor="middle">No Image Available</text></svg>'
)}`

/**
 * Get the best available image URL for a car.
 * Tries: 1) Supabase Storage path  2) Direct URL  3) Inline placeholder
 */
export function getCarImageUrl(car: Car): string {
  if (car.cover_image_path) {
    return supabase.storage.from('car-images').getPublicUrl(car.cover_image_path).data.publicUrl
  }
  if (car.cover_image_url) {
    return car.cover_image_url
  }
  return PLACEHOLDER_IMAGE
}

/**
 * Safe onError handler for car images.
 * Prevents infinite loops by using a data attribute to track retries.
 * Final fallback is an inline data URI that can never fail.
 */
export function handleImageError(e: React.SyntheticEvent<HTMLImageElement>, car: Car) {
  const target = e.target as HTMLImageElement
  const retryCount = parseInt(target.getAttribute('data-retry') || '0')
  
  if (retryCount >= 2) {
    // Already exhausted retries — use inline SVG that never fails
    target.src = PLACEHOLDER_IMAGE
    return
  }
  
  target.setAttribute('data-retry', String(retryCount + 1))
  
  if (retryCount === 0 && car.cover_image_url && target.src !== car.cover_image_url) {
    // First retry: try the direct URL
    target.src = car.cover_image_url
  } else {
    // Second retry: use inline placeholder
    target.src = PLACEHOLDER_IMAGE
  }
}

// Using Supabase's built-in User type from @supabase/supabase-js
