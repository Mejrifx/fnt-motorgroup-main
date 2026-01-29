# 🔒 Webhook Signature Verification - Security Fix

**Priority:** 🔴 **CRITICAL** - Must implement before production!

---

## ⚠️ The Problem

Current webhook handler accepts **ANY** POST request without verifying it's actually from AutoTrader.

**Security Risk:**
- Attackers could send fake webhook events
- Your inventory could be manipulated
- Cars could be marked unavailable
- Fake cars could be inserted

---

## ✅ The Solution

Implement HMAC-SHA256 signature verification (industry standard).

AutoTrader signs each webhook with a secret key. We verify the signature to ensure the webhook is genuine.

---

## 🛠️ Implementation

### **Step 1: Update webhook handler**

**File:** `netlify/functions/autotrader-webhook.ts`

Replace the `verifyWebhookSignature` function (lines 37-41) with this secure implementation:

```typescript
import { createHmac } from 'crypto';

/**
 * Verify webhook signature using HMAC-SHA256
 * AutoTrader signs webhooks with a shared secret key
 * Reference: https://developers.autotrader.co.uk/webhooks (check actual docs)
 */
function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  try {
    // If no signature provided, reject
    if (!signature || !secret) {
      console.error('Webhook signature or secret is missing');
      return false;
    }
    
    // Remove "sha256=" prefix if present (some APIs include this)
    const cleanSignature = signature.replace(/^sha256=/, '');
    
    // Compute expected signature
    const hmac = createHmac('sha256', secret);
    hmac.update(payload, 'utf8');
    const expectedSignature = hmac.digest('hex');
    
    // Compare signatures (constant-time comparison to prevent timing attacks)
    if (cleanSignature.length !== expectedSignature.length) {
      console.error('Webhook signature length mismatch');
      return false;
    }
    
    // Constant-time comparison using timingSafeEqual
    const signatureBuffer = Buffer.from(cleanSignature, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    
    if (signatureBuffer.length !== expectedBuffer.length) {
      return false;
    }
    
    const isValid = crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
    
    if (!isValid) {
      console.error('Webhook signature verification failed');
      console.error('Expected:', expectedSignature);
      console.error('Received:', cleanSignature);
    }
    
    return isValid;
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}
```

---

### **Step 2: Update the handler to use the secret**

Find this code in the handler (around line 255):

```typescript
// OLD CODE (INSECURE):
const signature = event.headers['x-autotrader-signature'] || event.headers['X-Autotrader-Signature'];
if (signature && !verifyWebhookSignature(event.body, signature)) {
  console.warn('Invalid webhook signature');
  return {
    statusCode: 401,
    headers,
    body: JSON.stringify({ error: 'Invalid signature' }),
  };
}
```

Replace with:

```typescript
// NEW CODE (SECURE):
const signature = event.headers['x-autotrader-signature'] || event.headers['X-Autotrader-Signature'];
const webhookSecret = process.env.AUTOTRADER_WEBHOOK_SECRET;

// Reject if signature is missing (AutoTrader should always include it)
if (!signature) {
  console.error('Webhook signature header missing');
  return {
    statusCode: 401,
    headers,
    body: JSON.stringify({ error: 'Missing webhook signature' }),
  };
}

// Reject if webhook secret is not configured
if (!webhookSecret) {
  console.error('AUTOTRADER_WEBHOOK_SECRET environment variable not set');
  return {
    statusCode: 500,
    headers,
    body: JSON.stringify({ error: 'Webhook secret not configured' }),
  };
}

// Verify signature
if (!verifyWebhookSignature(event.body, signature, webhookSecret)) {
  console.error('Webhook signature verification failed');
  return {
    statusCode: 401,
    headers,
    body: JSON.stringify({ error: 'Invalid webhook signature' }),
  };
}

console.log('✅ Webhook signature verified successfully');
```

---

### **Step 3: Add environment variable**

**When AutoTrader provides your webhook secret:**

1. Go to Netlify Dashboard
2. Site Settings → Environment Variables
3. Add new variable:
   ```
   Key: AUTOTRADER_WEBHOOK_SECRET
   Value: <secret-from-autotrader>
   ```
4. Redeploy site (clear cache)

---

### **Step 4: Add imports**

At the top of `autotrader-webhook.ts`, add:

```typescript
import { createHmac, timingSafeEqual } from 'crypto';
```

Or if you get errors, use:

```typescript
import crypto from 'crypto';

// Then in the function, use:
// const hmac = crypto.createHmac('sha256', secret);
// const isValid = crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
```

---

## ✅ Testing

### **Test 1: Valid Signature**

Create a test script to simulate a valid webhook:

