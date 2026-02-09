# AutoTrader Webhook - Sandbox Setup

## ✅ Webhook Configuration Complete

**Status:** Webhooks configured by AutoTrader for Sandbox testing

**Webhook Secret Key (Sandbox):**
```
sk_test_99497c0422afbef5cdcf3c8a5a7be510
```

---

## 🔧 Setup Instructions

### Step 1: Add Webhook Secret to Netlify

1. Go to **Netlify Dashboard** → Your Site → **Site settings**
2. Navigate to **Environment variables** (in left sidebar)
3. Click **Add a variable**
4. Add this variable:
   ```
   Key: AUTOTRADER_WEBHOOK_SECRET
   Value: sk_test_99497c0422afbef5cdcf3c8a5a7be510
   ```
5. Select **All scopes** (production, deploy previews, branch deploys)
6. Click **Save**

### Step 2: Redeploy Site (to apply new environment variable)

**Option A - Trigger Manual Deploy:**
1. Go to **Deploys** tab in Netlify
2. Click **Trigger deploy** → **Deploy site**
3. Wait for deployment to complete (~2 minutes)

**Option B - Git Push (Recommended):**
```bash
# Make a small change (already done in this commit)
git push origin main
# Netlify will auto-deploy with new environment variable
```

---

## 🧪 Testing Webhooks

### What to Test:

Paul has given you access to the AutoTrader Portal where you can:

1. **Create a test vehicle** → Should trigger `vehicle.created` webhook
2. **Update vehicle details** (price, description, etc.) → Should trigger `vehicle.updated` webhook
3. **Delete a test vehicle** → Should trigger `vehicle.deleted` webhook

### Where to Monitor:

#### 1. Netlify Function Logs
**Location:** Netlify Dashboard → Functions → `autotrader-webhook`

**What to look for:**
- ✅ `✅ Webhook signature verified successfully`
- ✅ `Handling vehicle.created: [vehicleId]`
- ✅ `Handling vehicle.updated: [vehicleId]`
- ✅ `Handling vehicle.deleted: [vehicleId]`
- ✅ `Webhook processed successfully`

**Errors to watch for:**
- ❌ `Webhook signature verification FAILED` (means secret key mismatch)
- ❌ `Invalid webhook payload` (means payload structure issue)

#### 2. Supabase Database
**Location:** Supabase Dashboard → Table Editor → `cars` table

**What to check:**
- New vehicles appear when created in portal
- Existing vehicles update when modified in portal
- Vehicles marked as `available: false` when deleted in portal

#### 3. Admin Dashboard
**Location:** Your website → Admin Dashboard → Cars tab

**What to verify:**
- Real-time updates appear without manual sync
- Vehicle details match what you set in AutoTrader Portal

---

## 📊 Expected Webhook Flow

### 1. Vehicle Created
```
AutoTrader Portal: Create new vehicle
    ↓
Webhook fires → /.netlify/functions/autotrader-webhook
    ↓
Signature verified with secret key
    ↓
Fetch vehicle details from AutoTrader API
    ↓
Map to database schema
    ↓
Insert into Supabase 'cars' table
    ↓
✅ New vehicle appears on website
```

### 2. Vehicle Updated
```
AutoTrader Portal: Update price/description/etc
    ↓
Webhook fires → /.netlify/functions/autotrader-webhook
    ↓
Signature verified
    ↓
Fetch updated details from AutoTrader API
    ↓
Update existing record in database
    ↓
✅ Changes appear on website
```

### 3. Vehicle Deleted
```
AutoTrader Portal: Delete vehicle
    ↓
Webhook fires → /.netlify/functions/autotrader-webhook
    ↓
Signature verified
    ↓
Mark vehicle as unavailable in database
    ↓
✅ Vehicle hidden from website
```

---

## 🐛 Troubleshooting

### Issue: Webhook signature verification fails

**Symptoms:**
- Netlify logs show: `❌ Webhook signature verification FAILED`

**Solution:**
1. Verify environment variable is set correctly:
   - Key: `AUTOTRADER_WEBHOOK_SECRET`
   - Value: `sk_test_99497c0422afbef5cdcf3c8a5a7be510`
2. Ensure site was redeployed after adding the variable
3. Check Netlify function logs for exact error message

### Issue: Webhook received but vehicle not in database

