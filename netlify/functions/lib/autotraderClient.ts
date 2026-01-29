/**
 * AutoTrader API Client
 * 
 * Handles OAuth 2.0 authentication and API requests to AutoTrader UK API
 * Reference: https://developers.autotrader.co.uk/documentation
 */

interface AutoTraderCredentials {
  key: string;
  secret: string;
  advertiserId: string;
  environment: 'sandbox' | 'production';
}

interface AutoTraderToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  expires_at: number;
}

interface VehicleResponse {
  vehicleId: string;
  advertiserId: string;
  make: string;
  model: string;
  variant?: string;
  year: number;
  price: number;
  mileage: number;
  fuelType: string;
  transmission: string;
  bodyType?: string;
  colour?: string;
  doors?: number;
  engine?: string;
  description?: string;
  images?: string[];
  [key: string]: any;
}

interface StockResponse {
  vehicles: VehicleResponse[];
  totalCount: number;
  [key: string]: any;
}

class AutoTraderClient {
  private credentials: AutoTraderCredentials;
  private token: AutoTraderToken | null = null;
  private baseUrl: string;
  private authUrl: string;
  private maxRetries: number = 3;
  private retryDelay: number = 1000; // ms

  constructor(credentials: AutoTraderCredentials) {
    this.credentials = credentials;
    
    // Set API endpoints based on environment
    // Reference: https://developers.autotrader.co.uk/documentation#authentication
    if (credentials.environment === 'sandbox') {
      this.baseUrl = 'https://api-sandbox.autotrader.co.uk';
      console.log('Using sandbox mode with credentials:', credentials.key);
    } else {
      this.baseUrl = 'https://api.autotrader.co.uk';
    }
    
    // Authentication endpoint is part of the API base URL
    this.authUrl = `${this.baseUrl}/authenticate`;
    
    console.log('AutoTrader Client initialized:', {
      environment: credentials.environment,
      baseUrl: this.baseUrl,
      authUrl: this.authUrl,
    });
  }

