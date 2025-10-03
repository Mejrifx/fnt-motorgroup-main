# Quick Fix for Airtable Integration

## Current Status ✅
- ✅ API key has read permissions
- ✅ Base ID is correct: appJ6Qs7JokddSbXm
- ✅ Table "Car Sales Leads" exists
- ❌ Missing write permissions
- ❌ Missing required table fields

## Fix 1: Add Write Permissions to API Key

1. Go to [Airtable Account](https://airtable.com/account)
2. Scroll to "API" section
3. Find your existing token "FNT Motor Group Website"
4. Click "Edit" or "Regenerate"
5. **IMPORTANT**: Make sure these scopes are checked:
   - ✅ `data.records:write` ← This is missing!
   - ✅ `data.records:read` ← This is working
6. Save the changes

## Fix 2: Add Missing Fields to Table

Go to your "Car Sales Leads" table and add these fields:

| Field Name | Field Type |
|------------|------------|
| First Name | Single line text |
| Last Name | Single line text |
| Phone Number | Phone number |
| Car Registration | Single line text |
| Mileage | Number |
| Make & Model | Single line text |
| Additional Info | Long text |
| Submission Date | Date |

## Test After Fixes

Once you've made both changes, test again:

1. **Test locally**: Fill out the "Sell Your Car" form
2. **Check Airtable**: Look for the new record
3. **Deploy**: The Netlify environment variables should work once permissions are fixed

## Current Table Fields
Your table currently only has: `['Status']`

## Required Table Fields
You need: `['First Name', 'Last Name', 'Phone Number', 'Car Registration', 'Mileage', 'Make & Model', 'Additional Info', 'Submission Date', 'Status']`

The integration code is ready - just need these two fixes! 🚀
