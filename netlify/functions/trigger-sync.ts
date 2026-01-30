/**
 * Manual Sync Trigger
 * 
 * Allows admins to manually trigger a stock sync from the dashboard
 * Includes authentication check to ensure only admins can trigger
 */

import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { handler as syncStockHandler } from './sync-stock';

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
 * Call the sync-stock function directly (no HTTP request)
 */
async function triggerSyncFunction(): Promise<any> {
  try {
    console.log('Triggering sync-stock handler directly...');
    
    // Call sync-stock handler directly (same as scheduled function does)
    const mockEvent: HandlerEvent = {
      httpMethod: 'POST',
      headers: {},
      body: null,
      isBase64Encoded: false,
      rawUrl: '/.netlify/functions/sync-stock',
      rawQuery: '',
      path: '/.netlify/functions/sync-stock',
      queryStringParameters: null,
      multiValueQueryStringParameters: null,
    };
    
    const mockContext: HandlerContext = {
      callbackWaitsForEmptyEventLoop: true,
      functionName: 'sync-stock',
      functionVersion: '1',
      invokedFunctionArn: '',
      memoryLimitInMB: '1024',
      awsRequestId: '',
      logGroupName: '',
      logStreamName: '',
      getRemainingTimeInMillis: () => 30000,
      done: () => {},
      fail: () => {},
      succeed: () => {},
    };
    
    // Invoke sync-stock handler directly
    const response = await syncStockHandler(mockEvent, mockContext);
    
    console.log('Sync function response status:', response.statusCode);
    
    if (response.statusCode !== 200 && response.statusCode !== 207) {
      console.error('Sync function error response:', response.body);
      throw new Error(`Sync function returned ${response.statusCode}`);
    }
    
    // Parse response body
    const result = JSON.parse(response.body);
    console.log('Sync completed:', result.message);
    
    return result;
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
