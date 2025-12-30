/**
 * Google Places API Service
 * Fetches places based on location and type/industry via backend proxy
 * 
 * Note: Google Places API does not provide email addresses directly.
 * Email addresses would need to be scraped from websites or obtained through other means.
 */

import api from './api';

/**
 * Search for places using Google Places API with pagination support
 * @param {string} city - City name
 * @param {string} area - Area name
 * @param {string} industry - Industry/type (e.g., "restaurants", "shops", "offices")
 * @returns {Promise<Array>} Array of place objects with name, phone, website, rating, address
 * Note: Google Places API maximum is 60 results per search
 */
async function searchPlaces(city, area, industry) {
  try {
    // Call our backend API which proxies to Google Places API
    // This avoids CORS issues
    // Defaults to 60 (Google's maximum) if not specified
    const response = await api.post('/google-places/search', {
      city,
      area,
      industry
    });

    return response.data;
  } catch (err) {
    console.error('Error searching places:', err);
    throw new Error(err.response?.data?.message || err.message || 'Failed to search places');
  }
}

export default {
  searchPlaces
};

