# FNT Motor Group - Airtable Setup Instructions

## Your Airtable Credentials
- **API Key**: [Your API key - see step 2.1 below]
- **Base ID**: appJ6Qs7JokddSbXm
- **Base Name**: FNT - Cars 4 Sale

## Step 1: Set Up Your Table Structure

### 1.1 Go to Your Airtable Base
1. Open [Airtable.com](https://airtable.com)
2. Find your base "FNT - Cars 4 Sale"
3. Click on the "Car Sales Leads" table (or create it if it doesn't exist)

### 1.2 Add Required Fields
Your table needs these exact field names (case-sensitive):

| Field Name | Field Type | Description |
|------------|------------|-------------|
| First Name | Single line text | Customer's first name |
| Last Name | Single line text | Customer's last name |
| Phone Number | Phone number | Customer's contact number |
| Car Registration | Single line text | Vehicle registration |
| Mileage | Number | Car mileage |
| Make & Model | Single line text | Vehicle make and model |
| Additional Info | Long text | Additional car details |
| Submission Date | Date | When the form was submitted |
| Status | Single select | Options: New, Contacted, Appraised, Sold, Declined |

### 1.3 Set Default Values
- **Submission Date**: Set to "Now" (automatic)
- **Status**: Set default to "New"

## Step 2: Fix API Key Permissions

### 2.1 Regenerate API Key with Correct Permissions
1. Go to [Airtable Account](https://airtable.com/account)
2. Scroll to "API" section
3. Click "Generate new token"
4. Name: "FNT Motor Group Website"
5. **IMPORTANT**: Select these scopes:
   - ✅ `data.records:write` (to create records)
   - ✅ `data.records:read` (to read records)
6. **Access**: Select your "FNT - Cars 4 Sale" base
7. Copy the new token

### 2.2 Update Your Environment Variables
Replace the API key in your `.env` file with the new one:

```env
VITE_AIRTABLE_API_KEY=your_new_api_key_here
VITE_AIRTABLE_BASE_ID=appJ6Qs7JokddSbXm
VITE_AIRTABLE_TABLE_NAME=Car Sales Leads
```

## Step 3: Test the Integration

### 3.1 Test Locally
1. Restart your development server: `npm run dev`
2. Go to your website
3. Click "Sell Your Car" card
4. Fill out the form and submit
5. Check your Airtable base for the new record

### 3.2 Test on Netlify
1. Go to your Netlify dashboard
2. Site settings → Environment variables
3. Add these variables:
   - `VITE_AIRTABLE_API_KEY` = your_new_api_key
   - `VITE_AIRTABLE_BASE_ID` = appJ6Qs7JokddSbXm
   - `VITE_AIRTABLE_TABLE_NAME` = Car Sales Leads
4. Redeploy your site
5. Test the live form

## Step 4: Troubleshooting

### Common Issues:

1. **"You are not authorized" Error**
   - Solution: Regenerate API key with `data.records:write` permission

2. **"Field doesn't exist" Error**
   - Solution: Make sure all field names match exactly (case-sensitive)

3. **"Table doesn't exist" Error**
   - Solution: Create the "Car Sales Leads" table in your base

4. **CORS Errors**
   - Solution: Add your domain to Airtable's allowed origins (if needed)

### Testing Checklist:
- [ ] Table "Car Sales Leads" exists
- [ ] All required fields are created with exact names
- [ ] API key has write permissions
- [ ] Environment variables are set correctly
- [ ] Form submission creates a record in Airtable
- [ ] Success message appears after submission

## Step 5: Optional Enhancements

### 5.1 Email Notifications
Set up automatic email notifications when new leads are submitted:
1. Go to "Automations" in your Airtable base
2. Create: "New Lead Notification"
3. Trigger: "When a record is created"
4. Action: "Send email"

### 5.2 Lead Management
- Add a "Notes" field for internal comments
- Create views to filter by status
- Set up reminders for follow-ups

## Need Help?

If you're still having issues:
1. Double-check the field names match exactly
2. Verify API key permissions
3. Test with a simple record creation first
4. Check the browser console for error messages

Your integration is almost ready! Just need to set up the table structure and fix the API permissions.
