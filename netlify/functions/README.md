# Netlify Functions

This directory contains serverless functions for the FNT Motor Group website.

## AutoTrader Integration Functions

### sync-stock.ts
**Purpose:** Main stock synchronization function  
**Trigger:** Scheduled (every 30 minutes) or manual  
**Endpoint:** `/.netlify/functions/sync-stock`

**What it does:**
1. Authenticates with AutoTrader API
2. Fetches all vehicles for advertiser ID 10042804
3. Compares with existing database cars
4. Adds new cars, updates existing ones (unless manually overridden)
5. Marks removed cars as unavailable
6. Logs sync results to database

**Methods:** GET, POST  
**Authentication:** Not required (but should be protected with API key in production)

**Response format:**
```json
{
  "success": true,
  "carsAdded": 5,
  "carsUpdated": 12,
  "carsMarkedUnavailable": 2,
  "duration": 3450,
  "errors": [],
  "message": "Sync completed successfully"
}
```

### autotrader-webhook.ts
**Purpose:** Handle real-time updates from AutoTrader  
**Trigger:** AutoTrader webhook notifications  
**Endpoint:** `/.netlify/functions/autotrader-webhook`

**What it does:**
- Receives webhook notifications from AutoTrader
- Processes vehicle.created, vehicle.updated, vehicle.deleted events
- Updates database in real-time
- Respects manual override flags

**Methods:** POST  
**Authentication:** Webhook signature verification (when implemented)

**Webhook URL to provide to AutoTrader:**
```
https://your-site.netlify.app/.netlify/functions/autotrader-webhook
```

**Event types handled:**
- `vehicle.created` - Fetch and add new vehicle
- `vehicle.updated` - Fetch and update vehicle data
- `vehicle.deleted` - Mark vehicle as unavailable

### trigger-sync.ts
**Purpose:** Manual sync trigger for admins  
**Trigger:** Admin dashboard button  
**Endpoint:** `/.netlify/functions/trigger-sync`

**What it does:**
- Verifies user is authenticated admin
- Triggers the sync-stock function manually
- Returns sync results in real-time

**Methods:** POST  
**Authentication:** Required (Bearer token)

**Request headers:**
```
Authorization: Bearer <supabase-auth-token>
```

## Library Functions

### lib/autotraderClient.ts
AutoTrader API client with OAuth 2.0 authentication, token caching, rate limiting, and retry logic.

### lib/dataMapper.ts
Transforms AutoTrader API responses to FNT database schema with validation and change detection.

## Environment Variables Required

```bash
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# AutoTrader API
AUTOTRADER_ENVIRONMENT=sandbox  # or 'production'
AUTOTRADER_API_KEY=your_api_key
AUTOTRADER_API_SECRET=your_api_secret
AUTOTRADER_ADVERTISER_ID=10042804
```

## Local Development

### Install dependencies:
```bash
npm install
```

### Run Netlify Dev server:
```bash
netlify dev
```

Functions will be available at:
- http://localhost:8888/.netlify/functions/sync-stock
- http://localhost:8888/.netlify/functions/autotrader-webhook
- http://localhost:8888/.netlify/functions/trigger-sync

### Test sync function:
```bash
curl -X POST http://localhost:8888/.netlify/functions/sync-stock
```

## Scheduled Sync Setup

### Option 1: Netlify Scheduled Functions (Pro plan required)
Uncomment in `netlify.toml`:
```toml
[functions."sync-stock"]
  schedule = "*/30 * * * *"  # Every 30 minutes
```

### Option 2: External Cron Service (Free tier)
Use a service like [cron-job.org](https://cron-job.org) or [EasyCron](https://www.easycron.com):

**URL to call:** `https://your-site.netlify.app/.netlify/functions/sync-stock`  
**Method:** POST  
**Interval:** Every 30 minutes

## Webhook Setup

1. Email AutoTrader integration team: `integration.management@autotrader.co.uk`
2. Provide webhook URL: `https://your-site.netlify.app/.netlify/functions/autotrader-webhook`
3. They will configure webhooks on their end
4. Test with AutoTrader's webhook testing tool

## Monitoring

Check sync logs in Supabase:
```sql
SELECT * FROM autotrader_sync_logs ORDER BY created_at DESC LIMIT 20;
```

View function logs in Netlify dashboard:
- Go to Functions tab
- Click on function name
- View logs and invocations

## Error Handling

All functions include:
- Try-catch error handling
- Detailed logging
- Database logging of sync results
- Graceful degradation
- Retry logic for transient failures

## Security

- CORS headers configured
- Admin authentication for trigger-sync
- Webhook signature verification (ready for implementation)
- Environment variables for credentials
- No sensitive data exposed in responses
