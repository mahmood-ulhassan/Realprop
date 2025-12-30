/**
 * Google Places API Controller
 * Proxies requests to Google Places API to avoid CORS issues
 */

// Import scraper helper function
const { scrapeWebsiteHelper } = require('./scraper.controller');

// Read API key from environment (will be loaded by dotenv.config() in server.js)
function getGooglePlacesApiKey() {
  return process.env.GOOGLE_PLACES_API_KEY;
}

/**
 * Search for places using Google Places API
 * POST /api/google-places/search
 */
async function searchPlaces(req, res) {
  try {
    const { city, area, industry, maxLeads } = req.body;

    if (!city || !area || !industry) {
      return res.status(400).json({ 
        message: 'City, area, and industry are required' 
      });
    }

    // Set maxLeads to 60 (Google Places API maximum: 3 pages × 20 results = 60)
    // Note: Google Places API has a hard limit of 60 results maximum
    const limit = 60;

    const GOOGLE_PLACES_API_KEY = getGooglePlacesApiKey();
    
    if (!GOOGLE_PLACES_API_KEY) {
      console.error('❌ GOOGLE_PLACES_API_KEY is missing from environment variables');
      console.log('Available env vars:', Object.keys(process.env).filter(k => k.includes('GOOGLE')));
      console.log('All env vars starting with GOOGLE:', process.env.GOOGLE_PLACES_API_KEY ? 'Found' : 'Not found');
      return res.status(500).json({ 
        message: 'Google Places API key is not configured on the server. Please restart the backend server after adding GOOGLE_PLACES_API_KEY to Backend/.env' 
      });
    }

    // Build search query
    const query = `${industry} in ${area}, ${city}, Pakistan`;
    let allPlaces = [];
    let nextPageToken = null;
    let pageCount = 0;
    const resultsPerPage = 20; // Results per page (Google API limit)
    const maxPages = 3; // Google Places API hard limit: maximum 3 pages (60 results total)
    const effectiveLimit = Math.min(limit, 60); // Cap at Google's maximum

    do {
      // Use Google Places API (New) - Text Search endpoint
      // Note: The new API uses POST requests with a different structure
      const requestBody = {
        textQuery: query,
        maxResultCount: resultsPerPage,
        ...(nextPageToken && { pageToken: nextPageToken })
      };

      // Field mask - include nextPageToken to ensure it's returned
      const fieldMask = 'places.id,places.displayName,places.formattedAddress,places.rating,places.nationalPhoneNumber,places.internationalPhoneNumber,places.websiteUri,nextPageToken';
      
      const response = await fetch(
        `https://places.googleapis.com/v1/places:searchText`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
            'X-Goog-FieldMask': fieldMask
          },
          body: JSON.stringify(requestBody)
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Google Places API error response:', errorText);
        throw new Error(`Google Places API error: ${response.statusText}`);
      }

      const data = await response.json();

      // Check for errors in new API format
      if (data.error) {
        throw new Error(`Google Places API error: ${data.error.code || 'UNKNOWN'} - ${data.error.message || 'Unknown error'}`);
      }

      // Debug: Log the response structure (only on first page to avoid spam)
      if (pageCount === 0) {
        console.log(`🔍 First page response structure:`);
        console.log(`   - Response keys:`, Object.keys(data));
        console.log(`   - Has 'places' array:`, !!data.places);
        console.log(`   - Places count:`, data.places?.length || 0);
        console.log(`   - Has 'nextPageToken':`, !!data.nextPageToken);
        console.log(`   - Has 'next_page_token':`, !!data.next_page_token);
        console.log(`   - Has 'nextPageToken' value:`, data.nextPageToken ? data.nextPageToken.substring(0, 50) : 'null');
        // Log a sample of the response to see structure
        const sampleResponse = {
          keys: Object.keys(data),
          placesCount: data.places?.length || 0,
          hasNextPageToken: !!data.nextPageToken,
          nextPageTokenPreview: data.nextPageToken ? data.nextPageToken.substring(0, 50) : null
        };
        console.log(`   - Sample response:`, JSON.stringify(sampleResponse, null, 2));
      }

      // New API returns places in data.places array
      if (!data.places || data.places.length === 0) {
        console.log('⚠️ No places found in this page. Stopping.');
        break;
      }

      // Process places from new API format
      // Note: Email is not available through Google Places API
      const placesWithDetails = data.places.map((place) => {
        return {
          name: place.displayName?.text || 'N/A',
          address: place.formattedAddress || 'N/A',
          rating: place.rating || null,
          phone: place.nationalPhoneNumber || place.internationalPhoneNumber || 'N/A',
          email: 'N/A', // Email not available via Google Places API
          website: place.websiteUri || 'N/A',
          placeId: place.id
        };
      });

      allPlaces = allPlaces.concat(placesWithDetails);
      pageCount++;

      // Check for nextPageToken in various possible locations
      // The new Google Places API should return it as 'nextPageToken' at root level
      // But let's check all possible locations
      nextPageToken = data.nextPageToken || data.next_page_token || data.nextToken || data['nextPageToken'] || null;
      
      // Additional check: sometimes it might be nested
      if (!nextPageToken && data.response) {
        nextPageToken = data.response.nextPageToken || null;
      }
      
      console.log(`📄 Page ${pageCount}: Found ${placesWithDetails.length} places. Total so far: ${allPlaces.length}`);
      if (nextPageToken) {
        console.log(`   ✅ Next page token found: ${nextPageToken.substring(0, 30)}...`);
      } else {
        console.log(`   ❌ No next page token found. Response keys:`, Object.keys(data));
      }

      // Stop if we've reached the limit (60)
      if (allPlaces.length >= effectiveLimit) {
        allPlaces = allPlaces.slice(0, effectiveLimit); // Trim to exact limit
        console.log(`✅ Reached limit of ${effectiveLimit} leads. Stopping pagination.`);
        break;
      }

      // Break if we've reached max pages (3 pages = 60 results max)
      if (pageCount >= maxPages) {
        console.log(`⚠️ Reached maximum page limit (${maxPages} pages). Stopping pagination.`);
        break;
      }

      // Break if no more pages available
      if (!nextPageToken) {
        console.log(`ℹ️ No more pages available (no nextPageToken). Total results: ${allPlaces.length}`);
        console.log(`   This might mean:`);
        console.log(`   - Only ${allPlaces.length} results available for this search`);
        console.log(`   - API doesn't support pagination for this query`);
        console.log(`   - nextPageToken field name is different`);
        break;
      }

      // Wait a bit before next request (Google requires delay between pagination requests)
      // The token needs time to become valid
      console.log(`⏳ Waiting 2 seconds before fetching next page (token needs time to become valid)...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    } while (nextPageToken && pageCount < maxPages);

    console.log(`✅ Total places found: ${allPlaces.length}`);

    // Automatically scrape websites for all places that have websites
    console.log(`\n🔍 Starting automatic website scraping for ${allPlaces.length} places...`);
    
    const placesWithScrapedData = [];
    
    // Process places sequentially to avoid overwhelming servers
    for (let i = 0; i < allPlaces.length; i++) {
      const place = allPlaces[i];
      
      // If no website, return place with N/A for scraped fields
      if (!place.website || place.website === 'N/A') {
        placesWithScrapedData.push({
          ...place,
          email: 'N/A',
          instagram: 'N/A',
          facebook: 'N/A'
        });
        continue;
      }

      try {
        // Scrape the website
        const scrapedData = await scrapeWebsiteHelper(place.website);
        
        placesWithScrapedData.push({
          ...place,
          email: scrapedData.email || 'N/A',
          instagram: scrapedData.instagram || 'N/A',
          facebook: scrapedData.facebook || 'N/A'
        });
        
        console.log(`   [${i + 1}/${allPlaces.length}] Scraped ${place.name}: email=${scrapedData.email !== 'N/A' ? '✓' : 'N/A'}, facebook=${scrapedData.facebook !== 'N/A' ? '✓' : 'N/A'}, instagram=${scrapedData.instagram !== 'N/A' ? '✓' : 'N/A'}`);
        
        // Small delay between requests to be respectful
        if (i < allPlaces.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (error) {
        // If scraping fails, continue silently and show N/A
        console.log(`   ⚠️ [${i + 1}/${allPlaces.length}] Failed to scrape ${place.website}: ${error.message}`);
        placesWithScrapedData.push({
          ...place,
          email: 'N/A',
          instagram: 'N/A',
          facebook: 'N/A'
        });
      }
    }

    console.log(`✅ Scraping completed for all places`);

    return res.json(placesWithScrapedData);
  } catch (err) {
    console.error('Error searching places:', err);
    return res.status(500).json({ 
      message: err.message || 'Failed to search places' 
    });
  }
}

module.exports = {
  searchPlaces
};

