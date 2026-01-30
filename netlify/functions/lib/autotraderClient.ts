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
      
      // Capture CF-Ray-ID for error tracking (AutoTrader Go-Live requirement)
      const cfRayId = response.headers.get('CF-RAY') || response.headers.get('cf-ray');
      if (cfRayId) {
        console.log(`CF-Ray-ID: ${cfRayId}`);
      }

      // Handle 400 Bad Request - DO NOT RETRY (AutoTrader Go-Live requirement)
      if (response.status === 400) {
        const errorText = await response.text();
        const cfRayId = response.headers.get('CF-RAY') || response.headers.get('cf-ray') || 'N/A';
        console.error(`❌ 400 Bad Request - Invalid input (CF-Ray-ID: ${cfRayId}):`, errorText);
        console.error('⚠️ This request will NOT be retried - check input parameters');
        throw new Error(`Bad Request (400): ${errorText} [CF-Ray-ID: ${cfRayId}]`);
      }

      // Handle 401 Unauthorized - Stop all API activity and re-authenticate (AutoTrader Go-Live requirement)
      if (response.status === 401) {
        const cfRayId = response.headers.get('CF-RAY') || response.headers.get('cf-ray') || 'N/A';
        if (retryCount < this.maxRetries) {
          console.log(`🔐 401 Unauthorized - Token expired (CF-Ray-ID: ${cfRayId}). Re-authenticating...`);
          this.token = null; // Clear cached token
          return this.makeRequest(endpoint, method, body, retryCount + 1);
        }
        console.error(`❌ 401 Unauthorized after ${this.maxRetries} retries (CF-Ray-ID: ${cfRayId})`);
        throw new Error(`Unauthorized (401): Authentication failed after retries [CF-Ray-ID: ${cfRayId}]`);
      }

      // Handle 403 Forbidden - Stop API activity for this advertiser (AutoTrader Go-Live requirement)
      if (response.status === 403) {
        const errorText = await response.text();
        const cfRayId = response.headers.get('CF-RAY') || response.headers.get('cf-ray') || 'N/A';
        console.error(`❌ 403 Forbidden (CF-Ray-ID: ${cfRayId}):`, errorText);
        console.error('⚠️ CRITICAL: This advertiser may not have access to this service or is not on your integration');
        console.error('⚠️ API activity for this advertiser should be stopped. Contact AutoTrader support.');
        
        // Don't retry 403 errors - they indicate a permission/configuration issue
        throw new Error(`Forbidden (403): Access denied - contact AutoTrader support [CF-Ray-ID: ${cfRayId}] - ${errorText}`);
      }

      // Handle 429 Too Many Requests - Pause and retry (AutoTrader Go-Live requirement)
      if (response.status === 429) {
        const cfRayId = response.headers.get('CF-RAY') || response.headers.get('cf-ray') || 'N/A';
        if (retryCount < this.maxRetries) {
          const retryAfter = response.headers.get('Retry-After');
          const delay = retryAfter ? parseInt(retryAfter) * 1000 : this.retryDelay * (retryCount + 1);
          
          console.log(`⏸️ 429 Rate Limited (CF-Ray-ID: ${cfRayId}). Pausing for ${delay}ms before retry...`);
          await this.sleep(delay);
          return this.makeRequest(endpoint, method, body, retryCount + 1);
        }
        console.error(`❌ 429 Rate limit exceeded after ${this.maxRetries} retries (CF-Ray-ID: ${cfRayId})`);
        throw new Error(`Rate limit exceeded (429): Max retries reached [CF-Ray-ID: ${cfRayId}]`);
      }

      // Handle 503 Service Unavailable - Pause for at least 2 seconds (AutoTrader Go-Live requirement)
      if (response.status === 503) {
        const cfRayId = response.headers.get('CF-RAY') || response.headers.get('cf-ray') || 'N/A';
        if (retryCount < this.maxRetries) {
          const delay = Math.max(2000, this.retryDelay * (retryCount + 1)); // At least 2 seconds
          console.log(`⏸️ 503 Service Unavailable (CF-Ray-ID: ${cfRayId}). Pausing for ${delay}ms before retry...`);
          await this.sleep(delay);
          return this.makeRequest(endpoint, method, body, retryCount + 1);
        }
        console.error(`❌ 503 Service Unavailable after ${this.maxRetries} retries (CF-Ray-ID: ${cfRayId})`);
        throw new Error(`Service Unavailable (503): AutoTrader API temporarily unavailable [CF-Ray-ID: ${cfRayId}]`);
      }

      // Handle other errors with detailed logging and CF-Ray-ID
      if (!response.ok) {
        const errorText = await response.text();
        const cfRayId = response.headers.get('CF-RAY') || response.headers.get('cf-ray') || 'N/A';
        console.error(`❌ API request failed for ${fullUrl} (CF-Ray-ID: ${cfRayId}):`, {
          status: response.status,
          statusText: response.statusText,
          errorBody: errorText,
          cfRayId: cfRayId
        });
        throw new Error(`API request failed (${response.status}): ${errorText} [CF-Ray-ID: ${cfRayId}]`);
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
   * Get all vehicles for the advertiser (with pagination support)
   * Reference: https://developers.autotrader.co.uk/api
   */
  async getAdvertiserStock(advertiserId?: string): Promise<StockResponse> {
    const id = advertiserId || this.credentials.advertiserId;
    
    try {
      console.log(`Fetching stock for advertiser ${id}...`);
      
      // Fetch first page
      const endpoint = `/stock`;
      console.log(`Calling stock endpoint: ${this.baseUrl}${endpoint}`);
      
      const firstPageResponse = await this.makeRequest(endpoint);
      
      console.log(`Stock API response:`, {
        hasResults: !!firstPageResponse.results,
        resultsCount: firstPageResponse.results?.length || 0,
        totalResults: firstPageResponse.totalResults,
        responseKeys: Object.keys(firstPageResponse || {})
      });
      
      // Check if pagination is needed
      let allResults = firstPageResponse.results || [];
      const totalResults = firstPageResponse.totalResults || 0;
      const resultsPerPage = firstPageResponse.results?.length || 20;
      
      // If there are more results than what we got, fetch additional pages
      if (totalResults > resultsPerPage && this.credentials.environment === 'production') {
        console.log(`📄 Pagination detected: ${resultsPerPage} results per page, ${totalResults} total`);
        console.log(`📄 Need to fetch ${Math.ceil(totalResults / resultsPerPage) - 1} more page(s)`);
        
        const totalPages = Math.ceil(totalResults / resultsPerPage);
        
        // Fetch remaining pages (start from page 2)
        for (let page = 2; page <= totalPages; page++) {
          try {
            console.log(`📄 Fetching page ${page} of ${totalPages}...`);
            
            // Try different pagination parameter formats (AutoTrader might use any of these)
            let nextPageResponse;
            try {
              // Try page parameter
              nextPageResponse = await this.makeRequest(`${endpoint}?page=${page}`);
            } catch (error) {
              // Try offset/limit parameters
              const offset = (page - 1) * resultsPerPage;
              nextPageResponse = await this.makeRequest(`${endpoint}?limit=${resultsPerPage}&offset=${offset}`);
            }
            
            if (nextPageResponse.results && Array.isArray(nextPageResponse.results)) {
              allResults = allResults.concat(nextPageResponse.results);
              console.log(`📄 Page ${page} fetched: ${nextPageResponse.results.length} vehicles (total: ${allResults.length})`);
            } else {
              console.warn(`⚠️ Page ${page} returned no results, stopping pagination`);
              break;
            }
          } catch (pageError) {
            console.error(`❌ Failed to fetch page ${page}:`, pageError.message);
            console.warn(`⚠️ Continuing with ${allResults.length} vehicles from ${page - 1} page(s)`);
            break;
          }
        }
        
        console.log(`✅ Pagination complete: Fetched ${allResults.length} of ${totalResults} total vehicles`);
      } else if (totalResults > resultsPerPage && this.credentials.environment === 'sandbox') {
        console.warn(`⚠️ SANDBOX MODE: Pagination skipped (sandbox may not support it)`);
        console.warn(`⚠️ Fetched ${resultsPerPage} vehicles, but ${totalResults} are available`);
        console.warn(`⚠️ In production, all ${totalResults} vehicles will be synced`);
      }
      
      // AutoTrader returns { results: [...], totalResults: N }
      // Each result has nested structure: { vehicle: {...}, advertiser: {...}, media: {...}, ... }
      if (allResults && Array.isArray(allResults)) {
        console.log(`Successfully fetched ${allResults.length} vehicles from AutoTrader`);
        
        // Log first vehicle structure to understand the data format
        if (allResults.length > 0) {
          const firstResult = allResults[0];
          console.log('First vehicle structure:', {
            resultKeys: Object.keys(firstResult),
            vehicleKeys: Object.keys(firstResult.vehicle || {}),
            metadataKeys: Object.keys(firstResult.metadata || {}),
            advertsKeys: Object.keys(firstResult.adverts || {}),
            hasStockId: !!firstResult.metadata?.stockId,
            hasExternalStockId: !!firstResult.metadata?.externalStockId,
            hasRegistration: !!firstResult.vehicle?.registration,
            hasVIN: !!firstResult.vehicle?.vin,
            sampleStockId: firstResult.metadata?.stockId,
            sampleExternalStockId: firstResult.metadata?.externalStockId,
            sampleRegistration: firstResult.vehicle?.registration,
            sampleVIN: firstResult.vehicle?.vin,
          });
          
          // Log description-related fields to debug
          const desc2 = firstResult.adverts?.retailAdverts?.description2;
          console.log('📝 Description debugging:', {
            'adverts.description': firstResult.adverts?.description,
            'retailAdverts.description2 length': desc2?.length,
            'retailAdverts.description2 preview': desc2?.substring(0, 100),
            'Has \\n line breaks?': desc2?.includes('\n'),
            'Has \\r\\n line breaks?': desc2?.includes('\r\n'),
            'retailAdverts.attentionGrabber': firstResult.adverts?.retailAdverts?.attentionGrabber,
          });
        }
        
        // Transform AutoTrader's nested structure to our flat vehicle structure
        const vehicles = allResults.map((result: any, index: number) => {
          const vehicle = result.vehicle || {};
          const media = result.media || {};
          const adverts = result.adverts || {};
          const metadata = result.metadata || {};
          const pricing = adverts.forecourtPrice || {};
          
          // Try multiple possible ID fields (AutoTrader uses stockId)
          const vehicleId = metadata.stockId ||           // ← Primary ID from logs!
                           metadata.externalStockId ||    // ← Alternative
                           vehicle.registration ||        // ← Registration number
                           vehicle.vin ||                 // ← VIN number
                           `AT-${id}-${index}`;           // ← Fallback
          
          if (index === 0) {
            console.log('First vehicle ID extraction:', {
              vehicleId,
              stockId: metadata.stockId,
              externalStockId: metadata.externalStockId,
              registration: vehicle.registration,
              vin: vehicle.vin,
            });
          }
          
          // Extract fields using AutoTrader's actual field names
          const mileage = vehicle.odometerReadingMiles || 0;
          const transmission = vehicle.transmissionType || vehicle.transmission || 'Manual'; // Fallback to Manual
          const engineSize = vehicle.badgeEngineSizeLitres || 
                           (vehicle.engineCapacityCC ? (vehicle.engineCapacityCC / 1000).toFixed(1) : null);
          // Ensure year is an INTEGER (database constraint requires it)
          const yearRaw = vehicle.yearOfManufacture || vehicle.year || new Date().getFullYear();
          const year = typeof yearRaw === 'string' ? parseInt(yearRaw, 10) : yearRaw;
          
          if (index === 0) {
            console.log('First vehicle field extraction:', {
              mileage,
              transmission,
              engineSize,
              year,
              doors: vehicle.doors,
              rawTransmission: vehicle.transmissionType,
              rawMileage: vehicle.odometerReadingMiles,
            });
          }
          
          return {
            // Core vehicle data
            vehicleId,
            advertiserId: id,
            make: vehicle.make || 'Unknown',
            model: vehicle.model || 'Unknown',
            variant: vehicle.derivative || '',
            year,
            
            // Pricing
            price: pricing.amountGBP || 0,
            
            // Technical specs
            mileage,
            fuelType: vehicle.fuelType || 'Petrol', // Fallback to Petrol instead of Unknown
            transmission,
            bodyType: vehicle.bodyType || '',
            colour: vehicle.colour || 'Black', // Fallback to Black instead of Unknown
            doors: vehicle.doors || null,
            engine: engineSize ? `${engineSize}L` : null,
            
            // Description - AutoTrader stores it in retailAdverts.description2!
            description: (() => {
              // Get the main description
              let mainDesc = adverts.retailAdverts?.description2 ||
                            adverts.retailAdverts?.description || 
                            adverts.description || 
                            adverts.advert?.description || 
                            adverts.advertDescription ||
                            adverts.forecourtAdvert?.description ||
                            vehicle.description ||
                            `${vehicle.make} ${vehicle.model} available`;
              
              // AutoTrader sends descriptions without line breaks - add intelligent formatting
              if (mainDesc && !mainDesc.includes('\n')) {
                // Protect compound words that should NEVER be split
                const protectedTerms = ['xDrive', 'CarPlay', 'AppleCarPlay', 'AndroidAuto', 'iPhone', 'iPad', 'Android Auto'];
                const placeholders: { [key: string]: string } = {};
                protectedTerms.forEach((term, index) => {
                  const placeholder = `__PROTECTED_${index}__`;
                  mainDesc = mainDesc.replace(new RegExp(term, 'gi'), placeholder);
                  placeholders[placeholder] = term;
                });
                
                // CONSERVATIVE APPROACH: Only fix OBVIOUS missing spaces/line breaks
                
                // 1. Fix period with NO space before next sentence: "Miles.Options" → "Miles.\n\nOptions"
                mainDesc = mainDesc.replace(/([.!])([A-Z])/g, '$1\n\n$2');
                
                // 2. Fix section headers that are concatenated: "AutoPlease" → "Auto\n\nPlease"  
                //    Only when it's clearly two complete words (4+ letters each, ending/starting with specific patterns)
                mainDesc = mainDesc.replace(/([a-z]{4,})(Please|Note|Options|Features|Extras|Specification|Contact)/g, '$1\n\n$2');
                
                // 3. Fix "Options:" or similar with NO space before it
                mainDesc = mainDesc.replace(/([a-z])(Options:|Features:|Extras:|Specification:)/gi, '$1\n\n$2');
                
                // 4. Add line break AFTER "Options:" when followed immediately by a dash
                mainDesc = mainDesc.replace(/(Options|Features|Extras|Specification):\s*-/gi, '$1: \n-');
                
                // 5. Fix bullet points: dash with no line break before it
                //    "-360 Cameras-Bang" → "-360 Cameras\n-Bang"
                //    Look for: letter/digit followed by dash followed by letter/digit
                mainDesc = mainDesc.replace(/([a-zA-Z0-9])(-[A-Z0-9])/g, '$1\n$2');
                
                // 6. Clean up: ensure spaces after dashes for bullet points
                mainDesc = mainDesc.replace(/\n-([A-Z0-9])/g, '\n- $1');
                
                // 7. Fix concatenated complete words ONLY when both are 4+ letters
                //    "HistoryNew", "ServiceFull", etc. BUT NOT "A4", "35", "2.0"
                //    Very conservative: both words must be real words (4+ consecutive letters)
                mainDesc = mainDesc.replace(/([a-z]{4,})([A-Z][a-z]{3,})/g, '$1\n$2');
                
                // 8. Clean up multiple line breaks (max 2 consecutive)
                mainDesc = mainDesc.replace(/\n{3,}/g, '\n\n');
                
                // 9. Remove trailing spaces from lines
                mainDesc = mainDesc.replace(/ +\n/g, '\n');
                
                // 10. Restore protected terms
                Object.keys(placeholders).forEach(placeholder => {
                  mainDesc = mainDesc.replace(new RegExp(placeholder, 'g'), placeholders[placeholder]);
                });
                
                mainDesc = mainDesc.trim();
              }
              
              // Get the attention grabber (headline/key features)
              const attentionGrabber = adverts.retailAdverts?.attentionGrabber;
              
              // If we have an attention grabber, prepend it as a bold headline
              if (attentionGrabber && attentionGrabber.trim() !== '') {
                return `✨ ${attentionGrabber}\n\n${mainDesc}`;
              }
              
              return mainDesc;
            })(),
            
            // Images - AutoTrader provides images in media object
            images: media.images?.map((img: any) => img.href || img.url) || [],
            
            // Keep full AutoTrader data for reference
            autotraderData: result,
          };
        });
        
        return { 
          vehicles, 
          totalCount: totalResults || vehicles.length 
        };
      }
      
      // Fallback for unexpected structures
      if (Array.isArray(firstPageResponse)) {
        console.log(`Response is array of ${firstPageResponse.length} items`);
        return { vehicles: firstPageResponse, totalCount: firstPageResponse.length };
      }
      
      console.warn('Unexpected response structure from stock API:', firstPageResponse);
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
