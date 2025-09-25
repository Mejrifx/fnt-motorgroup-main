# 🚀 Supabase Setup Instructions

## Step 1: Execute Database Schema
1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project: `wqbuznxglexyijlwvjmi`
3. Go to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy and paste the entire contents of `database-schema.sql`
6. Click **Run** to execute

## Step 2: Enable Email Authentication
1. Go to **Authentication** → **Settings** in your Supabase dashboard
2. Under **Auth Providers**, make sure **Email** is enabled
3. **Disable email confirmation** for testing:
   - Set "Enable email confirmations" to **OFF**
4. **Allow manual user creation**:
   - Set "Enable manual user creation" to **ON**

## Step 3: Create Admin User
1. Go to **Authentication** → **Users**
2. Click **Add user**
3. Enter:
   - **Email**: `admin@fntmotorgroup.com`
   - **Password**: `FarisandTawhid`
   - **Email Confirm**: Check this box
4. Click **Create user**

## Step 4: Configure Site URL (Important!)
1. Go to **Settings** → **Authentication**
2. Under **Site URL**, add your domain:
   - For local development: `http://localhost:5173`
   - For production: `https://your-netlify-domain.netlify.app`
3. Under **Redirect URLs**, add:
   - `http://localhost:5173/admin/dashboard`
   - `https://your-netlify-domain.netlify.app/admin/dashboard`

## Step 5: Environment Variables for Netlify
Add these environment variables in Netlify:
- **VITE_SUPABASE_URL**: `https://wqbuznxglexyijlwvjmi.supabase.co`
- **VITE_SUPABASE_ANON_KEY**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxYnV6bnhnbGV4eWlqbHd2am1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MTcwMTgsImV4cCI6MjA3NDM5MzAxOH0.xzAqG6EVQFmFtEIc4hgdesL__pwuFXf-kzUjMH5WFtA`

## Testing
1. Restart your local development server: `npm run dev`
2. Go to your site and click "FNT Motor Group" in the footer
3. Login with:
   - **Email**: `admin@fntmotorgroup.com`
   - **Password**: `FarisandTawhid`

## Troubleshooting
- If you get "Invalid credentials", make sure the user was created in Supabase Auth
- If you get CORS errors, check the Site URL configuration
- If environment variables aren't working, restart the dev server
