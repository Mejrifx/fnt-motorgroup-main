# Database Migrations

This folder contains SQL migration files for the FNT Motor Group database.

## AutoTrader Integration Migrations

### Order of Execution

Run these migrations in order to set up AutoTrader API integration:

1. **001_add_autotrader_sync_fields.sql** - Adds sync tracking columns to `cars` table
2. **002_create_autotrader_sync_logs.sql** - Creates sync logs table for monitoring
3. **003_create_autotrader_config.sql** - Creates config table and initial sandbox setup

### How to Run Migrations

#### Option 1: Supabase SQL Editor (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste each migration file content
4. Run them in order (001, 002, 003)
5. Verify success messages appear

#### Option 2: Using psql Command Line
```bash
# Connect to your Supabase database
psql "postgresql://[YOUR_CONNECTION_STRING]"

# Run each migration
\i migrations/001_add_autotrader_sync_fields.sql
\i migrations/002_create_autotrader_sync_logs.sql
\i migrations/003_create_autotrader_config.sql
```

### Verification

After running all migrations, verify with:

```sql
-- Check cars table has new columns
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'cars' AND column_name LIKE '%autotrader%';

-- Check sync logs table exists
SELECT COUNT(*) FROM autotrader_sync_logs;

-- Check config table has sandbox config
SELECT * FROM autotrader_config;
```

### Rollback (if needed)

To rollback these migrations:

```sql
-- Rollback 003
DROP TABLE IF EXISTS autotrader_config CASCADE;
DROP FUNCTION IF EXISTS update_autotrader_config_updated_at CASCADE;

-- Rollback 002
DROP TABLE IF EXISTS autotrader_sync_logs CASCADE;
DROP FUNCTION IF EXISTS cleanup_old_sync_logs CASCADE;

-- Rollback 001
ALTER TABLE cars 
DROP COLUMN IF EXISTS autotrader_id,
DROP COLUMN IF EXISTS autotrader_advertiser_id,
DROP COLUMN IF EXISTS synced_from_autotrader,
DROP COLUMN IF EXISTS sync_override,
DROP COLUMN IF EXISTS last_synced_at,
DROP COLUMN IF EXISTS autotrader_data;
```

## Existing Migrations

- **database-schema.sql** - Initial database schema
- **database_update.sql** - Early database updates
- **car_details_update.sql** - Car details field additions
- **admin_category_update.sql** - Category updates
- **add_mainstream_car_brands.sql** - Sample mainstream car data
- **add_dacia_models.sql** - Dacia car models
- **test_*.sql** - Testing migrations

## Best Practices

1. Always backup your database before running migrations
2. Test migrations in development/sandbox environment first
3. Run migrations during low-traffic periods
4. Keep this README updated with new migrations
5. Never modify a migration file after it's been run in production
