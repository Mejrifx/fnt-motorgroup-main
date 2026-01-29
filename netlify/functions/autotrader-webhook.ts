/**
 * AutoTrader Webhook Handler
 * 
 * Receives real-time updates from AutoTrader when vehicles are created, updated, or deleted
 * URL to provide to AutoTrader: https://your-site.netlify.app/.netlify/functions/autotrader-webhook
 */

import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { createAutoTraderClient } from './lib/autotraderClient';
import { mapAutoTraderToDatabase, validateMappedCar } from './lib/dataMapper';

// Initialize Supabase client with SERVICE ROLE key (bypasses RLS for backend operations)
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

interface WebhookEvent {
  eventType: 'vehicle.created' | 'vehicle.updated' | 'vehicle.deleted';
  vehicleId: string;
  advertiserId: string;
  timestamp: string;
  [key: string]: any;
}

/**
 * Verify webhook signature (for security)
 * AutoTrader signs webhooks with HMAC-SHA256
 */
function verifyWebhookSignature(payload: string, signature: string): boolean {
  // TODO: Implement signature verification when AutoTrader provides webhook secret
  // For now, basic validation
  return !!signature && signature.length > 0;
}

/**
 * Handle vehicle created event
 */
async function handleVehicleCreated(vehicleId: string, advertiserId: string): Promise<void> {
  console.log(`Handling vehicle.created: ${vehicleId}`);
  
  // Fetch vehicle details from AutoTrader
  const autotraderClient = createAutoTraderClient();
  const vehicle = await autotraderClient.getVehicle(vehicleId);
  
  // Map to database schema
  const mappedCar = mapAutoTraderToDatabase(vehicle, advertiserId);
  
  // Validate
  const validation = validateMappedCar(mappedCar);
  if (!validation.valid) {
    throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
  }
  
  // Check if vehicle already exists
  const { data: existingCar } = await supabase
    .from('cars')
    .select('id, sync_override')
    .eq('autotrader_id', vehicleId)
    .single();
  
  if (existingCar) {
    // Vehicle exists, update it (unless override is set)
    if (!existingCar.sync_override) {
      await supabase
        .from('cars')
        .update({
          ...mappedCar,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingCar.id);
      
      console.log(`Updated existing vehicle: ${vehicleId}`);
    } else {
      console.log(`Skipped update for ${vehicleId} - manual override enabled`);
    }
  } else {
    // New vehicle, insert it
    await supabase
      .from('cars')
      .insert([{
        ...mappedCar,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }]);
    
    console.log(`Inserted new vehicle: ${vehicleId}`);
  }
  
  // Log webhook event
  await logWebhookEvent('vehicle.created', vehicleId, 'success');
}

/**
 * Handle vehicle updated event
 */
async function handleVehicleUpdated(vehicleId: string, advertiserId: string): Promise<void> {
  console.log(`Handling vehicle.updated: ${vehicleId}`);
  
  // Check if vehicle exists and is not overridden
  const { data: existingCar } = await supabase
    .from('cars')
    .select('id, sync_override')
    .eq('autotrader_id', vehicleId)
    .single();
  
  if (!existingCar) {
    console.log(`Vehicle ${vehicleId} not found in database, fetching...`);
    // Vehicle doesn't exist, treat as created
    await handleVehicleCreated(vehicleId, advertiserId);
    return;
  }
  
  if (existingCar.sync_override) {
    console.log(`Skipped update for ${vehicleId} - manual override enabled`);
    await logWebhookEvent('vehicle.updated', vehicleId, 'skipped');
    return;
  }
  
  // Fetch updated vehicle details from AutoTrader
  const autotraderClient = createAutoTraderClient();
  const vehicle = await autotraderClient.getVehicle(vehicleId);
  
  // Map to database schema
  const mappedCar = mapAutoTraderToDatabase(vehicle, advertiserId);
  
  // Update in database
  await supabase
    .from('cars')
    .update({
      ...mappedCar,
      updated_at: new Date().toISOString(),
    })
    .eq('id', existingCar.id);
  
  console.log(`Updated vehicle: ${vehicleId}`);
  
  // Log webhook event
  await logWebhookEvent('vehicle.updated', vehicleId, 'success');
}

/**
 * Handle vehicle deleted event
 */
async function handleVehicleDeleted(vehicleId: string): Promise<void> {
  console.log(`Handling vehicle.deleted: ${vehicleId}`);
  
  // Check if vehicle exists
  const { data: existingCar } = await supabase
    .from('cars')
    .select('id, sync_override')
    .eq('autotrader_id', vehicleId)
    .single();
  
  if (!existingCar) {
    console.log(`Vehicle ${vehicleId} not found in database`);
    await logWebhookEvent('vehicle.deleted', vehicleId, 'not_found');
    return;
  }
  
  if (existingCar.sync_override) {
    console.log(`Skipped deletion for ${vehicleId} - manual override enabled`);
    await logWebhookEvent('vehicle.deleted', vehicleId, 'skipped');
    return;
  }
  
  // Mark as unavailable (don't delete, just hide)
  await supabase
    .from('cars')
    .update({
      is_available: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', existingCar.id);
  
  console.log(`Marked vehicle as unavailable: ${vehicleId}`);
  
  // Log webhook event
  await logWebhookEvent('vehicle.deleted', vehicleId, 'success');
}

/**
 * Log webhook event to database
 */
async function logWebhookEvent(
  eventType: string,
  vehicleId: string,
  status: string,
  errorMessage?: string
): Promise<void> {
  try {
    await supabase.from('autotrader_sync_logs').insert([{
      sync_type: 'webhook',
      status: status === 'success' ? 'success' : 'failed',
      cars_added: eventType === 'vehicle.created' && status === 'success' ? 1 : 0,
      cars_updated: eventType === 'vehicle.updated' && status === 'success' ? 1 : 0,
      cars_marked_unavailable: eventType === 'vehicle.deleted' && status === 'success' ? 1 : 0,
      error_message: errorMessage || null,
      sync_duration_ms: 0,
    }]);
  } catch (logError) {
    console.error('Failed to log webhook event:', logError);
  }
}

/**
 * Netlify Function handler
 */
export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-Autotrader-Signature',
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
  
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed. Use POST.' }),
    };
  }
  
  try {
    // Parse webhook payload
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing request body' }),
      };
    }
    
    const webhookEvent: WebhookEvent = JSON.parse(event.body);
    
    // Verify webhook signature (if provided)
    const signature = event.headers['x-autotrader-signature'] || event.headers['X-Autotrader-Signature'];
    if (signature && !verifyWebhookSignature(event.body, signature)) {
      console.warn('Invalid webhook signature');
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid signature' }),
      };
    }
    
    // Log webhook receipt
    console.log(`Received webhook: ${webhookEvent.eventType} for vehicle ${webhookEvent.vehicleId}`);
    
    // Process webhook based on event type
    switch (webhookEvent.eventType) {
      case 'vehicle.created':
        await handleVehicleCreated(webhookEvent.vehicleId, webhookEvent.advertiserId);
        break;
      
      case 'vehicle.updated':
        await handleVehicleUpdated(webhookEvent.vehicleId, webhookEvent.advertiserId);
        break;
      
      case 'vehicle.deleted':
        await handleVehicleDeleted(webhookEvent.vehicleId);
        break;
      
      default:
        console.warn(`Unknown event type: ${webhookEvent.eventType}`);
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Unknown event type' }),
        };
    }
    
    // Return success response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: `Processed ${webhookEvent.eventType} for vehicle ${webhookEvent.vehicleId}`,
      }),
    };
  } catch (error) {
    console.error('Webhook handler error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
        message: 'Internal server error processing webhook',
      }),
    };
  }
};
