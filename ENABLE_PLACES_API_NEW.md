# Enable Places API (New) in Google Cloud Console

## Quick Steps:

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Make sure you're in the correct project

2. **Enable Places API (New)**
   - Go to "APIs & Services" > "Library"
   - Search for "Places API (New)" (NOT "Places API" - that's the legacy one)
   - Click on "Places API (New)"
   - Click "Enable"

3. **Verify Your API Key**
   - Go to "APIs & Services" > "Credentials"
   - Find your API key (it will look like: `AIzaSy...`)
   - Make sure it has access to "Places API (New)"

4. **Restart Your Backend Server**
   - After enabling the API, restart your backend server

## Alternative: Enable Legacy API (If New API Doesn't Work)

If you prefer to use the legacy API temporarily:

1. Go to "APIs & Services" > "Library"
2. Search for "Places API" (the legacy one)
3. Click "Enable"
4. Restart your backend server

**Note:** The code has been updated to use the new Places API, which is the recommended approach for long-term use.

