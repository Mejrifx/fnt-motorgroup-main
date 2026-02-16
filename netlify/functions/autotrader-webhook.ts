/**
 * AutoTrader Webhook Handler
 * 
 * Receives real-time updates from AutoTrader when vehicles are created, updated, or deleted
 * URL to provide to AutoTrader: https://your-site.netlify.app/.netlify/functions/autotrader-webhook
 */

import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
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
  id: string; // stockId
  time: string;
  type: 'STOCK_UPDATE' | 'STOCK_DELETE';
  data: {
    advertiser: {
      advertiserId: string;
    };
    metadata: {
      stockId: string;
      lifecycleState: string;
      lastUpdated: string;
    };
    vehicle: any; // Complete vehicle data
    adverts: {
      retailAdverts?: {
        price?: {
          amountGBP?: number;
        };
      };
    };
  };
  changedFields?: Array<{ path: string }>;
  [key: string]: any;
}

/**
 * Verify webhook signature using HMAC-SHA256 (for security)
 * AutoTrader signs webhooks with a shared secret key
 * Reference: https://developers.autotrader.co.uk/webhooks
 */
function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  try {
    // If no signature or secret provided, reject
    if (!signature || !secret) {
      console.error('❌ Webhook signature or secret is missing');
      return false;
    }
    
    // Remove "sha256=" prefix if present (some APIs include this)
    const cleanSignature = signature.replace(/^sha256=/, '');
    
    // Compute expected signature using HMAC-SHA256
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload, 'utf8');
    const expectedSignature = hmac.digest('hex');
    
    // Verify signature lengths match
    if (cleanSignature.length !== expectedSignature.length) {
      console.error('❌ Webhook signature length mismatch');
      console.error('Expected length:', expectedSignature.length);
      console.error('Received length:', cleanSignature.length);
      return false;
    }
    
    // Constant-time comparison to prevent timing attacks
    const signatureBuffer = Buffer.from(cleanSignature, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    
    if (signatureBuffer.length !== expectedBuffer.length) {
      console.error('❌ Webhook signature buffer length mismatch');
      return false;
    }
    
    const isValid = crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
    
    if (!isValid) {
      console.error('❌ Webhook signature verification FAILED');
      console.error('Expected signature:', expectedSignature.substring(0, 20) + '...');
      console.error('Received signature:', cleanSignature.substring(0, 20) + '...');
    } else {
      console.log('✅ Webhook signature verified successfully');
    }
    
    return isValid;
  } catch (error) {
    console.error('❌ Error verifying webhook signature:', error);
    return false;
  }
}

/**
 * Transform webhook payload to API format (for data mapper)
 * Webhook sends data in a different structure than the API
 */
function transformWebhookToApiFormat(webhookEvent: WebhookEvent): any {
  const { vehicle, adverts, metadata, media } = webhookEvent.data;
  
  // Extract price from nested structure
  const price = adverts?.retailAdverts?.price?.amountGBP || 
                adverts?.forecourtPrice?.amountGBP || 
                0;
  
  // Extract description
  const description = adverts?.retailAdverts?.description2 || 
                      adverts?.retailAdverts?.description || 
                      '';
  
  // Extract first image URL
  const firstImage = media?.images?.[0]?.href || '';
  const imageUrl = firstImage ? firstImage.replace('{resize}', '800x600') : '';
  
  // Extract all gallery images
  const galleryImages = (media?.images || [])
    .slice(0, 10) // Limit to 10 images
    .map((img: any) => img.href?.replace('{resize}', '800x600') || '')
    .filter((url: string) => url.length > 0);
  
  // Transform to API format that the data mapper expects
  return {
    id: metadata.stockId,
    vehicleId: metadata.stockId, // Required by data mapper (autotrader_id field)
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.yearOfManufacture,
    price: price,
    mileage: vehicle.odometerReadingMiles,
    fuelType: vehicle.fuelType,
    transmission: vehicle.transmissionType,
    bodyType: vehicle.bodyType,
    colour: vehicle.colour,
    registration: vehicle.registration,
    vin: vehicle.vin,
    variant: vehicle.derivative || vehicle.trim,
    description: description,
    doors: vehicle.doors,
    engine: `${vehicle.badgeEngineSizeLitres}L`,
    imageUrl: imageUrl,
    images: galleryImages,
    owners: vehicle.owners,
    attentionGrabber: adverts?.retailAdverts?.attentionGrabber,
  };
}

/**
 * Handle STOCK_UPDATE event (vehicle created or updated)
 */
async function handleStockUpdate(webhookEvent: WebhookEvent): Promise<void> {
  const stockId = webhookEvent.data.metadata.stockId;
  const advertiserId = webhookEvent.data.advertiser.advertiserId;
  
  console.log(`Handling STOCK_UPDATE for vehicle ${stockId}`);
  
  // Transform webhook data to API format
  const vehicleData = transformWebhookToApiFormat(webhookEvent);
  
  // Map AutoTrader webhook data to our database schema
  const mappedCar = mapAutoTraderToDatabase(vehicleData, advertiserId);
  
  // Validate
  const validation = validateMappedCar(mappedCar);
  if (!validation.valid) {
    throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
  }
  
  // Check if vehicle already exists
  const { data: existingCar } = await supabase
    .from('cars')
    .select('id, sync_override')
    .eq('autotrader_id', stockId)
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
      
      console.log(`✅ Updated existing vehicle: ${stockId}`);
      await logWebhookEvent('STOCK_UPDATE', stockId, 'success', 'updated');
    } else {
      console.log(`⏭️ Skipped update for ${stockId} - manual override enabled`);
      await logWebhookEvent('STOCK_UPDATE', stockId, 'skipped');
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
    
    console.log(`✅ Inserted new vehicle: ${stockId}`);
    await logWebhookEvent('STOCK_UPDATE', stockId, 'success', 'created');
  }
}

