# Google Places API Key Setup Guide

## Step 1: Get Your Google Places API Key

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Sign in with your Google account

2. **Create a New Project (or select existing)**
   - Click on the project dropdown at the top
   - Click "New Project"
   - Enter project name: "RealProp" (or any name you prefer)
   - Click "Create"

3. **Enable Google Places API**
   - In the left sidebar, go to "APIs & Services" > "Library"
   - Search for "Places API"
   - Click on "Places API" (the one by Google)
   - Click "Enable"

4. **Create API Key**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Your API key will be displayed
   - **Important**: Click "Restrict Key" to secure it:
     - Under "API restrictions", select "Restrict key"
     - Check "Places API"
     - Under "Application restrictions", you can restrict by HTTP referrer (for web) or IP address
     - For local development, you can skip restrictions or add `http://localhost:*`
   - Click "Save"

5. **Copy Your API Key**
   - Copy the generated API key (it will look like: `AIzaSy...`)

## Step 2: Add API Key to Your Project

1. **Open the `.env` file** in the `Frontend` folder
2. **Replace the placeholder** with your actual API key:
   ```
   VITE_GOOGLE_PLACES_API_KEY=AIzaSyYourActualKeyHere
   ```
3. **Save the file**

## Step 3: Restart Your Development Server

After adding the API key, restart your frontend development server:

```bash
# Stop the current server (Ctrl+C)
# Then restart:
cd Frontend
npm run dev
```

## Step 4: Test the Functionality

1. Go to the "Generate Leads" page in your app
2. Select:
   - City: e.g., "Islamabad"
   - Area: e.g., "I-8"
   - Industry: e.g., "restaurants"
3. Click "Generate"
4. You should see results appear in the table

## Important Notes

- **API Costs**: Google Places API has usage-based pricing. The first $200/month is free (as of 2024), then you pay per request. Monitor your usage in Google Cloud Console.

- **Rate Limits**: Be mindful of API rate limits. The current implementation fetches up to 60 results (3 pages) per search.

- **Email Limitation**: Google Places API does NOT provide email addresses. The email column will always show "N/A". To get emails, you would need to:
  - Scrape them from websites (if available)
  - Use a third-party service
  - Manually collect them

## For Production (Digital Ocean)

When deploying to Digital Ocean, add the API key as an environment variable:

1. Go to your Digital Ocean App Platform dashboard
2. Select your Frontend component
3. Go to "Settings" > "Environment Variables"
4. Add:
   - Key: `VITE_GOOGLE_PLACES_API_KEY`
   - Value: Your actual API key
5. Save and redeploy

## Troubleshooting

### "Google Places API key is not configured" error
- Make sure `VITE_GOOGLE_PLACES_API_KEY` is in your `.env` file
- Restart your development server after adding the key
- Check that the key doesn't have extra spaces or quotes

### "REQUEST_DENIED" error
- Check that Places API is enabled in Google Cloud Console
- Verify your API key restrictions allow the requests
- Make sure billing is enabled in your Google Cloud project

### No results appearing
- Check browser console for errors
- Verify your API key is correct
- Check Google Cloud Console for API usage and errors

## Need Help?

- Google Places API Documentation: https://developers.google.com/maps/documentation/places/web-service
- Google Cloud Console: https://console.cloud.google.com/
- API Pricing: https://developers.google.com/maps/billing-and-pricing/pricing