  /**
   * Authenticate with AutoTrader API using OAuth 2.0 Client Credentials flow
   * Reference: https://developers.autotrader.co.uk/documentation#authentication
   */
  async authenticate(): Promise<string> {
    // Check if we have a valid cached token
    if (this.token && this.isTokenValid()) {
      return this.token.access_token;
    }

    try {
      console.log('Authenticating with AutoTrader...');
      console.log('Auth URL:', this.authUrl);
      
      // AutoTrader expects key and secret as form parameters, not Basic Auth
      // Reference: Error message from API - "Expected x-www-form-urlencoded POST to /authenticate with key and secret"
      const formBody = `key=${encodeURIComponent(this.credentials.key)}&secret=${encodeURIComponent(this.credentials.secret)}`;
      
      console.log('Sending authentication request with key:', this.credentials.key);
      
      const response = await fetch(this.authUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formBody,
      });

      console.log('Authentication response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Authentication failed:', response.status, errorText);
        throw new Error(`Authentication failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Authentication response received:', { hasAccessToken: !!data.access_token, expiresIn: data.expires_in });
      
      // Cache token with expiration time
      this.token = {
        access_token: data.access_token,
        token_type: data.token_type || 'Bearer',
        expires_in: data.expires_in || 3600,
        expires_at: Date.now() + ((data.expires_in || 3600) * 1000),
      };

      console.log('AutoTrader authentication successful. Token expires in', this.token.expires_in, 'seconds');
      return this.token.access_token;
    } catch (error) {
      console.error('AutoTrader authentication error:', error);
      throw new Error(`Failed to authenticate with AutoTrader: ${error.message}`);
    }
  }

  /**
   * Check if current token is still valid (with 5-minute buffer)
   */
  private isTokenValid(): boolean {
    if (!this.token) return false;
    const bufferTime = 5 * 60 * 1000; // 5 minutes
    return Date.now() < (this.token.expires_at - bufferTime);
  }

  /**
   * Make authenticated API request with retry logic
   */
  private async makeRequest(
    endpoint: string,
    method: string = 'GET',
    body?: any,
    retryCount: number = 0
  ): Promise<any> {
    try {
      // Ensure we have a valid token
      const token = await this.authenticate();

      const options: RequestInit = {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      };

      if (body && method !== 'GET') {
        options.body = JSON.stringify(body);
      }

      const fullUrl = `${this.baseUrl}${endpoint}`;
      console.log(`Making ${method} request to: ${fullUrl}`);
      
      const response = await fetch(fullUrl, options);
      console.log(`Response status: ${response.status} ${response.statusText}`);

      // Handle rate limiting (429 Too Many Requests)
      if (response.status === 429) {
        if (retryCount < this.maxRetries) {
          const retryAfter = response.headers.get('Retry-After');
          const delay = retryAfter ? parseInt(retryAfter) * 1000 : this.retryDelay * (retryCount + 1);
          
          console.log(`Rate limited. Retrying after ${delay}ms...`);
          await this.sleep(delay);
          return this.makeRequest(endpoint, method, body, retryCount + 1);
        }
        throw new Error('Rate limit exceeded. Max retries reached.');
      }

      // Handle unauthorized (token might have expired)
      if (response.status === 401) {
        if (retryCount < this.maxRetries) {
          console.log('Token expired. Re-authenticating...');
          this.token = null; // Clear cached token
          return this.makeRequest(endpoint, method, body, retryCount + 1);
        }
        throw new Error('Unauthorized. Authentication failed after retries.');
      }

      // Handle other errors with detailed logging
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API request failed for ${fullUrl}:`, {
          status: response.status,
          statusText: response.statusText,
          errorBody: errorText
        });
        throw new Error(`API request failed: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request error for ${endpoint}:`, error);
      
      // Retry on network errors
      if (retryCount < this.maxRetries && error.name === 'FetchError') {
        console.log(`Network error. Retrying (${retryCount + 1}/${this.maxRetries})...`);
        await this.sleep(this.retryDelay * (retryCount + 1));
        return this.makeRequest(endpoint, method, body, retryCount + 1);
      }
      
      throw error;
    }
  }

  /**
   * Get all vehicles for the advertiser
   * Reference: https://developers.autotrader.co.uk/api
   */
  async getAdvertiserStock(advertiserId?: string): Promise<StockResponse> {
    const id = advertiserId || this.credentials.advertiserId;
    
    try {
      console.log(`Fetching stock for advertiser ${id}...`);
      
      // Try the /stock endpoint - AutoTrader's sandbox might use this
      // The advertiser ID might be determined by authentication credentials
      const endpoint = `/stock`;
      console.log(`Calling stock endpoint: ${this.baseUrl}${endpoint}`);
      
      const response = await this.makeRequest(endpoint);
      
      console.log(`Stock API response:`, {
        hasVehicles: !!response.vehicles,
        vehicleCount: response.vehicles?.length || 0,
        totalCount: response.totalCount,
        responseKeys: Object.keys(response || {})
      });
      
      // Handle different response structures
      if (response.vehicles && Array.isArray(response.vehicles)) {
        console.log(`Successfully fetched ${response.vehicles.length} vehicles`);
        return response;
      }
      
      // If response structure is different, try to adapt it
      if (Array.isArray(response)) {
        console.log(`Response is array of ${response.length} vehicles`);
        return { vehicles: response, totalCount: response.length };
      }
      
      console.warn('Unexpected response structure from stock API:', response);
      return { vehicles: [], totalCount: 0 };
    } catch (error) {
      console.error(`Failed to fetch advertiser stock:`, error);
      throw new Error(`Failed to get advertiser stock: ${error.message}`);
    }
  }

  /**
   * Get details for a specific vehicle
   */
  async getVehicle(vehicleId: string): Promise<VehicleResponse> {
    try {
      console.log(`Fetching vehicle ${vehicleId}...`);
      const response = await this.makeRequest(`/stock/vehicle/${vehicleId}`);
      
      console.log(`Successfully fetched vehicle ${vehicleId}`);
      return response;
    } catch (error) {
      console.error(`Failed to fetch vehicle ${vehicleId}:`, error);
      throw new Error(`Failed to get vehicle details: ${error.message}`);
    }
  }

  /**
   * Test API connection and authentication
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.authenticate();
      console.log('AutoTrader API connection test successful');
      return true;
    } catch (error) {
      console.error('AutoTrader API connection test failed:', error);
      return false;
    }
  }

  /**
   * Sleep helper for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current token info (for debugging)
   */
  getTokenInfo(): { isValid: boolean; expiresAt?: Date } {
    if (!this.token) {
      return { isValid: false };
    }
    return {
      isValid: this.isTokenValid(),
      expiresAt: new Date(this.token.expires_at),
    };
  }
}

/**
 * Factory function to create AutoTrader client from environment variables
 */
export function createAutoTraderClient(): AutoTraderClient {
  const credentials: AutoTraderCredentials = {
    key: process.env.AUTOTRADER_API_KEY || '',
    secret: process.env.AUTOTRADER_API_SECRET || '',
    advertiserId: process.env.AUTOTRADER_ADVERTISER_ID || '',
    environment: (process.env.AUTOTRADER_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
  };

  // Validate credentials
  if (!credentials.key || !credentials.secret || !credentials.advertiserId) {
    throw new Error('Missing required AutoTrader credentials in environment variables');
  }

  return new AutoTraderClient(credentials);
}

export default AutoTraderClient;
export type { AutoTraderCredentials, VehicleResponse, StockResponse };
