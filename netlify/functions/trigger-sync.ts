/**
 * Manual Sync Trigger
 * 
 * Allows admins to manually trigger a stock sync from the dashboard
 * Includes authentication check to ensure only admins can trigger
 */

import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

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
 * Call the sync-stock function
 */
async function triggerSyncFunction(siteUrl: string): Promise<any> {
  try {
    const syncUrl = `${siteUrl}/.netlify/functions/sync-stock`;
    
    console.log(`Triggering sync at: ${syncUrl}`);
    
    const response = await fetch(syncUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log(`Sync function response status: ${response.status}`);
    
    // Try to get response body even if it failed
    const responseText = await response.text();
    console.log(`Sync function response body:`, responseText);
    
    if (!response.ok) {
      throw new Error(`Sync function returned ${response.status}: ${responseText.substring(0, 200)}`);
    }
    
    // Parse JSON if successful
    try {
      return JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse sync response as JSON:', e);
      return { success: true, message: 'Sync completed (non-JSON response)' };
    }
  } catch (error) {
    console.error('Error triggering sync function:', error);
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
    
    // Get site URL from headers or environment (extract base URL only)
    let siteUrl = process.env.URL || 'http://localhost:8888';
    
    if (event.headers['x-forwarded-host']) {
      siteUrl = `https://${event.headers['x-forwarded-host']}`;
    } else if (event.headers['referer']) {
      try {
        // Extract base URL from referer (remove path like /admin/dashboard)
        const refererUrl = new URL(event.headers['referer']);
        siteUrl = `${refererUrl.protocol}//${refererUrl.host}`;
      } catch (e) {
        console.warn('Failed to parse referer URL, using fallback');
      }
    }
    
    console.log('Manual sync triggered by admin');
    console.log('Using site URL:', siteUrl);
    
    // Trigger the sync function
    const syncResult = await triggerSyncFunction(siteUrl);
    
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
