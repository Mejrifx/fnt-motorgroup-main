# 🚀 Quick Start - AutoTrader Integration

## Password to Access Site During Development
**Password:** `FNT2026Preview`

---

## ⚡ Quick Setup (5 Minutes)

### 1. Run Database Migrations
**Supabase Dashboard → SQL Editor**

Copy/paste and run in order:
1. `migrations/001_add_autotrader_sync_fields.sql`
2. `migrations/002_create_autotrader_sync_logs.sql`
3. `migrations/003_create_autotrader_config.sql`

---

### 2. Add Environment Variables
**Netlify Dashboard → Site Settings → Environment Variables**

```bash
AUTOTRADER_ENVIRONMENT=sandbox
AUTOTRADER_API_KEY=FNTMotorGroup-Sandbox-26-01-26
AUTOTRADER_API_SECRET=WUXcGfU1oN1kQ1A3bfBRQylQPW1NMIZO
AUTOTRADER_ADVERTISER_ID=10042804
```

**Then:** Trigger deploy → Clear cache and deploy

---

### 3. Test It!
1. Go to your website: Enter password `FNT2026Preview`
2. Login to admin dashboard
3. Look for the new "AutoTrader Sync Status" blue panel
4. Click "**Sync Now**" button
5. Should see: "Sync completed! Added: X Updated: Y..."

**That's it! You're syncing with AutoTrader sandbox!**

---

## 📖 Next Steps

See `AUTOTRADER_INTEGRATION_GUIDE.md` for:
- Full testing checklist
- Production setup
- Go-live process
- Removing password protection

---

## 🔧 Common Commands

### View Sync Logs (SQL)
```sql
SELECT * FROM autotrader_sync_logs ORDER BY created_at DESC LIMIT 10;
```

### View Synced Cars
```sql
SELECT COUNT(*) FROM cars WHERE synced_from_autotrader = true;
```

### Manual Sync via Admin
- Admin Dashboard → "Sync Now" button

---

## ❓ Problems?

### Sync button doesn't work?
- Check Netlify environment variables are saved
- Redeploy site after adding variables
- Check browser console for errors

### No vehicles syncing?
- Sandbox may have test data limits
- Check admin dashboard → View Logs for errors

### Need help?
- Check `AUTOTRADER_INTEGRATION_GUIDE.md`
- Check `netlify/functions/README.md`

---

## 📞 AutoTrader Contacts

- **Integration help:** integration.management@autotrader.co.uk
- **Docs:** https://developers.autotrader.co.uk/documentation
