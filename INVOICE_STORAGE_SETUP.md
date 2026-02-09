# Invoice Storage Setup Instructions

## Supabase Configuration Required

### 1. Run the Database Migration

Execute the SQL migration file to create the invoices table:

```bash
# In Supabase SQL Editor, run:
migrations/006_create_invoices_table.sql
```

### 2. Create Storage Bucket

1. Go to **Supabase Dashboard → Storage**
2. Click **"New bucket"**
3. Create a bucket with these settings:
   - **Name**: `invoices`
   - **Public bucket**: ✅ Checked (so invoices can be downloaded)
   - **File size limit**: 10 MB (recommended)
   - **Allowed MIME types**: `application/pdf`

### 3. Set Storage Policies

In the `invoices` bucket, add these policies:

#### Policy 1: Allow authenticated users to upload
```sql
-- Name: Allow authenticated uploads
-- Allowed operation: INSERT
-- Policy definition:
(bucket_id = 'invoices'::text) AND (auth.role() = 'authenticated'::text)
```

#### Policy 2: Allow public downloads
```sql
-- Name: Allow public downloads
-- Allowed operation: SELECT
-- Policy definition:
(bucket_id = 'invoices'::text)
```

### 4. Auto-numbering System

Invoice numbers are generated automatically:
- **FNT Sales**: `FNT-S-001`, `FNT-S-002`, etc.
- **FNT Purchase**: `FNT-P-001`, `FNT-P-002`, etc.
- **TNT Services**: `TNT-001`, `TNT-002`, etc.

The system queries the database for the last invoice number and increments it.

### 5. Storage Structure

PDFs are stored with this structure:
```
invoices/
  ├── fnt-sales/
  │   ├── FNT-S-001.pdf
  │   └── FNT-S-002.pdf
  ├── fnt-purchases/
  │   ├── FNT-P-001.pdf
  │   └── FNT-P-002.pdf
  └── tnt-services/
      ├── TNT-001.pdf
      └── TNT-002.pdf
```

## Features

✅ **Invoice History Tab** - View all generated invoices
✅ **Separate Views** - FNT Sales, FNT Purchase, TNT Services
✅ **Auto-numbering** - Sequential invoice numbers per type
✅ **Download** - Download any invoice PDF
✅ **Preview** - Open invoice in new tab
✅ **Search** - Search by invoice number, customer name, or vehicle
✅ **Metadata** - Stores customer, vehicle, and financial details

## Next Steps

After completing the Supabase setup above:
1. The invoice forms will automatically save to the database
2. PDFs will be uploaded to Supabase Storage
3. Invoice History tab will display all invoices
4. You can download/preview any invoice at any time
