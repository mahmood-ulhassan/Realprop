/**
 * Scraper Service
 * Scrapes websites for Facebook IDs, Instagram IDs, and email addresses
 */

import api from './api';

/**
 * Scrape a single website
 * @param {string} url - Website URL to scrape
 * @returns {Promise<Object>} Scraped data (emails, facebookIds, instagramIds)
 */
async function scrapeWebsite(url) {
  try {
    const response = await api.post('/scraper/scrape', { url });
    return response.data;
  } catch (err) {
    console.error('Error scraping website:', err);
    throw new Error(err.response?.data?.message || err.message || 'Failed to scrape website');
  }
}

/**
 * Scrape multiple websites
 * @param {Array<string>} urls - Array of website URLs to scrape
 * @returns {Promise<Object>} Batch scraping results
 */
async function scrapeBatch(urls) {
  try {
    const response = await api.post('/scraper/scrape-batch', { urls });
    return response.data;
  } catch (err) {
    console.error('Error batch scraping:', err);
    throw new Error(err.response?.data?.message || err.message || 'Failed to scrape websites');
  }
}

export default {
  scrapeWebsite,
  scrapeBatch
};

