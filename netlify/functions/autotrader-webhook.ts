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
    
    // AutoTrader may send signature in format: "t=timestamp,v1=hash"
    // Extract just the hash part if present
    let cleanSignature = signature;
    if (signature.includes('v1=')) {
      const parts = signature.split(',');
      const v1Part = parts.find(p => p.startsWith('v1='));
      if (v1Part) {
        cleanSignature = v1Part.replace('v1=', '');
        console.log('📝 Extracted v1 signature from AutoTrader format');
      }
    }
    
    // Remove "sha256=" prefix if present (some APIs include this)
    cleanSignature = cleanSignature.replace(/^sha256=/, '');
    
    // Compute expected signature using HMAC-SHA256
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload, 'utf8');
    const expectedSignature = hmac.digest('hex');
    
    // Verify signature lengths match
    if (cleanSignature.length !== expectedSignature.length) {
      console.error('❌ Webhook signature length mismatch');
      console.error('Expected length:', expectedSignature.length);
      console.error('Received length:', cleanSignature.length);
      console.error('Raw signature received:', signature.substring(0, 50) + '...');
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
 * Optimized for fast response time (< 1 second)
 */
async function handleStockUpdate(webhookEvent: WebhookEvent): Promise<void> {
  const startTime = Date.now();
  const stockId = webhookEvent.data.metadata.stockId;
  const advertiserId = webhookEvent.data.advertiser.advertiserId;
  const lifecycleState = webhookEvent.data.metadata.lifecycleState;
  
  console.log(`⚡ Handling STOCK_UPDATE for vehicle ${stockId} (lifecycleState: ${lifecycleState})`);
  
  // Check if vehicle is being removed from forecourt (unadvertised)
  // lifecycleState can be: FORECOURT, WITHDRAWN, SOLD, etc.
  const isUnavailable = lifecycleState !== 'FORECOURT';
  
  if (isUnavailable) {
    console.log(`⚠️ Vehicle ${stockId} is no longer on forecourt (${lifecycleState}), marking as unavailable`);
    
    // Quick database query - optimized
    const { data: existingCar } = await supabase
      .from('cars')
      .select('id, sync_override')
      .eq('autotrader_id', stockId)
      .single();
    
    if (existingCar && !existingCar.sync_override) {
      await supabase
        .from('cars')
        .update({
          is_available: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingCar.id);
      
      const duration = Date.now() - startTime;
      console.log(`✅ Marked vehicle as unavailable: ${stockId} (${duration}ms)`);
      await logWebhookEvent('STOCK_UPDATE', stockId, 'success', 'marked_unavailable');
    }
    return;
  }
  
  // Vehicle is on forecourt, proceed with normal update
  // Transform webhook data to API format
  const vehicleData = transformWebhookToApiFormat(webhookEvent);
  
  // Map AutoTrader webhook data to our database schema
  const mappedCar = mapAutoTraderToDatabase(vehicleData, advertiserId);
  
  // Validate
  const validation = validateMappedCar(mappedCar);
  if (!validation.valid) {
    throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
  }
  
  // Check if vehicle already exists - optimized query
  const { data: existingCar } = await supabase
    .from('cars')
    .select('id, sync_override, cover_image_url, gallery_images')
    .eq('autotrader_id', stockId)
    .single();
  
  if (existingCar) {
    // Vehicle exists, update it (unless override is set)
    if (!existingCar.sync_override) {
      // Preserve existing images if webhook images are invalid (QA/sandbox URLs)
      const updateData: any = { ...mappedCar };
      
      // Check if webhook images are from QA/sandbox (m-qa domain)
      const isQaImage = (url: string) => url && url.includes('m-qa.atcdn.co.uk');
      const hasQaImages = isQaImage(mappedCar.cover_image_url) || 
                          mappedCar.gallery_images.some(isQaImage);
      
      // If webhook has QA images and we have existing good images, keep the existing ones
      if (hasQaImages && existingCar.cover_image_url) {
        console.log(`⚠️ Webhook contains QA/sandbox images, preserving existing production images`);
        updateData.cover_image_url = existingCar.cover_image_url;
        updateData.gallery_images = existingCar.gallery_images || [];
      }
      
      await supabase
        .from('cars')
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingCar.id);
      
      const duration = Date.now() - startTime;
      console.log(`✅ Updated existing vehicle: ${stockId} (${duration}ms)`);
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
    
    const duration = Date.now() - startTime;
    console.log(`✅ Inserted new vehicle: ${stockId} (${duration}ms)`);
    await logWebhookEvent('STOCK_UPDATE', stockId, 'success', 'created');
  }
}

/**
 * Handle STOCK_DELETE event (vehicle removed from forecourt)
 * Optimized for fast response time (< 1 second)
 */
async function handleStockDelete(webhookEvent: WebhookEvent): Promise<void> {
  const startTime = Date.now();
  const stockId = webhookEvent.data.metadata.stockId;
  
  console.log(`⚡ Handling STOCK_DELETE for vehicle ${stockId}`);
  
  // Quick database query - optimized
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
  
  const duration = Date.now() - startTime;
  console.log(`✅ Marked vehicle as unavailable: ${stockId} (${duration}ms)`);
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
 * Optimized for AutoTrader Go-Live requirements:
 * - Response time < 1 second
 * - Proper signature verification
 * - Clear error messages
 */
export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  const requestStartTime = Date.now(); // Track total request time
  
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Autotrader-Signature, Autotrader-Signature',
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
    console.log('📥 RAW WEBHOOK PAYLOAD:', event.body.substring(0, 200) + '...');
    
    const webhookEvent: WebhookEvent = JSON.parse(event.body);
    
    // Get webhook signature and secret
    // AutoTrader may send the signature with different casing or formats
    // Check all possible variations to ensure we catch it
    const signature = event.headers['x-autotrader-signature'] || 
                     event.headers['X-Autotrader-Signature'] ||
                     event.headers['autotrader-signature'] ||
                     event.headers['Autotrader-Signature'];
    const webhookSecret = process.env.AUTOTRADER_WEBHOOK_SECRET;
    const allowUnsignedWebhooks = process.env.ALLOW_UNSIGNED_WEBHOOKS === 'true'; // Explicit opt-in for testing
    
    // Debug: Log all header keys to help diagnose signature issues
    console.log('📬 Received headers (keys only):', Object.keys(event.headers || {}));
    if (signature) {
      console.log('✅ Found signature header:', signature.substring(0, 20) + '...');
    } else {
      console.warn('⚠️ No signature header found in:', Object.keys(event.headers || {}));
    }
    
    // PRODUCTION SECURITY: Verify webhook signatures
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
      // Secret configured but no signature received
      if (allowUnsignedWebhooks) {
        // Testing mode explicitly enabled
        console.warn('⚠️ TESTING MODE: Webhook received without signature');
        console.warn('⚠️ ALLOW_UNSIGNED_WEBHOOKS is enabled - this should ONLY be used for testing!');
        console.warn('⚠️ Set ALLOW_UNSIGNED_WEBHOOKS=false for production!');
      } else {
        // PRODUCTION: Reject unsigned webhooks
        console.error('❌ Webhook signature header missing (AUTOTRADER_WEBHOOK_SECRET is set)');
        console.error('❌ For testing: set ALLOW_UNSIGNED_WEBHOOKS=true environment variable');
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ 
            error: 'Webhook signature required',
            message: 'X-Autotrader-Signature header is missing'
          }),
        };
      }
    } else {
      // No secret configured at all
      console.error('❌ AUTOTRADER_WEBHOOK_SECRET environment variable not set!');
      console.error('❌ Webhook cannot be verified - this is a CRITICAL security issue!');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Server configuration error',
          message: 'Webhook secret not configured'
        }),
      };
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
    
    // Calculate and log response time (AutoTrader requirement: < 1 second)
    const responseTime = Date.now() - requestStartTime;
    console.log(`⏱️ Total response time: ${responseTime}ms ${responseTime > 1000 ? '⚠️ SLOW!' : '✅'}`);
    
    // Return success response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: `Processed ${webhookEvent.type} for vehicle ${webhookEvent.data.metadata.stockId}`,
        responseTimeMs: responseTime,
      }),
    };
  } catch (error) {
    const responseTime = Date.now() - requestStartTime;
    console.error('Webhook handler error:', error);
    console.error(`⏱️ Error response time: ${responseTime}ms`);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
        message: 'Internal server error processing webhook',
        responseTimeMs: responseTime,
      }),
    };
  }
};
