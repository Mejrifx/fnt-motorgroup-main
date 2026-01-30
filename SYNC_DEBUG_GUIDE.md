# 🔍 AutoTrader Sync Debugging Guide

## Issue: Cars Marked Unavailable When They're Still on AutoTrader

### How the Sync Works

The sync process follows these steps:

1. **Fetch** all vehicles from AutoTrader API
2. **Map** AutoTrader vehicle IDs to database records
3. **Update** existing vehicles or **Insert** new ones
4. **Mark Unavailable**: Any car in the database with `synced_from_autotrader = true` that's **NOT** in the current AutoTrader feed gets marked as unavailable

### Possible Causes

#### 1. **Vehicle ID Mismatch** ⚠️
**Most likely cause:** The vehicle ID in the database doesn't match the ID from AutoTrader.

**How vehicle IDs are extracted:**
```typescript
// From autotraderClient.ts line 386-390
const vehicleId = metadata.stockId ||          // ← Primary (used in 99% of cases)
                 metadata.externalStockId ||    // ← Alternative
                 vehicle.registration ||        // ← Fallback to registration
                 vehicle.vin ||                 // ← Fallback to VIN
                 `AT-${advertiserId}-${index}`; // ← Last resort fallback
```

**To verify:**
1. Go to Admin Dashboard → Click "Sync Now"
2. Check Netlify logs for sync-stock function
3. Look for: `"First vehicle ID extraction"` - this shows what IDs are being used
4. Compare with database: Check the `autotrader_id` column in Supabase

---

#### 2. **Pagination Issue** 📄
**Less likely (but possible):** Not all vehicles are being fetched from AutoTrader.

**Current behavior:**
- **Sandbox mode**: Only fetches first page (~20 vehicles)
- **Production mode**: Fetches ALL pages automatically

**To verify:**
1. Check AutoTrader dashboard: How many vehicles are listed?
2. Check Netlify sync logs: Does it say "Pagination detected"?
3. If in production and you have 27+ vehicles, you should see logs like:
   ```
   📄 Pagination detected: 20 results per page, 27 total
   📄 Need to fetch 2 more page(s)
   ```

---

#### 3. **Manual Override Enabled** 🚫
**Unlikely (but check):** Cars with `sync_override = true` are skipped during sync.

**To verify:**
1. Go to Supabase → `cars` table
2. Check if any cars have `sync_override = true`
3. These cars won't be updated or marked unavailable (by design)

---

#### 4. **AutoTrader API Returns Stale Data** 🕒
**Rare:** AutoTrader's API might not immediately reflect changes made on their site.

**To verify:**
1. Check when the car was updated on AutoTrader
2. Wait 5-10 minutes and trigger manual sync again
3. AutoTrader typically updates within minutes, but can take longer

---

### Debugging Steps

#### **Step 1: Check Current Database State**

Run this in Supabase SQL Editor:

```sql
-- See all AutoTrader-synced cars and their availability
SELECT 
  id,
  make,
  model,
  year,
  autotrader_id,
  is_available,
  sync_override,
  last_synced_at,
  updated_at
FROM cars
WHERE synced_from_autotrader = true
ORDER BY updated_at DESC;
```

**What to look for:**
- Are the `autotrader_id` values correct?
- Which cars have `is_available = false`?
- When were they last synced (`last_synced_at`)?

---

#### **Step 2: Check Latest Sync Logs**

Run this in Supabase SQL Editor:

```sql
-- See recent sync activity
SELECT 
  sync_type,
  status,
  cars_added,
  cars_updated,
  cars_marked_unavailable,
  error_message,
  sync_duration_ms,
  created_at
FROM autotrader_sync_logs
ORDER BY created_at DESC
LIMIT 10;
```

**What to look for:**
- Are cars being marked unavailable (`cars_marked_unavailable > 0`)?
- Are there any errors (`error_message`)?
- How many cars are being synced (`cars_updated`)?

---