/**
 * Handle STOCK_DELETE event (vehicle removed from forecourt)
 */
async function handleStockDelete(webhookEvent: WebhookEvent): Promise<void> {
  const stockId = webhookEvent.data.metadata.stockId;
  
  console.log(`Handling STOCK_DELETE for vehicle ${stockId}`);
  
  // Check if vehicle exists
  const { data: existingCar } = await supabase
    .from('cars')
    .select('id, sync_override')
    .eq('autotrader_id', stockId)
    .single();
  
  if (!existingCar) {
    console.log(`Vehicle ${stockId} not found in database`);
    await logWebhookEvent('STOCK_DELETE', stockId, 'not_found');
    return;
  }
  
  if (existingCar.sync_override) {
    console.log(`⏭️ Skipped deletion for ${stockId} - manual override enabled`);
    await logWebhookEvent('STOCK_DELETE', stockId, 'skipped');
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
  
  console.log(`✅ Marked vehicle as unavailable: ${stockId}`);
  await logWebhookEvent('STOCK_DELETE', stockId, 'success');
}

/**
 * Log webhook event to database
 */
async function logWebhookEvent(
  eventType: string,
  vehicleId: string,
  status: string,
  action?: string
): Promise<void> {
  try {
    await supabase.from('autotrader_sync_logs').insert([{
      sync_type: 'webhook',
      status: status === 'success' ? 'success' : 'failed',
      cars_added: action === 'created' ? 1 : 0,
      cars_updated: action === 'updated' ? 1 : 0,
      cars_marked_unavailable: eventType === 'STOCK_DELETE' && status === 'success' ? 1 : 0,
      error_message: status === 'not_found' ? `Vehicle ${vehicleId} not found` : null,
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
    'Access-Control-Allow-Methods': 'POST, PUT, OPTIONS',
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
  
  // Only allow POST and PUT requests (AutoTrader sends both)
  if (event.httpMethod !== 'POST' && event.httpMethod !== 'PUT') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed. Use POST or PUT.' }),
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
    
    // Log the raw payload to see what AutoTrader is actually sending
    console.log('📥 RAW WEBHOOK PAYLOAD:', event.body);
    
    const webhookEvent: WebhookEvent = JSON.parse(event.body);
    
    // Log parsed payload structure
    console.log('📦 PARSED PAYLOAD:', JSON.stringify(webhookEvent, null, 2));
    
    // Get webhook signature and secret
    const signature = event.headers['x-autotrader-signature'] || event.headers['X-Autotrader-Signature'];
    const webhookSecret = process.env.AUTOTRADER_WEBHOOK_SECRET;
    
    // Check if we should verify signatures
    // Allow webhooks without signatures if signature is missing (sandbox testing mode)
    if (webhookSecret && signature) {
      // Both secret AND signature present - verify it
      if (!verifyWebhookSignature(event.body, signature, webhookSecret)) {
        console.error('❌ Webhook signature verification FAILED - potential security threat!');
        return {
          statusCode: 403,
          headers,
          body: JSON.stringify({ error: 'Invalid webhook signature' }),
        };
      }
      console.log('✅ Webhook signature verified - request is authentic');
    } else if (webhookSecret && !signature) {
      // Secret configured but no signature received - testing/sandbox mode
      console.warn('⚠️ SANDBOX MODE: Webhook received without signature (AutoTrader may not be sending signatures yet)');
      console.warn('⚠️ Allowing webhook to process for testing - enable signatures in production!');
    } else {
      // No secret configured - full sandbox mode
      console.warn('⚠️ WARNING: AUTOTRADER_WEBHOOK_SECRET not set - webhooks are NOT verified!');
      console.warn('⚠️ This is acceptable for sandbox testing but MUST be configured for production!');
    }
    
    // Identify notification type (AutoTrader Go-Live requirement)
    console.log(`📦 Webhook received: ${webhookEvent.type} (stockId: ${webhookEvent.data?.metadata?.stockId})`);
    
    // Log webhook receipt with changed fields
    if (webhookEvent.changedFields) {
      console.log(`🔄 Changed fields:`, webhookEvent.changedFields.map(f => f.path).join(', '));
    }
    
    // Process webhook based on event type
    switch (webhookEvent.type) {
      case 'STOCK_UPDATE':
        await handleStockUpdate(webhookEvent);
        break;
      
      case 'STOCK_DELETE':
        await handleStockDelete(webhookEvent);
        break;
      
      default:
        console.warn(`Unknown event type: ${webhookEvent.type}`);
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
        message: `Processed ${webhookEvent.type} for vehicle ${webhookEvent.data.metadata.stockId}`,
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