```javascript
const crypto = require('crypto');

const payload = JSON.stringify({
  eventType: 'vehicle.created',
  vehicleId: 'test-123',
  advertiserId: '10042804',
  timestamp: new Date().toISOString()
});

const secret = 'your-test-secret';
const hmac = crypto.createHmac('sha256', secret);
hmac.update(payload);
const signature = hmac.digest('hex');

console.log('Payload:', payload);
console.log('Signature:', signature);

// Send POST request with signature header
fetch('http://localhost:8888/.netlify/functions/autotrader-webhook', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Autotrader-Signature': signature,
  },
  body: payload,
});
```

**Expected:** `200 OK` with "Webhook signature verified successfully" in logs.

---

### **Test 2: Invalid Signature**

```javascript
fetch('http://localhost:8888/.netlify/functions/autotrader-webhook', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Autotrader-Signature': 'invalid-signature-12345',
  },
  body: JSON.stringify({
    eventType: 'vehicle.created',
    vehicleId: 'test-123',
    advertiserId: '10042804',
  }),
});
```

**Expected:** `401 Unauthorized` with "Invalid webhook signature" error.

---

### **Test 3: Missing Signature**

```javascript
fetch('http://localhost:8888/.netlify/functions/autotrader-webhook', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    eventType: 'vehicle.created',
    vehicleId: 'test-123',
    advertiserId: '10042804',
  }),
});
```

**Expected:** `401 Unauthorized` with "Missing webhook signature" error.

---

## 📝 AutoTrader Documentation Reference

**Check AutoTrader's webhook documentation for:**
1. Signature header name (likely `X-Autotrader-Signature`)
2. Signature format (likely `sha256=<hash>` or just `<hash>`)
3. Hashing algorithm (likely HMAC-SHA256)
4. Payload encoding (likely raw request body)

**If AutoTrader's implementation differs:**
- Adjust the `verifyWebhookSignature` function accordingly
- Check their docs at: https://developers.autotrader.co.uk/webhooks

---

## 🔐 Security Best Practices

### ✅ DO:
- Store webhook secret in environment variables (never in code)
- Use constant-time comparison (`timingSafeEqual`) to prevent timing attacks
- Log failed verification attempts for security monitoring
- Reject webhooks without signatures
- Validate payload structure after signature verification

### ❌ DON'T:
- Never commit webhook secret to git
- Don't use simple string comparison (`===`) for signatures
- Don't log the secret (only log "secret is set" or "secret is missing")
- Don't disable signature verification in production
- Don't trust webhook data without verification

---

## 🚨 Troubleshooting

### "Signature verification failed"

**Possible causes:**
1. Wrong secret key (check environment variable)
2. Payload was modified before verification (check you're using raw `event.body`)
3. Signature format mismatch (check if AutoTrader includes "sha256=" prefix)
4. Encoding issue (ensure UTF-8 encoding)

**Debug steps:**
```typescript
console.log('Raw payload:', event.body);
console.log('Signature received:', signature);
console.log('Expected signature:', expectedSignature);
console.log('Secret length:', secret.length);
```

---

### "Webhook secret not configured"

**Fix:**
1. Get secret from AutoTrader
2. Add to Netlify environment variables
3. Redeploy site

---

### "Missing webhook signature header"

**Possible causes:**
1. AutoTrader hasn't been configured to send webhooks to your URL
2. Wrong header name (check AutoTrader docs)
3. Testing without signature header

---

## ✅ Checklist

Before deploying to production:

- [ ] Implemented secure signature verification
- [ ] Added `AUTOTRADER_WEBHOOK_SECRET` to Netlify env vars
- [ ] Tested with valid signature (should pass)
- [ ] Tested with invalid signature (should fail)
- [ ] Tested with missing signature (should fail)
- [ ] Verified logs show signature verification status
- [ ] Removed any debug logging of secrets
- [ ] Documented where to find webhook secret
- [ ] Added monitoring for failed webhook attempts

---

## 📊 Monitoring

After deployment, monitor for:

- **High rate of 401 errors:** Possible attack or misconfiguration
- **All webhooks failing verification:** Wrong secret key
- **Webhooks working intermittently:** Check AutoTrader status

**Add alerting:**
```typescript
// Track failed webhook attempts
let failedAttempts = 0;

if (!isValid) {
  failedAttempts++;
  if (failedAttempts > 10) {
    // Send alert email to admin
    console.error('⚠️ HIGH ALERT: Multiple failed webhook verification attempts');
  }
}
```

---

**Estimated Implementation Time:** 30 minutes  
**Testing Time:** 15 minutes  
**Total:** 45 minutes

🔒 **This fix is CRITICAL for production security!**

