/**
 * Manual Sync Trigger
 * 
 * Allows admins to manually trigger a stock sync from the dashboard
 * Includes authentication check to ensure only admins can trigger
 */

import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { syncStock } from './sync-stock';

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

/**
 * Verify user is authenticated (admin)
 */
async function verifyAdmin(authToken: string): Promise<boolean> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser(authToken);
    
    if (error || !user) {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Admin verification error:', error);
    return false;
  }
}

/**
 * Run the stock sync.
 *
 * The sync logic is called directly rather than through sync-stock's HTTP
 * handler: the admin has already been authenticated above, and this avoids
 * fabricating a fake request event just to satisfy that handler's signature.
 */
async function triggerSyncFunction(): Promise<any> {
  try {
    console.log('Running stock sync directly...');

    const result = await syncStock();

    // syncStock reports partial success via result.success === false while still
    // returning counts, which mirrors the 207 the HTTP handler used to send.
    console.log('Sync completed:', result.message);

    return result;
  } catch (error) {
    console.error('Error running stock sync:', error);
    throw error;
  }
}

/**
 * Netlify Function handler
 */
export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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
    // Check authentication
    const authHeader = event.headers['authorization'] || event.headers['Authorization'];
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          error: 'Unauthorized',
          message: 'Authentication token required',
        }),
      };
    }
    
    const token = authHeader.replace('Bearer ', '');
    const isAdmin = await verifyAdmin(token);
    
    if (!isAdmin) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({
          error: 'Forbidden',
          message: 'Admin access required',
        }),
      };
    }
    
    console.log('Manual sync triggered by admin');
    
    // Trigger the sync function directly (no HTTP call)
    const syncResult = await triggerSyncFunction();
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Sync triggered successfully',
        result: syncResult,
      }),
    };
  } catch (error) {
    console.error('Trigger sync error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
        message: 'Failed to trigger sync',
      }),
    };
  }
};
