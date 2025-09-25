import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wqbuznxglexyijlwvjmi.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxYnV6bnhnbGV4eWlqbHd2am1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MTcwMTgsImV4cCI6MjA3NDM5MzAxOH0.xzAqG6EVQFmFtEIc4hgdesL__pwuFXf-kzUjMH5WFtA'

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
  gallery_images: string[]
  is_available: boolean
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  email: string
  role: 'admin' | 'employee'
  created_at: string
}
