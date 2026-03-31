# Leads Management System - User Guide

## Overview
The Leads tab in your admin portal provides a comprehensive CRM system to track and manage customer enquiries.

## Features

### 1. Lead Pipeline Dashboard
- **7 Statistics Cards**: Track total leads, new leads, contacted, in progress, qualified, converted, and high priority
- **Visual Status**: Quick overview of your sales pipeline

### 2. Lead Information Tracked

#### Customer Details
- Full name
- Email address
- Phone number

#### Lead Source
Track where each lead came from:
- Car Gurus
- Auto Trader
- Facebook
- Instagram
- Website
- Walk-in
- Referral
- Phone Call
- Custom sources

#### Car Enquiry
- Link to specific car in inventory (automatically shows price and details)
- Manual entry for cars not in system
- Full car details visible

#### Lead Status
Workflow progression:
1. **New** - Fresh lead, not yet contacted
2. **Contacted** - Initial contact made
3. **In Progress** - Active discussions/negotiations
4. **Qualified** - Serious buyer, ready to move forward
5. **Converted** - Sale completed
6. **Lost** - Lead did not convert

#### Contact Tracking
- ✓ Contacted checkbox with automatic timestamp
- ✓ Customer answered checkbox
- ✓ Message/text left checkbox
- Last contact date display

#### Lead Quality Assessment
- **Interest Level**: Low, Medium, High
- **Budget Range**: Customer's budget (e.g., "£20k - £30k")
- **Timeframe**: When they want to buy
  - Immediate
  - Within 1 Week
  - Within 1 Month
  - 1-3 Months
  - Just Browsing

#### Priority System
- Low, Medium, High priority flags
- Table automatically sorts by priority

#### Communication History
Complete log of all interactions:
- Type: Call, Email, Text/SMS, Meeting, Note
- Timestamp of each communication
- Detailed notes for each interaction
- User who logged the communication
- Delete option for each log entry
- Newest entries shown first

#### Follow-up System
- Set follow-up date and time
- Next action reminder
- Visual indicator on lead row for upcoming follow-ups

#### Conversion Tracking
When a lead converts:
- Mark as converted
- Record conversion date
- Track sale value
- Automatically updates status to "Converted"

### 3. Powerful Filtering & Search

**Search**:
- Customer name
- Email
- Phone
- Source
- Car details
- Notes

**Filters**:
- Status (New, Contacted, In Progress, etc.)
- Priority (Low, Medium, High)
- Contacted status (All, Contacted, Not Contacted)
- Source (dynamically populated from your leads)

**Sorting**:
- Automatically sorted by Priority → Status → Date
- High priority leads appear first
- New leads appear before contacted leads

### 4. Lead Table Columns

1. **Customer** - Name and follow-up date indicator
2. **Contact Info** - Email and phone (desktop only)
3. **Car Enquiry** - Which car they're interested in
4. **Source** - Where the lead came from
5. **Status** - Current pipeline stage
6. **Priority** - Low/Medium/High
7. **Contacted** - Visual indicators for contact status
8. **Date** - When lead was created

### 5. Lead Detail Drawer

Click any lead to open a detailed side drawer with:

**6 Sections**:

1. **Customer Information**
   - Edit name, email, phone

2. **Lead Details**
   - Source
   - Car selection (dropdown of all inventory)
   - Status and priority

3. **Contact Status**
   - Toggle switches for contacted/answered/message left
   - Automatic timestamp recording

4. **Lead Quality**
   - Interest level assessment
   - Budget range
   - Purchase timeframe

5. **Follow-up**
   - Date/time picker for next contact
   - Next action notes

6. **Notes**
   - General notes field for overall lead information

7. **Communication History**
   - Add new communication logs
   - View all past interactions
   - Delete individual log entries
   - Shows type, date, notes, and user

8. **Conversion Details** (shown when status is converted)
   - Conversion toggle
   - Conversion date
   - Sale value

## How to Use

### Adding a New Lead

1. Click "Add Lead" button
2. Fill in:
   - Customer name (required)
   - Contact details (email/phone)
   - Lead source (required)
   - Select car from dropdown or enter manually
3. Set initial status (defaults to "New")
4. Set priority (defaults to "Medium")
5. Click "Add Lead"

### Managing Existing Leads

1. Click on any lead row to open details
2. Update any fields as needed
3. Add communication logs as you interact with customer
4. Set follow-up reminders
5. Update status as lead progresses through pipeline
6. Mark as converted when sale is completed

### Communication Logging

1. Open a lead
2. In Communication History section:
   - Select type (Call, Email, Text, Meeting, Note)
   - Enter notes about the interaction
   - Click "Add" or press Enter
3. All logs are timestamped and saved
4. Hover over any log to see delete option

### Best Practices

1. **Always log communications** - Keep a complete history
2. **Set follow-ups** - Never miss a callback
3. **Update status regularly** - Keep pipeline accurate
4. **Use priorities** - Focus on hot leads
5. **Track sources** - Know which marketing works
6. **Assess interest level** - Qualify leads quickly
7. **Record budget/timeframe** - Match customers to appropriate inventory

## Database Migration Required

**IMPORTANT**: Before using the Leads tab, you must run the database migration.

### Steps to Apply Migration:

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Open the file: `migrations/012_create_leads_table.sql`
4. Copy all contents
5. Paste into Supabase SQL Editor
6. Click "Run"

The migration creates:
- `leads` table with all fields
- Indexes for performance
- Row Level Security policies
- Proper foreign key relationships
- Auto-updating timestamps

## Technical Details

### Files Created/Modified

**New Files**:
- `migrations/012_create_leads_table.sql` - Database schema
- `migrations/012_README.md` - Migration documentation
- `src/components/admin/LeadsManagement.tsx` - Main component (565 lines)

**Modified Files**:
- `src/components/admin/AdminDashboard.tsx` - Added Leads tab
- `src/lib/supabase.ts` - Added Lead and CommunicationLog types

### Technology Stack
- React + TypeScript
- Supabase (PostgreSQL + RLS)
- Tailwind CSS
- Lucide React Icons

### Data Model

The `leads` table includes:
- UUID primary key
- Foreign key to `cars` table
- Foreign key to `auth.users` for created_by/assigned_to
- JSONB field for communication history
- Comprehensive indexes for fast queries
- RLS policies for security

### Security
- Only authenticated admin users can access leads
- RLS policies enforce authentication
- All operations require valid session token

## Support

If you encounter any issues:
1. Check browser console for errors
2. Verify migration was applied successfully
3. Ensure you're logged in as admin
4. Check Supabase logs for database errors