**Symptoms:**
- Webhook logs show success
- Vehicle not appearing in Supabase or website

**Possible Causes:**
1. API request failed (check CF-Ray-ID in logs)
2. Vehicle data validation failed (check validation errors in logs)
3. Database insert failed (check Supabase RLS policies)

**Solution:**
1. Check Netlify function logs for detailed error messages
2. Look for CF-Ray-ID to share with AutoTrader if API issue
3. Verify Supabase connection and RLS policies

### Issue: Webhooks not being received at all

**Symptoms:**
- No logs in Netlify functions
- No activity when changing vehicles in portal

**Solution:**
1. Verify webhook URL with Paul:
   ```
   https://fntmotorgroup.netlify.app/.netlify/functions/autotrader-webhook
   ```
2. Check AutoTrader Portal webhook configuration
3. Ensure webhooks are enabled for your advertiser

---

## 🎯 Test Checklist

### Before Testing:
- [ ] Added `AUTOTRADER_WEBHOOK_SECRET` to Netlify environment variables
- [ ] Redeployed site (or pushed to Git to trigger deploy)
- [ ] Logged into AutoTrader Portal
- [ ] Opened Netlify function logs in separate tab
- [ ] Opened Supabase table editor in separate tab

### Test 1: Create Vehicle
- [ ] Create a test vehicle in AutoTrader Portal
- [ ] Check Netlify logs for `vehicle.created` event
- [ ] Verify signature verification passed
- [ ] Check Supabase - new row appears in `cars` table
- [ ] Check website - new vehicle visible in catalog
- [ ] Record vehicle ID for next tests: _______________

### Test 2: Update Vehicle
- [ ] Update test vehicle price in Portal
- [ ] Check Netlify logs for `vehicle.updated` event
- [ ] Verify signature verification passed
- [ ] Check Supabase - price updated in database
- [ ] Check website - updated price visible

### Test 3: Delete Vehicle
- [ ] Delete test vehicle in Portal
- [ ] Check Netlify logs for `vehicle.deleted` event
- [ ] Verify signature verification passed
- [ ] Check Supabase - vehicle marked as unavailable
- [ ] Check website - vehicle no longer visible in catalog

### All Tests Pass?
- [ ] Yes → Reply to Paul confirming sandbox webhooks working
- [ ] No → Share error logs and CF-Ray-IDs with Paul

---

## 📧 Response Template for Paul (After Testing)

### If Successful:
```
Hi Paul,

Great news! Sandbox webhooks are working perfectly.

Test Results:
✅ vehicle.created - Working
✅ vehicle.updated - Working  
✅ vehicle.deleted - Working
✅ Signature verification - Passed
✅ Database updates - Real-time

Ready to proceed with production webhook setup whenever you're ready.

Thanks!
Imran
```

### If Issues:
```
Hi Paul,

I've tested the sandbox webhooks. Here's what I found:

Issue: [Describe the issue]

Logs: [Paste relevant Netlify function logs]
CF-Ray-ID: [Include if API-related]

Environment Variable Status:
- AUTOTRADER_WEBHOOK_SECRET: Configured
- Last Deploy: [Timestamp]

Can you help troubleshoot this?

Thanks,
Imran
```

---

## 🔐 Security Notes

**Webhook Secret Storage:**
- ✅ Stored in Netlify environment variables (encrypted)
- ✅ Never committed to Git
- ✅ Not exposed in client-side code
- ✅ Only accessible to serverless functions

**Signature Verification:**
- ✅ HMAC-SHA256 used
- ✅ Constant-time comparison (prevents timing attacks)
- ✅ Rejects unsigned or invalid webhooks
- ✅ Logs all verification attempts

**Production Readiness:**
- ⚠️ Sandbox secret is `sk_test_...` (for testing only)
- ⚠️ Production will need different secret (`sk_live_...`)
- ⚠️ Update environment variable when moving to production

---

## 🚀 Next Steps

1. **Add webhook secret** to Netlify environment variables
2. **Redeploy** the site
3. **Log into AutoTrader Portal** (check email from Paul)
4. **Run tests** using the checklist above
5. **Monitor logs** in Netlify and Supabase
6. **Report results** to Paul
7. **Production setup** once sandbox tests pass

---

**Last Updated:** After receiving sandbox webhook secret from Paul
**Status:** Ready for testing
