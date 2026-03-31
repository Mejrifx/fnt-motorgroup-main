# Leads Management System - Database Migration

## Overview
This migration creates a comprehensive leads tracking system for the FNT Motor Group admin portal.

## Migration File
`012_create_leads_table.sql`

## What it Creates

### Leads Table
A complete CRM-style table to track customer enquiries with the following features:

**Customer Information:**
- Name, email, phone

**Lead Tracking:**
- Lead source (Car Gurus, Auto Trader, Facebook, Website, etc.)
- Link to specific car enquiry (with fallback for manual entry)
- Status workflow: new → contacted → in_progress → qualified → converted/lost

**Contact Management:**
- Contacted flag with timestamp
- Whether customer answered
- Whether message/text was left

**Lead Quality:**
- Priority (low/medium/high)
- Interest level assessment
- Budget range
- Purchase timeframe

**Communication History:**
- JSON array storing all communications with timestamps
- Track calls, emails, texts, meetings, and notes

**Follow-up System:**
- Follow-up date scheduling
- Next action reminders

**Conversion Tracking:**
- Conversion status and date
- Sale value

## To Apply This Migration

Run in your Supabase SQL Editor:

```sql
-- Copy and paste the contents of 012_create_leads_table.sql
```

Or if you have CLI access:
```bash
psql -h your-supabase-host -U postgres -d postgres -f migrations/012_create_leads_table.sql
```

## Features Included

1. **Row Level Security (RLS)** - Only authenticated users can access leads
2. **Indexes** - Optimized for common queries (status, source, date, priority)
3. **Foreign Keys** - Links to cars table and auth.users
4. **Auto-updating timestamps** - updated_at automatically maintained
5. **Cascading deletes** - Properly handles car deletions

## UI Components Created

- `LeadsManagement.tsx` - Main component with full CRUD operations
- Updated `AdminDashboard.tsx` - Added "Leads" tab
- Updated `supabase.ts` - Added Lead and CommunicationLog TypeScript types

## Usage

After running the migration, the Leads tab will appear in the admin dashboard with:
- 7 statistics cards showing lead pipeline
- Advanced filtering (status, priority, source, contacted)
- Search across all lead fields
- Side drawer for detailed lead management
- Communication history logging
- Follow-up scheduling
- Conversion tracking
