/**
 * Data Mapper
 * 
 * Transforms AutoTrader API responses to FNT Motor Group database schema
 */

import type { VehicleResponse } from './autotraderClient';

interface MappedCar {
  // Core fields
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: string;
  fuel_type: string;
  transmission: string;
  category: string;
  description: string;
  
  // Images
  cover_image_url: string;
  gallery_images: string[];
  
  // Additional details
  colour: string | null;
  engine: string | null;
  style: string | null;
  doors: number | null;
  road_tax: string | null;
  
  // AutoTrader sync fields
  autotrader_id: string;
  autotrader_advertiser_id: string;
  synced_from_autotrader: boolean;
  sync_override: boolean;
  last_synced_at: string;
  autotrader_data: any;
  
  // Availability
  is_available: boolean;
}

/**
 * Map AutoTrader body type to FNT category
 */
function mapBodyTypeToCategory(bodyType?: string): string {
  if (!bodyType) return 'Saloon';
  
  const type = bodyType.toLowerCase();
  
  // Map common body types to our categories
  // Database constraint: Saloon, Hatchback, Estate, Van, Coupe, Convertible, 4x4
  const categoryMap: Record<string, string> = {
    'suv': '4x4',           // SUV -> 4x4 (per database constraint)
    '4x4': '4x4',
    'estate': 'Estate',
    'hatchback': 'Hatchback',
    'saloon': 'Saloon',
    'sedan': 'Saloon',
    'coupe': 'Coupe',
    'convertible': 'Convertible',
    'mpv': 'Van',           // MPV -> Van (closest match)
    'van': 'Van',
    'pickup': 'Van',        // Pickup -> Van (closest match)
    'sports': 'Coupe',      // Sports -> Coupe (closest match)
    'luxury': 'Saloon',     // Luxury -> Saloon (default for luxury cars)
  };
  
  // Try to find match
  for (const [key, value] of Object.entries(categoryMap)) {
    if (type.includes(key)) {
      return value;
    }
  }
  
  // Default to Saloon if no match
  return 'Saloon';
}

/**
 * Format mileage consistently (add "Miles" with capital M)
 */
function formatMileage(mileage: number | string): string {
  const mileageNum = typeof mileage === 'string' ? parseInt(mileage.replace(/,/g, '')) : mileage;
  
  if (isNaN(mileageNum)) return '0 Miles';
  
  return `${mileageNum.toLocaleString()} Miles`;
}

/**
 * Normalize fuel type
 */
function normalizeFuelType(fuelType?: string): string {
  if (!fuelType) return 'Petrol';
  
  const fuel = fuelType.toLowerCase();
  
  if (fuel.includes('diesel')) return 'Diesel';
  if (fuel.includes('petrol') || fuel.includes('gasoline')) return 'Petrol';
  if (fuel.includes('electric') || fuel.includes('ev')) return 'Electric';
  if (fuel.includes('hybrid')) return 'Hybrid';
  if (fuel.includes('plug-in')) return 'Plug-in Hybrid';
  
  return fuelType; // Return original if no match
}

/**
 * Normalize transmission type
 */
function normalizeTransmission(transmission?: string): string {
  if (!transmission) return 'Manual';
  
  const trans = transmission.toLowerCase();
  
  if (trans.includes('auto') || trans.includes('automatic')) return 'Automatic';
  if (trans.includes('manual')) return 'Manual';
  if (trans.includes('semi')) return 'Semi-Automatic';
  
  return transmission; // Return original if no match
}

/**
 * Generate description if not provided
 */
function generateDescription(vehicle: VehicleResponse): string {
  const { make, model, variant, year, mileage, fuelType, transmission } = vehicle;
  
  const parts = [];
  
  // Start with basic info
  parts.push(`${year} ${make} ${model}`);
  
  // Add variant if available
  if (variant) {
    parts.push(variant);
  }
  
  // Add key features
  const features = [];
  features.push(normalizeTransmission(transmission));
  features.push(normalizeFuelType(fuelType));
  if (mileage) {
    features.push(formatMileage(mileage));
  }
  
  const description = `${parts.join(' ')} - ${features.join(', ')}. ${
    vehicle.description || 'Excellent condition, well maintained, ready to drive.'
  }`;
  
  return description;
}

/**
 * Extract engine size/type from vehicle data
 */
function extractEngine(vehicle: VehicleResponse): string | null {
  // Try to get from engine field
  if (vehicle.engine) return vehicle.engine;
  
  // Try to extract from variant
  if (vehicle.variant) {
    // Look for common patterns like "2.0L", "1.5 TSI", etc.
    const engineMatch = vehicle.variant.match(/\d+\.\d+[L]?|[A-Z]{3,}/);
    if (engineMatch) return engineMatch[0];
  }
  
  return null;
}

/**
 * Validate and sanitize image URL
 * Ensures images are HTTPS and from trusted sources
 */
