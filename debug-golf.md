# Debug: Volkswagen Golf Not Removing

## Quick Diagnosis Steps

### Step 1: Check Database Directly
Go to Supabase Dashboard → Table Editor → `cars` table

Search for: `Volkswagen Golf 2.0 TDI`

Check these fields:
- `autotrader_id` - Does it have one? (Should look like: `8a4690159c56499b...`)
- `is_available` - Is it `true` or `false`?
- `synced_from_autotrader` - Is it `true` or `false`?
- `sync_override` - Is it `true` or `false`?

### Step 2: Run Manual Sync
Go to Admin Dashboard → Click "Sync Stock" button

This will:
1. Fetch all vehicles from AutoTrader
2. Compare with database
3. Mark the Golf as unavailable (if it has an autotrader_id)

### Step 3: Check Sync Logs
After running sync, check Netlify Functions logs:
1. Go to Netlify Dashboard
2. Functions → sync-stock
3. Look for: "Marked X cars as unavailable"

---

## Most Likely Causes:

### Cause 1: Vehicle Created Manually (No AutoTrader ID)
**Symptom:** Golf has `autotrader_id: null`

**Why:** You created it manually before AutoTrader sync
**Fix:** Manual delete from database OR set `is_available: false`

**SQL Fix:**
```sql
UPDATE cars 
SET is_available = false 
WHERE make = 'Volkswagen' 
  AND model LIKE '%Golf%' 
  AND autotrader_id IS NULL;
```

### Cause 2: Sync Hasn't Run Yet
**Symptom:** Golf still has `is_available: true` 

**Why:** Scheduled sync runs every 30 minutes
**Fix:** Click "Sync Stock" in admin dashboard

### Cause 3: Golf Has `sync_override: true`
**Symptom:** Sync logs say "Skipping XYZ - manual override enabled"

**Why:** Manual override flag is set (prevents auto-sync)
**Fix:** Turn off override OR manually set unavailable

**SQL Fix:**
```sql
UPDATE cars 
SET sync_override = false, is_available = false
WHERE make = 'Volkswagen' 
  AND model LIKE '%Golf%';
```

---

## Permanent Solution

I'll add a webhook handler for when you **delete** vehicles from AutoTrader.

Currently we handle:
- ✅ `STOCK_UPDATE` (create/update)
- ❌ `STOCK_DELETE` (delete) ← **NOT FULLY IMPLEMENTED**

The webhook delete handler exists but isn't tested. Let me verify it works properly.