#### **Step 3: Check Netlify Function Logs**

1. Go to Netlify → Functions → `sync-stock`
2. Click on the most recent execution
3. Look for these log lines:

```
Found X vehicles in AutoTrader
First vehicle ID extraction: { vehicleId: '...', stockId: '...', ... }
Updated: Make Model (autotrader_id)
Marked X cars as unavailable
```

**What to look for:**
- How many vehicles were found?
- What is the `vehicleId` format?
- Which specific cars were marked unavailable?

---

#### **Step 4: Compare Database IDs with AutoTrader Logs**

Example:
```
// From Netlify logs:
First vehicle ID extraction: { vehicleId: 'AT123456', stockId: 'AT123456' }

// From database (Supabase):
autotrader_id: 'AT123456'  ← MATCH ✅
autotrader_id: 'AT789999'  ← NOT in current sync ❌ (will be marked unavailable)
```

If the IDs don't match, that's your problem!

---

### Solutions

#### **Solution 1: Fix ID Mismatch**

If the vehicle IDs in your database don't match AutoTrader's current IDs:

**Option A: Clear and Re-sync (Recommended)**
```sql
-- Delete all AutoTrader-synced cars (manual cars are safe)
DELETE FROM cars WHERE synced_from_autotrader = true;

-- Then trigger manual sync from Admin Dashboard
```

**Option B: Update IDs manually**
```sql
-- Update specific car IDs (if you know the correct mapping)
UPDATE cars
SET autotrader_id = 'NEW_CORRECT_ID'
WHERE autotrader_id = 'OLD_INCORRECT_ID';
```

---

#### **Solution 2: Disable Unavailable Marking (Temporary)**

If you want to temporarily stop cars from being marked unavailable while debugging:

**Edit:** `netlify/functions/sync-stock.ts` line 202-225

```typescript
// Comment out the "mark unavailable" logic:
/*
// Step 5: Mark cars no longer in AutoTrader as unavailable
const carsToMarkUnavailable = existingCars?.filter(car => 
  !car.sync_override && !autotraderVehicleIds.has(car.autotrader_id)
) || [];

if (carsToMarkUnavailable.length > 0) {
  // ... marking logic
}
*/
```

**⚠️ Warning:** This means deleted cars won't be marked unavailable automatically!

---

#### **Solution 3: Enable Manual Override**

If specific cars keep getting marked unavailable incorrectly:

```sql
-- Prevent a specific car from being auto-synced
UPDATE cars
SET sync_override = true
WHERE id = 'car-id-here';
```

The sync will skip this car entirely.

---

### Most Likely Fix

Based on the sync logic, the **most common issue** is:

1. **Old vehicle IDs in database** that no longer match AutoTrader's current IDs
2. **Solution**: Delete all synced cars and re-sync fresh from AutoTrader

**To fix:**
```sql
-- Backup first (optional)
CREATE TABLE cars_backup AS SELECT * FROM cars WHERE synced_from_autotrader = true;

-- Delete all AutoTrader cars
DELETE FROM cars WHERE synced_from_autotrader = true;

-- Then trigger "Sync Now" from Admin Dashboard
```

This will give you a clean slate with correct vehicle IDs.

---

### Contact for Further Help

If the issue persists:
1. Share the Netlify sync logs (last 3 syncs)
2. Share the SQL results from Step 1 and Step 2
3. Confirm which cars are showing as unavailable but shouldn't be
4. Confirm how many cars are actually on AutoTrader's platform

---

## Quick Checklist

- [ ] Check database: Which cars are marked unavailable?
- [ ] Check Netlify logs: How many vehicles were fetched?
- [ ] Compare IDs: Do database `autotrader_id` values match logs?
- [ ] Check AutoTrader: Are these cars actually still listed?
- [ ] Check sync override: Any cars have `sync_override = true`?
- [ ] Try clear + re-sync: Delete all synced cars and re-sync fresh

---

**Last Updated:** 30 January 2026
