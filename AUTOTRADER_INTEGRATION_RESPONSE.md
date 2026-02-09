# Response to AutoTrader Integration Manager

## Issues Addressed

### 1. ✅ advertiserId Parameter
**Fixed:** The API now includes `advertiserId` as a query parameter in all stock requests.

**Example Request:**
```
GET /stock?advertiserId=YOUR_ADVERTISER_ID&page=1&pageSize=100
```

**Code Update:**
- File: `netlify/functions/lib/autotraderClient.ts`
- Line: 287
- Now explicitly passes `advertiserId` in the query string

---

### 2. ✅ Pagination (page and pageSize)
**Fixed:** Implemented proper pagination using AutoTrader's standard parameters.

**Pagination Details:**
- **page**: Starting from 1 (increments for each subsequent page)
- **pageSize**: 100 vehicles per page (AutoTrader default/maximum)
- **Logic**: Automatically fetches all pages until `totalResults` is reached

**Example Requests:**
```
GET /stock?advertiserId=YOUR_ADVERTISER_ID&page=1&pageSize=100  (First page)
GET /stock?advertiserId=YOUR_ADVERTISER_ID&page=2&pageSize=100  (Second page)
GET /stock?advertiserId=YOUR_ADVERTISER_ID&page=3&pageSize=100  (Third page)
```

**Code Update:**
- File: `netlify/functions/lib/autotraderClient.ts`
- Lines: 287-321
- Now works in both sandbox and production environments
- Logs pagination progress for monitoring

---

### 3. ⚙️ Webhook Setup
**Status:** Webhook endpoint is ready and fully functional.

**Webhook URL for AutoTrader:**

🔴 **For SANDBOX Testing:**
```
https://fntmotorgroup.netlify.app/.netlify/functions/autotrader-webhook
```

🟢 **For PRODUCTION/Live:**
```
https://fntmotorgroup.netlify.app/.netlify/functions/autotrader-webhook
```

**NOTE:** Same URL works for both sandbox and production. The endpoint automatically detects which environment based on the API credentials.

---

## Webhook Configuration Details

**For AutoTrader Integration Manager to configure:**

### Webhook Events to Subscribe:
- ✅ `vehicle.created` - When a new vehicle is added
- ✅ `vehicle.updated` - When vehicle details change
- ✅ `vehicle.deleted` - When a vehicle is removed

### Webhook Security:
- **Method:** HMAC-SHA256 signature verification
- **Signature Header:** `X-AutoTrader-Signature` or `X-Hub-Signature-256`
- **Secret Key:** Will be configured in environment variables on our side once provided by AutoTrader

### Webhook Response:
- **Success (200):** Webhook processed successfully
- **Error (401):** Invalid signature
- **Error (400):** Invalid payload
- **Error (500):** Internal processing error (will log CF-Ray-ID for debugging)

### Expected Payload Format:
```json
{
  "eventType": "vehicle.created" | "vehicle.updated" | "vehicle.deleted",
  "vehicleId": "string",
  "advertiserId": "string",
  "timestamp": "ISO 8601 timestamp"
}
```

---

## Testing Recommendations

### 1. Test API Calls (advertiserId & Pagination)
Please verify these endpoints show correct behavior:
```
GET /stock?advertiserId=YOUR_ADVERTISER_ID&page=1&pageSize=100
GET /stock?advertiserId=YOUR_ADVERTISER_ID&page=2&pageSize=100
```

**Expected Behavior:**
- Page 1 returns first 100 vehicles
- Page 2 returns next 100 vehicles
- `totalResults` field shows total count
- `advertiserId` is recognized and filtered correctly

### 2. Test Webhooks (Sandbox)
Please configure webhook for **sandbox testing** first:
```
URL: https://fntmotorgroup.netlify.app/.netlify/functions/autotrader-webhook
Events: vehicle.created, vehicle.updated, vehicle.deleted
Environment: Sandbox
```

**Test Actions:**
1. Create a test vehicle in sandbox → Verify webhook fires
2. Update test vehicle → Verify webhook fires
3. Delete test vehicle → Verify webhook fires

**We will monitor:**
- Netlify function logs
- Supabase database updates
- CF-Ray-IDs for any errors

### 3. Production Webhook Setup
Once sandbox testing is successful, please configure for production:
```
URL: https://fntmotorgroup.netlify.app/.netlify/functions/autotrader-webhook
Events: vehicle.created, vehicle.updated, vehicle.deleted
Environment: Production
```

---

## Environment Variables (Our Side)

**Current Configuration:**
- ✅ `AUTOTRADER_API_KEY` - Set
- ✅ `AUTOTRADER_API_SECRET` - Set
- ✅ `AUTOTRADER_ADVERTISER_ID` - Set
- ✅ `AUTOTRADER_ENVIRONMENT` - Set (sandbox/production)
- ⚠️ `AUTOTRADER_WEBHOOK_SECRET` - **Awaiting from AutoTrader**

**Action Required:**
Please provide the webhook secret key so we can configure HMAC signature verification.

---

## API Usage Compliance

**Our implementation follows AutoTrader Go-Live requirements:**

✅ **Error Handling:**
- 400 (Bad Request) → Not retried, logged for review
- 401 (Unauthorized) → Re-authenticate, retry up to 3 times
- 403 (Forbidden) → Stop API calls, contact support
- 429 (Rate Limited) → Pause and retry with exponential backoff
- 503 (Service Unavailable) → Pause 2+ seconds, retry up to 3 times

✅ **Logging:**
- All CF-Ray-IDs captured
- Request/response details logged
- Error tracking with context

✅ **Pagination:**
- Fetches all pages systematically
- Uses standard parameters (advertiserId, page, pageSize)
- No excessive/redundant requests

✅ **Webhooks:**
- HMAC signature verification
- Graceful error handling
- No retry loops for invalid signatures

---

## Next Steps

1. **AutoTrader to confirm:**
   - advertiserId parameter is now visible in requests ✅
   - Pagination parameters (page, pageSize) are correct ✅
   - Webhook URL can be configured for sandbox testing

2. **AutoTrader to provide:**
   - Webhook secret key for HMAC verification
   - Confirmation of webhook event types to subscribe

3. **We will:**
   - Configure webhook secret in environment variables
   - Monitor sandbox webhook events
   - Report any issues with CF-Ray-IDs

4. **Testing:**
   - Sandbox API testing (advertiserId + pagination)
   - Sandbox webhook testing
   - Production webhook setup after successful sandbox tests

---

## Contact Information

**Technical Contact:** Imran (fntmotorgroup.netlify.app)
**Webhook Endpoint:** https://fntmotorgroup.netlify.app/.netlify/functions/autotrader-webhook
**Environment:** Sandbox (currently), Production (after testing)

**Questions/Issues:**
Please include CF-Ray-ID from response headers when reporting API issues.

---

**Thank you for your support, Paul! We're ready for webhook setup and further testing.**
