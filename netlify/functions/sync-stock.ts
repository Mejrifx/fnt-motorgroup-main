/**
 * Stock Sync Function
 * 
 * Syncs vehicle inventory from AutoTrader to Supabase database
 * Triggered every 30 minutes or manually from admin dashboard
 */

import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { createAutoTraderClient } from './lib/autotraderClient';
import { mapAutoTraderToDatabase, validateMappedCar } from './lib/dataMapper';

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

interface SyncResult {
  success: boolean;
  carsAdded: number;
  carsUpdated: number;
  carsMarkedUnavailable: number;
  duration: number;
  errors: string[];
  message: string;
}

/**
 * Main sync logic
 */
async function syncStock(): Promise<SyncResult> {
  const startTime = Date.now();
  const result: SyncResult = {
    success: false,
    carsAdded: 0,
    carsUpdated: 0,
    carsMarkedUnavailable: 0,
    duration: 0,
    errors: [],
    message: '',
  };

  try {
    console.log('===== AutoTrader Stock Sync Started =====');
    
    // Step 1: Initialize AutoTrader client
    const autotraderClient = createAutoTraderClient();
    const advertiserId = process.env.AUTOTRADER_ADVERTISER_ID || '';
    
    console.log(`Fetching stock for advertiser: ${advertiserId}`);
    
    // Step 2: Fetch vehicles from AutoTrader
    const stockResponse = await autotraderClient.getAdvertiserStock(advertiserId);
    const autotraderVehicles = stockResponse.vehicles || [];
    
    console.log(`Found ${autotraderVehicles.length} vehicles in AutoTrader`);
    
    if (autotraderVehicles.length === 0) {
      result.message = 'No vehicles found in AutoTrader';
      result.duration = Date.now() - startTime;
      return result;
    }
    
    // Step 3: Get existing cars from database
    const { data: existingCars, error: fetchError } = await supabase
      .from('cars')
      .select('id, autotrader_id, sync_override')
      .eq('synced_from_autotrader', true);
    
    if (fetchError) {
      throw new Error(`Failed to fetch existing cars: ${fetchError.message}`);
    }
    
    // Create map of existing cars by autotrader_id
    const existingCarsMap = new Map(
      (existingCars || []).map(car => [car.autotrader_id, car])
    );
    
    // Track AutoTrader vehicle IDs we've seen
    const autotraderVehicleIds = new Set<string>();
    
    // Step 4: Process each AutoTrader vehicle
    for (const vehicle of autotraderVehicles) {
      try {
        // Map AutoTrader data to our schema
        const mappedCar = mapAutoTraderToDatabase(vehicle, advertiserId);
        autotraderVehicleIds.add(mappedCar.autotrader_id);
        
        // Validate mapped data
        const validation = validateMappedCar(mappedCar);
        if (!validation.valid) {
          console.warn(`Validation failed for vehicle ${vehicle.vehicleId}:`, validation.errors);
          result.errors.push(`Vehicle ${vehicle.vehicleId}: ${validation.errors.join(', ')}`);
          continue;
        }
        
        const existingCar = existingCarsMap.get(mappedCar.autotrader_id);
        
        if (existingCar) {
          // Car exists in database
          if (existingCar.sync_override) {
            // Admin has manually edited this car, skip auto-sync
            console.log(`Skipping ${mappedCar.autotrader_id} - manual override enabled`);
            continue;
          }
          
          // Update existing car
          const { error: updateError } = await supabase
            .from('cars')
            .update({
              make: mappedCar.make,
              model: mappedCar.model,
              year: mappedCar.year,
              price: mappedCar.price,
              mileage: mappedCar.mileage,
              fuel_type: mappedCar.fuel_type,
              transmission: mappedCar.transmission,
              category: mappedCar.category,
              description: mappedCar.description,
              cover_image_url: mappedCar.cover_image_url,
              gallery_images: mappedCar.gallery_images,
              colour: mappedCar.colour,
              engine: mappedCar.engine,
              style: mappedCar.style,
              doors: mappedCar.doors,
              road_tax: mappedCar.road_tax,
              last_synced_at: mappedCar.last_synced_at,
              autotrader_data: mappedCar.autotrader_data,
              is_available: true,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingCar.id);
          
          if (updateError) {
            console.error(`Failed to update car ${mappedCar.autotrader_id}:`, updateError);
            result.errors.push(`Update failed for ${mappedCar.autotrader_id}: ${updateError.message}`);
          } else {
            result.carsUpdated++;
            console.log(`Updated: ${mappedCar.make} ${mappedCar.model} (${mappedCar.autotrader_id})`);
          }
        } else {
          // New car, insert it
          const { error: insertError } = await supabase
            .from('cars')
            .insert([{
              ...mappedCar,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }]);
          
          if (insertError) {
            console.error(`Failed to insert car ${mappedCar.autotrader_id}:`, insertError);
            result.errors.push(`Insert failed for ${mappedCar.autotrader_id}: ${insertError.message}`);
          } else {
            result.carsAdded++;
            console.log(`Added: ${mappedCar.make} ${mappedCar.model} (${mappedCar.autotrader_id})`);
          }
        }
      } catch (vehicleError) {
        console.error(`Error processing vehicle ${vehicle.vehicleId}:`, vehicleError);
        result.errors.push(`Processing error for ${vehicle.vehicleId}: ${vehicleError.message}`);
      }
    }
    
    // Step 5: Mark cars no longer in AutoTrader as unavailable
    const carsToMarkUnavailable = existingCars?.filter(car => 
      !car.sync_override && !autotraderVehicleIds.has(car.autotrader_id)
    ) || [];
    
    if (carsToMarkUnavailable.length > 0) {
      const idsToMarkUnavailable = carsToMarkUnavailable.map(car => car.id);
      
      const { error: markError } = await supabase
        .from('cars')
        .update({ 
          is_available: false,
          updated_at: new Date().toISOString(),
        })
        .in('id', idsToMarkUnavailable);
      
      if (markError) {
        console.error('Failed to mark cars as unavailable:', markError);
        result.errors.push(`Mark unavailable failed: ${markError.message}`);
      } else {
        result.carsMarkedUnavailable = carsToMarkUnavailable.length;
        console.log(`Marked ${result.carsMarkedUnavailable} cars as unavailable`);
      }
    }
    
    // Step 6: Calculate results
    result.duration = Date.now() - startTime;
    result.success = result.errors.length === 0;
    result.message = `Sync completed: ${result.carsAdded} added, ${result.carsUpdated} updated, ${result.carsMarkedUnavailable} marked unavailable`;
    
    console.log('===== AutoTrader Stock Sync Completed =====');
    console.log(result.message);
    console.log(`Duration: ${result.duration}ms`);
    
    // Step 7: Log sync results
    await logSyncResult(result);
    
    return result;
  } catch (error) {
    console.error('Fatal sync error:', error);
    result.duration = Date.now() - startTime;
    result.success = false;
    result.errors.push(error.message);
    result.message = `Sync failed: ${error.message}`;
    
    // Log failed sync
    await logSyncResult(result);
    
    return result;
  }
}

/**
 * Log sync results to database
 */
async function logSyncResult(result: SyncResult): Promise<void> {
  try {
    await supabase.from('autotrader_sync_logs').insert([{
      sync_type: 'full_sync',
      status: result.success ? 'success' : (result.carsAdded > 0 || result.carsUpdated > 0 ? 'partial' : 'failed'),
      cars_added: result.carsAdded,
      cars_updated: result.carsUpdated,
      cars_marked_unavailable: result.carsMarkedUnavailable,
      error_message: result.errors.length > 0 ? result.errors.join('; ') : null,
      sync_duration_ms: result.duration,
    }]);
    
    console.log('Sync result logged to database');
  } catch (logError) {
    console.error('Failed to log sync result:', logError);
  }
}

/**
 * Netlify Function handler
 */
export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };
  
  // Handle OPTIONS request for CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }
  
  // Only allow POST and GET requests
  if (event.httpMethod !== 'POST' && event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }
  
  try {
    // Run sync
    const result = await syncStock();
    
    return {
      statusCode: result.success ? 200 : 207, // 207 = Multi-Status (partial success)
      headers,
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error('Handler error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
        message: 'Internal server error during sync',
      }),
    };
  }
};