function validateImageUrl(url: string | undefined | null): string {
  const DEFAULT_CAR_IMAGE = 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg';
  
  // If no URL provided, use default
  if (!url || typeof url !== 'string' || url.trim() === '') {
    console.warn('⚠️ Image URL is empty, using default');
    return DEFAULT_CAR_IMAGE;
  }
  
  const trimmedUrl = url.trim();
  
  // Check if URL is HTTPS (security requirement)
  if (!trimmedUrl.startsWith('https://')) {
    console.warn('⚠️ Image URL is not HTTPS:', trimmedUrl.substring(0, 50) + '...');
    return DEFAULT_CAR_IMAGE;
  }
  
  // Check if URL is from trusted sources
  const trustedDomains = [
    'autotrader.co.uk',
    'at-cdn.co.uk',
    'autotradercdn.com',
    'images.pexels.com', // Our fallback
  ];
  
  const isTrusted = trustedDomains.some(domain => trimmedUrl.includes(domain));
  
  if (!isTrusted) {
    console.warn('⚠️ Image URL is not from a trusted domain:', trimmedUrl.substring(0, 50) + '...');
    console.warn('⚠️ Trusted domains:', trustedDomains.join(', '));
    // Still return it (AutoTrader might use other CDNs) but log warning
  }
  
  // Basic URL format validation
  try {
    new URL(trimmedUrl);
    return trimmedUrl;
  } catch (error) {
    console.error('❌ Invalid image URL format:', trimmedUrl.substring(0, 50) + '...');
    return DEFAULT_CAR_IMAGE;
  }
}

/**
 * Validate and sanitize array of image URLs
 */
function validateImageUrls(urls: string[] | undefined | null): string[] {
  if (!Array.isArray(urls) || urls.length === 0) {
    return [];
  }
  
  return urls
    .map(url => validateImageUrl(url))
    .filter(url => url !== 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg'); // Remove default images from gallery
}

/**
 * Map AutoTrader vehicle to FNT database schema
 */
export function mapAutoTraderToDatabase(
  vehicle: VehicleResponse,
  advertiserId: string
): MappedCar {
  return {
    // Core fields
    make: vehicle.make || 'Unknown',
    model: vehicle.model || 'Unknown',
    year: vehicle.year || new Date().getFullYear(),
    price: vehicle.price || 0,
    mileage: formatMileage(vehicle.mileage || 0),
    fuel_type: normalizeFuelType(vehicle.fuelType),
    transmission: normalizeTransmission(vehicle.transmission),
    category: mapBodyTypeToCategory(vehicle.bodyType),
    description: vehicle.description || generateDescription(vehicle),
    
    // Images (validated for security and quality)
    cover_image_url: validateImageUrl(vehicle.images?.[0]),
    gallery_images: validateImageUrls(vehicle.images),
    
    // Additional details
    colour: vehicle.colour || null,
    engine: extractEngine(vehicle) || null,
    style: vehicle.variant || null,
    doors: vehicle.doors || null,
    road_tax: vehicle.roadTax || null,
    
    // AutoTrader sync fields
    autotrader_id: vehicle.vehicleId,
    autotrader_advertiser_id: advertiserId,
    synced_from_autotrader: true,
    sync_override: false,
    last_synced_at: new Date().toISOString(),
    autotrader_data: vehicle, // Store entire response for debugging
    
    // Availability
    is_available: true,
  };
}

/**
 * Map array of AutoTrader vehicles
 */
export function mapAutoTraderVehicles(
  vehicles: VehicleResponse[],
  advertiserId: string
): MappedCar[] {
  return vehicles.map(vehicle => mapAutoTraderToDatabase(vehicle, advertiserId));
}

/**
 * Validate mapped car data
 */
export function validateMappedCar(car: MappedCar): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Required fields
  if (!car.make || car.make === 'Unknown') {
    errors.push('Make is required');
  }
  if (!car.model || car.model === 'Unknown') {
    errors.push('Model is required');
  }
  if (!car.year || car.year < 1900 || car.year > new Date().getFullYear() + 1) {
    errors.push('Invalid year');
  }
  if (!car.price || car.price <= 0) {
    errors.push('Price must be greater than 0');
  }
  if (!car.autotrader_id) {
    errors.push('AutoTrader ID is required');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Compare two cars to detect changes (for update detection)
 */
export function detectChanges(
  autotraderCar: MappedCar,
  databaseCar: any
): boolean {
  // Check key fields that might change
  const fieldsToCheck = [
    'price',
    'mileage',
    'description',
    'is_available',
  ];
  
  for (const field of fieldsToCheck) {
    if (autotraderCar[field] !== databaseCar[field]) {
      return true;
    }
  }
  
  // Check if images changed
  if (JSON.stringify(autotraderCar.gallery_images) !== JSON.stringify(databaseCar.gallery_images)) {
    return true;
  }
  
  return false;
}

export default {
  mapAutoTraderToDatabase,
  mapAutoTraderVehicles,
  validateMappedCar,
  detectChanges,
};
