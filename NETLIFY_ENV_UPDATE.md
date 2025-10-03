# Netlify Environment Variables Update

## Current Issue
Your browser is still showing `📊 Table Name: FNT - Cars 4 Sale` instead of `📊 Table Name: Car Sales Leads`.

This means you're testing on the **live Netlify site** which still has the old environment variables.

## Fix: Update Netlify Environment Variables

### Step 1: Go to Netlify Dashboard
1. Go to [netlify.com](https://netlify.com) and sign in
2. Find your site "fntmotorgroup" 
3. Click on it

### Step 2: Update Environment Variables
1. Go to **Site settings** → **Environment variables**
2. Find these variables and update them:

| Variable Name | Current Value | New Value |
|---------------|---------------|-----------|
| `VITE_AIRTABLE_TABLE_NAME` | `FNT - Cars 4 Sale` | `Car Sales Leads` |
| `VITE_AIRTABLE_BASE_ID` | `appJ6Qs7JokddSbXm` | `appJ6Qs7JokddSbXm` (keep same) |
| `VITE_AIRTABLE_API_KEY` | `patyjiKQPYzexyC7S...` | `patyjiKQPYzexyC7S...` (keep same) |

### Step 3: Redeploy
1. After updating environment variables
2. Go to **Deploys** tab
3. Click **Trigger deploy** → **Deploy site**
4. Wait for deployment to complete

### Step 4: Test Again
1. Go to your live site: `https://fntmotorgroup.co.uk/`
2. Open Developer Console (F12)
3. Click "Sell Your Car" → Fill form → Submit
4. Console should now show: `📊 Table Name: Car Sales Leads`

## Alternative: Test Locally First
If you want to test immediately:
1. Go to `http://localhost:5173/` (your local dev server)
2. Test the form there first
3. It should work with the updated `.env` file

## Expected Result
After updating Netlify environment variables:
- ✅ Console shows: `📊 Table Name: Car Sales Leads`
- ✅ API call goes to: `/Car%20Sales%20Leads/`
- ✅ Form submits successfully
- ✅ Success modal appears
- ✅ Record created in Airtable
