# Airtable Integration Guide for FNT Motor Group

## Overview
This guide will help you integrate the "Sell Your Car" form with Airtable to automatically store customer submissions.

## Step 1: Set Up Airtable Base

### 1.1 Create a New Base
1. Go to [Airtable.com](https://airtable.com) and sign in
2. Click "Add a base" → "Start from scratch"
3. Name your base: "FNT Motor Group - Car Sales"

### 1.2 Create the Table Structure
Create a table called "Car Sales Leads" with these fields:

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
| Notes | Long text | Internal notes |

### 1.3 Set Default Values
- **Submission Date**: Set to "Now" (automatic)
- **Status**: Set default to "New"

## Step 2: Get Airtable API Credentials

### 2.1 Generate API Key
1. Go to [Airtable Account](https://airtable.com/account)
2. Scroll to "API" section
3. Click "Generate new token"
4. Name: "FNT Motor Group Website"
5. Scopes: Select "data.records:write" and "data.records:read"
6. Access: Select your "FNT Motor Group - Car Sales" base
7. Copy the generated token (starts with `pat...`)

### 2.2 Get Base ID
1. Go to [Airtable API Documentation](https://airtable.com/developers/web/api/introduction)
2. Click on your base
3. Copy the Base ID (starts with `app...`)

## Step 3: Update Your Website

### 3.1 Install Airtable Package
```bash
npm install airtable
```

### 3.2 Create Environment Variables
Add to your `.env` file:
```env
VITE_AIRTABLE_API_KEY=your_api_key_here
VITE_AIRTABLE_BASE_ID=your_base_id_here
VITE_AIRTABLE_TABLE_NAME=Car Sales Leads
```

### 3.3 Update SellCarModal Component
Replace the `handleSubmit` function in `SellCarModal.tsx`:

```typescript
import Airtable from 'airtable';

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsSubmitting(true);

  try {
    const base = new Airtable({ 
      apiKey: import.meta.env.VITE_AIRTABLE_API_KEY 
    }).base(import.meta.env.VITE_AIRTABLE_BASE_ID);

    const records = await base(import.meta.env.VITE_AIRTABLE_TABLE_NAME).create([
      {
        fields: {
          "First Name": formData.firstName,
          "Last Name": formData.lastName,
          "Phone Number": formData.phoneNumber,
          "Car Registration": formData.carRegistration,
          "Mileage": parseInt(formData.mileage.replace(/,/g, '')),
          "Make & Model": formData.makeModel,
          "Additional Info": formData.additionalInfo,
          "Submission Date": new Date().toISOString().split('T')[0],
          "Status": "New"
        }
      }
    ]);

    console.log('Record created:', records[0].id);
    
    alert('Thank you! We\'ll contact you soon about your car.');
    onClose();
    
    // Reset form
    setFormData({
      firstName: '',
      lastName: '',
      phoneNumber: '',
      carRegistration: '',
      mileage: '',
      makeModel: '',
      additionalInfo: ''
    });
  } catch (error) {
    console.error('Error submitting to Airtable:', error);
    alert('Sorry, there was an error. Please try again.');
  } finally {
    setIsSubmitting(false);
  }
};
```

## Step 4: Test the Integration

### 4.1 Test Form Submission
1. Fill out the "Sell Your Car" form
2. Submit the form
3. Check your Airtable base to see if the record was created

### 4.2 Verify Data
- Check that all fields are populated correctly
- Verify the submission date is set
- Confirm the status is "New"

## Step 5: Set Up Notifications (Optional)

### 5.1 Email Notifications
1. In Airtable, go to "Automations"
2. Create a new automation: "New Lead Notification"
3. Trigger: "When a record is created"
4. Action: "Send email"
5. Set up email template for new leads

### 5.2 Slack Integration (Optional)
1. Install Airtable Slack app
2. Set up webhook for new records
3. Get notifications in your team Slack channel

## Step 6: Deploy to Netlify

### 6.1 Add Environment Variables to Netlify
1. Go to your Netlify dashboard
2. Site settings → Environment variables
3. Add:
   - `VITE_AIRTABLE_API_KEY`
   - `VITE_AIRTABLE_BASE_ID`
   - `VITE_AIRTABLE_TABLE_NAME`

### 6.2 Redeploy
1. Push your changes to GitHub
2. Netlify will automatically redeploy
3. Test the live form

## Troubleshooting

### Common Issues:
1. **CORS Errors**: Make sure your domain is added to Airtable's allowed origins
2. **API Key Issues**: Verify the API key has correct permissions
3. **Field Name Mismatches**: Ensure field names in code match Airtable exactly
4. **Data Type Errors**: Check that data types match (e.g., Mileage should be number)

### Testing Checklist:
- [ ] Form opens when clicking "Sell Your Car" card
- [ ] All fields are required and validated
- [ ] Form submits successfully
- [ ] Data appears in Airtable
- [ ] Success message shows
- [ ] Form resets after submission
- [ ] Error handling works

## Security Notes

1. **API Key Security**: Never commit API keys to version control
2. **Rate Limiting**: Airtable has rate limits (5 requests per second)
3. **Data Privacy**: Ensure GDPR compliance for customer data
4. **Validation**: Always validate data on both client and server side

## Next Steps

1. Set up automated follow-up emails
2. Create a dashboard to view all leads
3. Add lead scoring based on car value
4. Integrate with CRM system
5. Set up appointment booking

## Support

If you need help with the integration:
1. Check Airtable's [API documentation](https://airtable.com/developers/web/api/introduction)
2. Review the [Airtable community forums](https://community.airtable.com/)
3. Test with Airtable's [API explorer](https://airtable.com/developers/web/api/introduction)
