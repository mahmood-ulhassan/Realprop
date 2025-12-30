/**
 * Web Scraper Controller
 * Scrapes websites for Facebook IDs, Instagram IDs, and email addresses
 */

const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Helper function to scrape a website programmatically (without req/res)
 * Returns scraped data directly
 */
async function scrapeWebsiteHelper(url) {
  try {
    // Ensure URL has protocol
    let targetUrl = url.trim();
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl;
    }

    // Fetch the webpage with timeout
    const response = await axios.get(targetUrl, {
      timeout: 10000, // 10 seconds timeout
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      maxRedirects: 5
    });

    const html = response.data;
    const $ = cheerio.load(html);

    // Extract text content from the page
    const pageText = $('body').text();
    
    // Extract from HTML attributes
    const allLinks = [];
    const allAttributes = [];
    
    $('a[href]').each((i, elem) => {
      const href = $(elem).attr('href');
      const title = $(elem).attr('title');
      const text = $(elem).text();
      if (href) allLinks.push(href);
      if (title) allAttributes.push(title);
      if (text) allAttributes.push(text);
    });
    
    $('link[href]').each((i, elem) => {
      const href = $(elem).attr('href');
      if (href) allLinks.push(href);
    });
    
    $('[title], [alt]').each((i, elem) => {
      const title = $(elem).attr('title');
      const alt = $(elem).attr('alt');
      if (title) allAttributes.push(title);
      if (alt) allAttributes.push(alt);
    });
    
    const linksText = allLinks.join(' ');
    const attributesText = allAttributes.join(' ');
    const combinedText = pageText + ' ' + linksText + ' ' + attributesText + ' ' + html;

    // Extract data
    let email = '';
    let facebookUrl = '';
    let instagramUrl = '';
    
    try {
      email = extractEmails(combinedText, $) || '';
    } catch (e) {
      email = '';
    }
    
    try {
      facebookUrl = extractFacebook(html, $) || '';
    } catch (e) {
      facebookUrl = '';
    }
    
    try {
      instagramUrl = extractInstagram(html, $) || '';
    } catch (e) {
      instagramUrl = '';
    }

    // Ensure all values are strings
    email = typeof email === 'string' ? email : '';
    facebookUrl = typeof facebookUrl === 'string' ? facebookUrl : '';
    instagramUrl = typeof instagramUrl === 'string' ? instagramUrl : '';

    return {
      email: email || 'N/A',
      facebook: facebookUrl || 'N/A',
      instagram: instagramUrl || 'N/A'
    };

  } catch (error) {
    // Return N/A for all fields on error
    return {
      email: 'N/A',
      facebook: 'N/A',
      instagram: 'N/A'
    };
  }
}

/**
 * Extract email addresses from text/HTML with multiple strategies
 */
function extractEmails(text, $ = null) {
  try {
    if (!text || typeof text !== 'string') {
      return '';
    }
    const emails = new Set();
  
  // Strategy 1: Standard email regex
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const standardEmails = text.match(emailRegex) || [];
  standardEmails.forEach(email => emails.add(email.toLowerCase()));
  
  // Strategy 2: Handle obfuscated emails (email [at] domain [dot] com)
  const obfuscatedPatterns = [
    /([a-zA-Z0-9._%+-]+)\s*\[?\s*at\s*\]?\s*([a-zA-Z0-9.-]+)\s*\[?\s*dot\s*\]?\s*([a-zA-Z]{2,})/gi,
    /([a-zA-Z0-9._%+-]+)\s*\(at\)\s*([a-zA-Z0-9.-]+)\s*\(dot\)\s*([a-zA-Z]{2,})/gi,
    /([a-zA-Z0-9._%+-]+)\s*@\s*([a-zA-Z0-9.-]+)\s*\.\s*([a-zA-Z]{2,})/gi
  ];
  
  obfuscatedPatterns.forEach(pattern => {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      if (match[1] && match[2] && match[3]) {
        const email = `${match[1]}@${match[2]}.${match[3]}`.toLowerCase();
        emails.add(email);
      }
    }
  });
  
  // Strategy 3: Search entire HTML for mailto: links (comprehensive)
  // First, search raw HTML string for all mailto: occurrences
  const mailtoRegex = /mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;
  const mailtoMatches = text.matchAll(mailtoRegex);
  for (const match of mailtoMatches) {
    if (match[1]) {
      const email = match[1].trim().toLowerCase();
      if (email && email.includes('@')) {
        emails.add(email);
      }
    }
  }
  
  // Strategy 3b: Extract from mailto links using cheerio (if available)
  if ($) {
    // Check ALL links for mailto: (case-insensitive, anywhere in href)
    $('a[href]').each((i, elem) => {
      const href = $(elem).attr('href');
      if (href) {
        const hrefLower = href.toLowerCase();
        if (hrefLower.includes('mailto:')) {
          // Extract email from mailto: link - handle various formats
          let email = href.replace(/^mailto:/i, '').trim();
          // Remove query parameters and fragments
          email = email.split('?')[0].split('&')[0].split('#')[0].trim();
          // Clean up - keep only valid email characters
          email = email.replace(/[^a-zA-Z0-9._%+-@]/g, '');
          if (email && email.includes('@') && emailRegex.test(email)) {
            emails.add(email.toLowerCase());
          }
        }
      }
      
      // Also extract from the text content of ALL links (not just mailto)
      const linkText = $(elem).text().trim();
      if (linkText) {
        const found = linkText.match(emailRegex);
        if (found) {
          found.forEach(e => {
            const cleanEmail = e.trim().toLowerCase();
            if (cleanEmail && cleanEmail.includes('@')) {
              emails.add(cleanEmail);
            }
          });
        }
      }
    });
    
    // Check data attributes for mailto links
    $('[data-href*="mailto:"], [data-url*="mailto:"], [data-email], [data-mail]').each((i, elem) => {
      const attr = $(elem).attr('data-href') || $(elem).attr('data-url') || 
                   $(elem).attr('data-email') || $(elem).attr('data-mail');
      if (attr) {
        if (attr.toLowerCase().includes('mailto:')) {
          let email = attr.replace(/^mailto:/i, '').trim();
          email = email.split('?')[0].split('&')[0].split('#')[0].trim();
          if (email && email.includes('@')) {
            emails.add(email.toLowerCase());
          }
        } else {
          const found = attr.match(emailRegex);
          if (found) found.forEach(e => emails.add(e.toLowerCase()));
        }
      }
    });
    
    // Strategy 4: Extract from meta tags
    $('meta[property*="email"], meta[name*="email"], meta[itemprop*="email"]').each((i, elem) => {
      const content = $(elem).attr('content');
      if (content) {
        const found = content.match(emailRegex);
        if (found) found.forEach(e => emails.add(e.toLowerCase()));
      }
    });
    
    // Strategy 5: Extract from data attributes
    $('[data-email], [data-contact-email], [data-mail]').each((i, elem) => {
      const email = $(elem).attr('data-email') || $(elem).attr('data-contact-email') || $(elem).attr('data-mail');
      if (email) {
        const found = email.match(emailRegex);
        if (found) found.forEach(e => emails.add(e.toLowerCase()));
      }
    });
    
    // Strategy 6: Extract from JSON-LD structured data
    $('script[type="application/ld+json"]').each((i, elem) => {
      try {
        const jsonText = $(elem).html();
        const jsonData = JSON.parse(jsonText);
        const jsonString = JSON.stringify(jsonData);
        const found = jsonString.match(emailRegex);
        if (found) found.forEach(e => emails.add(e.toLowerCase()));
      } catch (e) {
        // Invalid JSON, skip
      }
    });
    
    // Strategy 7: Extract from all script tags (might contain JSON with emails)
    $('script').each((i, elem) => {
      const scriptContent = $(elem).html() || '';
      const found = scriptContent.match(emailRegex);
      if (found) found.forEach(e => emails.add(e.toLowerCase()));
    });
    
    // Strategy 8: Extract from contact/about page links
    $('a[href*="contact"], a[href*="about"], a[href*="reach"], a[href*="connect"]').each((i, elem) => {
      const text = $(elem).text();
      const found = text.match(emailRegex);
      if (found) found.forEach(e => emails.add(e.toLowerCase()));
    });
  }
  
  // Filter out common false positives
  const filteredEmails = Array.from(emails).filter(email => {
    const lower = email.toLowerCase();
    return !lower.includes('example.com') && 
           !lower.includes('test.com') && 
           !lower.includes('placeholder') &&
           !lower.includes('your-email') &&
           !lower.includes('email@domain') &&
           !lower.includes('noreply') &&
           !lower.includes('no-reply') &&
           !lower.includes('donotreply') &&
           !lower.endsWith('.png') &&
           !lower.endsWith('.jpg') &&
           !lower.endsWith('.gif') &&
           !lower.endsWith('.svg') &&
           lower.length > 5 && // Minimum email length
           lower.includes('@') &&
           lower.split('@')[1] && // Has domain part
           lower.split('@')[1].includes('.'); // Domain has TLD
  });
  
    // Return first valid email, or empty string (ensure it's always a string)
    const result = filteredEmails.length > 0 ? filteredEmails[0] : '';
    return typeof result === 'string' ? result : '';
  } catch (error) {
    console.error('Error in extractEmails:', error);
    return '';
  }
}

/**
 * Extract Facebook URLs from text/HTML - Returns full URLs
 */
function extractFacebook(html, $ = null) {
  try {
    if (!html || typeof html !== 'string') {
      return '';
    }
    const facebookUrls = new Set();
  
  // Pattern to match full Facebook URLs
  const fullUrlPattern = /(https?:\/\/(?:www\.)?(?:facebook\.com|fb\.com)\/[a-zA-Z0-9._-]+(?:\?[^\s"'>]*)?)/gi;
  
  // Pattern to extract IDs and build URLs
  const idPatterns = [
    /(?:https?:\/\/)?(?:www\.)?(?:facebook\.com|fb\.com)\/([a-zA-Z0-9._-]+)/gi,
    /(?:https?:\/\/)?(?:www\.)?(?:facebook\.com|fb\.com)\/profile\.php\?id=([0-9]+)/gi,
    /facebook\.com\/([a-zA-Z0-9._-]+)/gi,
    /fb\.com\/([a-zA-Z0-9._-]+)/gi
  ];
  
  // First, extract full URLs directly
  const fullUrlMatches = html.matchAll(fullUrlPattern);
  for (const match of fullUrlMatches) {
    if (match[1]) {
      const url = match[1].trim();
      if (!url.includes('share') && !url.includes('sharer') && !url.includes('dialog') && 
          !url.includes('plugins') && !url.includes('widget')) {
        // Clean URL - remove query params except for profile.php?id
        const cleanUrl = url.split('?')[0] + (url.includes('profile.php') ? '?' + url.split('?')[1] : '');
        facebookUrls.add(cleanUrl);
      }
    }
  }
  
  // If cheerio is available, extract from ALL attributes
  if ($) {
    // Check all href attributes - prefer full URLs
    $('[href*="facebook"], [href*="fb.com"]').each((i, elem) => {
      const href = $(elem).attr('href');
      if (href) {
        // If it's already a full URL
        if (href.startsWith('http://') || href.startsWith('https://')) {
          if (!href.includes('share') && !href.includes('sharer') && !href.includes('dialog')) {
            const cleanUrl = href.split('?')[0] + (href.includes('profile.php') ? '?' + href.split('?')[1] : '');
            facebookUrls.add(cleanUrl);
          }
        } else {
          // Relative URL - extract ID and build full URL
          idPatterns.forEach(pattern => {
            const match = href.match(pattern);
            if (match && match[1]) {
              const id = match[1].trim();
              if (id && !id.includes('share') && !id.includes('sharer')) {
                facebookUrls.add(`https://www.facebook.com/${id}`);
              }
            }
          });
        }
      }
    });
    
    // Check data attributes
    $('[data-href*="facebook"], [data-url*="facebook"], [data-facebook], [data-fb]').each((i, elem) => {
      const attr = $(elem).attr('data-href') || $(elem).attr('data-url') || 
                   $(elem).attr('data-facebook') || $(elem).attr('data-fb');
      if (attr) {
        if (attr.startsWith('http://') || attr.startsWith('https://')) {
          if (!attr.includes('share') && !attr.includes('sharer')) {
            facebookUrls.add(attr.split('?')[0]);
          }
        } else {
          idPatterns.forEach(pattern => {
            const match = attr.match(pattern);
            if (match && match[1]) {
              const id = match[1].trim();
              if (id) facebookUrls.add(`https://www.facebook.com/${id}`);
            }
          });
        }
      }
    });
  }
  
  // Also search HTML string for IDs and build URLs
  idPatterns.forEach(pattern => {
    const matches = html.matchAll(pattern);
    for (const match of matches) {
      if (match[1] && match[1].trim()) {
        const id = match[1].trim();
        if (!id.includes('share') && !id.includes('sharer') && !id.includes('dialog') && 
            !id.includes('plugins') && !id.includes('widget') && id.length > 0) {
          facebookUrls.add(`https://www.facebook.com/${id}`);
        }
      }
    }
  });
  
    const urls = Array.from(facebookUrls).filter(url => url && url.length > 0);
    // Return first valid URL, or empty string (ensure it's always a string)
    const result = urls.length > 0 ? urls[0] : '';
    return typeof result === 'string' ? result : '';
  } catch (error) {
    console.error('Error in extractFacebook:', error);
    return '';
  }
}

/**
 * Extract Instagram URLs from text/HTML - Returns full URLs
 */
function extractInstagram(html, $ = null) {
  try {
    if (!html || typeof html !== 'string') {
      return '';
    }
    const instagramUrls = new Set();
  
  // Pattern to match full Instagram URLs
  const fullUrlPattern = /(https?:\/\/(?:www\.)?instagram\.com\/[a-zA-Z0-9_.]+(?:\/[^\/\s"'>]*)?)/gi;
  
  // Pattern to extract usernames and build URLs
  const usernamePatterns = [
    /(?:https?:\/\/)?(?:www\.)?instagram\.com\/([a-zA-Z0-9_.]+)/gi,
    /instagram\.com\/([a-zA-Z0-9_.]+)/gi,
    /\/instagram\.com\/([a-zA-Z0-9_.]+)/gi
  ];
  
  // First, extract full URLs directly
  const fullUrlMatches = html.matchAll(fullUrlPattern);
  for (const match of fullUrlMatches) {
    if (match[1]) {
      const url = match[1].trim();
      // Filter out posts, reels, etc. - only keep profile URLs
      if (!url.includes('/p/') && !url.includes('/reel/') && !url.includes('/tv/') && 
          !url.includes('/explore') && !url.includes('/accounts') && !url.includes('/about') &&
          !url.includes('/blog') && !url.includes('/share')) {
        const cleanUrl = url.split('?')[0].split('#')[0];
        instagramUrls.add(cleanUrl);
      }
    }
  }
  
  // If cheerio is available, extract from ALL attributes
  if ($) {
    // Check all href attributes - prefer full URLs
    $('[href*="instagram"]').each((i, elem) => {
      const href = $(elem).attr('href');
      if (href) {
        // If it's already a full URL
        if (href.startsWith('http://') || href.startsWith('https://')) {
          if (!href.includes('/p/') && !href.includes('/reel/') && !href.includes('/tv/') &&
              !href.includes('/explore') && !href.includes('/share')) {
            const cleanUrl = href.split('?')[0].split('#')[0];
            instagramUrls.add(cleanUrl);
          }
        } else {
          // Relative URL - extract username and build full URL
          usernamePatterns.forEach(pattern => {
            const match = href.match(pattern);
            if (match && match[1]) {
              const username = match[1].trim();
              if (username && !username.includes('p/') && !username.includes('reel/') &&
                  !username.includes('explore') && !username.includes('share')) {
                instagramUrls.add(`https://www.instagram.com/${username}`);
              }
            }
          });
        }
      }
    });
    
    // Check data attributes
    $('[data-href*="instagram"], [data-url*="instagram"], [data-instagram], [data-ig]').each((i, elem) => {
      const attr = $(elem).attr('data-href') || $(elem).attr('data-url') || 
                   $(elem).attr('data-instagram') || $(elem).attr('data-ig');
      if (attr) {
        if (attr.startsWith('http://') || attr.startsWith('https://')) {
          if (!attr.includes('/p/') && !attr.includes('/reel/') && !attr.includes('/share')) {
            instagramUrls.add(attr.split('?')[0].split('#')[0]);
          }
        } else {
          usernamePatterns.forEach(pattern => {
            const match = attr.match(pattern);
            if (match && match[1]) {
              const username = match[1].trim();
              if (username && !username.includes('p/') && !username.includes('reel/')) {
                instagramUrls.add(`https://www.instagram.com/${username}`);
              }
            }
          });
        }
      }
    });
    
    // Check meta tags (Open Graph, etc.)
    $('meta[property*="instagram"], meta[content*="instagram"]').each((i, elem) => {
      const content = $(elem).attr('content') || $(elem).attr('property');
      if (content) {
        if (content.startsWith('http://') || content.startsWith('https://')) {
          if (!content.includes('/p/') && !content.includes('/reel/')) {
            instagramUrls.add(content.split('?')[0].split('#')[0]);
          }
        } else {
          usernamePatterns.forEach(pattern => {
            const match = content.match(pattern);
            if (match && match[1]) {
              const username = match[1].trim();
              if (username && !username.includes('share')) {
                instagramUrls.add(`https://www.instagram.com/${username}`);
              }
            }
          });
        }
      }
    });
    
    // Check script tags and JSON-LD
    $('script').each((i, elem) => {
      const scriptContent = $(elem).html() || '';
      usernamePatterns.forEach(pattern => {
        const matches = scriptContent.matchAll(pattern);
        for (const match of matches) {
          if (match[1]) {
            const username = match[1].trim();
            if (username && !username.includes('share') && !username.includes('p/') && 
                !username.includes('reel/') && !username.includes('explore')) {
              instagramUrls.add(`https://www.instagram.com/${username}`);
            }
          }
        }
      });
    });
  }
  
  // Also search HTML string for usernames and build URLs
  usernamePatterns.forEach(pattern => {
    const matches = html.matchAll(pattern);
    for (const match of matches) {
      if (match[1] && match[1].trim()) {
        const username = match[1].trim();
        if (!username.includes('share') && !username.includes('p/') && !username.includes('reel/') && 
            !username.includes('tv/') && !username.includes('explore') && !username.includes('accounts') &&
            !username.includes('about') && !username.includes('blog') && username.length > 0) {
          instagramUrls.add(`https://www.instagram.com/${username}`);
        }
      }
    }
  });
  
    const urls = Array.from(instagramUrls).filter(url => url && url.length > 0);
    // Return first valid URL, or empty string (ensure it's always a string)
    const result = urls.length > 0 ? urls[0] : '';
    return typeof result === 'string' ? result : '';
  } catch (error) {
    console.error('Error in extractInstagram:', error);
    return '';
  }
}

/**
 * Scrape a single website URL
 * POST /scraper/scrape
 */
async function scrapeWebsite(req, res) {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ message: 'URL is required' });
    }

    // Ensure URL has protocol
    let targetUrl = url.trim();
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl;
    }

    console.log(`\n🔍 Starting scrape for: ${targetUrl}`);

    try {
      // Fetch the webpage with timeout
      const response = await axios.get(targetUrl, {
        timeout: 10000, // 10 seconds timeout
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        maxRedirects: 5
      });

      const html = response.data;
      const $ = cheerio.load(html);

      // Extract text content from the page (more comprehensive)
      const pageText = $('body').text();
      
      // Extract from HTML attributes (href, src, title, alt, etc.)
      const allLinks = [];
      const allAttributes = [];
      
      $('a[href]').each((i, elem) => {
        const href = $(elem).attr('href');
        const title = $(elem).attr('title');
        const text = $(elem).text();
        if (href) allLinks.push(href);
        if (title) allAttributes.push(title);
        if (text) allAttributes.push(text);
      });
      
      $('link[href]').each((i, elem) => {
        const href = $(elem).attr('href');
        if (href) allLinks.push(href);
      });
      
      // Extract from title and alt attributes
      $('[title], [alt]').each((i, elem) => {
        const title = $(elem).attr('title');
        const alt = $(elem).attr('alt');
        if (title) allAttributes.push(title);
        if (alt) allAttributes.push(alt);
      });
      
      const linksText = allLinks.join(' ');
      const attributesText = allAttributes.join(' ');

      // Combine all text sources for extraction
      const combinedText = pageText + ' ' + linksText + ' ' + attributesText + ' ' + html;

      // Debug: Check for mailto links
      const mailtoLinks = [];
      $('a[href]').each((i, elem) => {
        const href = $(elem).attr('href');
        if (href && href.toLowerCase().includes('mailto:')) {
          mailtoLinks.push(href);
        }
      });
      
      if (mailtoLinks.length > 0) {
        console.log(`   🔍 Found ${mailtoLinks.length} mailto link(s):`, mailtoLinks.slice(0, 3));
      }

      // Extract data - search ENTIRE HTML for comprehensive results
      // Pass raw HTML and cheerio instance for deep extraction
      let email = '';
      let facebookUrl = '';
      let instagramUrl = '';
      
      try {
        email = extractEmails(combinedText, $) || '';
      } catch (e) {
        console.error('Error extracting email:', e);
        email = '';
      }
      
      try {
        facebookUrl = extractFacebook(html, $) || '';
      } catch (e) {
        console.error('Error extracting Facebook:', e);
        facebookUrl = '';
      }
      
      try {
        instagramUrl = extractInstagram(html, $) || '';
      } catch (e) {
        console.error('Error extracting Instagram:', e);
        instagramUrl = '';
      }

      // Ensure all values are strings
      email = typeof email === 'string' ? email : '';
      facebookUrl = typeof facebookUrl === 'string' ? facebookUrl : '';
      instagramUrl = typeof instagramUrl === 'string' ? instagramUrl : '';

      const result = {
        url: targetUrl,
        success: true,
        data: {
          email: email,
          facebook: facebookUrl,
          instagram: instagramUrl
        }
      };
      
      console.log('Extracted data:', { email, facebookUrl, instagramUrl });

      // Log to console
      console.log(`\n✅ Scraping completed for: ${targetUrl}`);
      console.log(`   📧 Email found: ${email || 'None'}`);
      if (mailtoLinks.length > 0 && !email) {
        console.log(`   ⚠️  WARNING: Found ${mailtoLinks.length} mailto link(s) but extracted no email!`);
      }
      console.log(`   📘 Facebook URL found: ${facebookUrl || 'None'}`);
      console.log(`   📷 Instagram URL found: ${instagramUrl || 'None'}`);
      console.log(`   ──────────────────────────────────────────`);

      return res.json(result);

    } catch (error) {
      console.error(`❌ Error scraping ${targetUrl}:`, error.message);
      return res.status(500).json({
        url: targetUrl,
        success: false,
        error: error.message,
        data: {
          email: '',
          facebook: '',
          instagram: ''
        }
      });
    }

  } catch (err) {
    console.error('Error in scrapeWebsite:', err);
    return res.status(500).json({ 
      message: err.message || 'Failed to scrape website' 
    });
  }
}

/**
 * Scrape multiple websites
 * POST /scraper/scrape-batch
 */
async function scrapeBatch(req, res) {
  try {
    const { urls } = req.body;
    
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ message: 'URLs array is required' });
    }

    console.log(`\n🚀 Starting batch scrape for ${urls.length} URLs...`);

    const results = [];
    
    // Process URLs sequentially to avoid overwhelming servers
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      
      try {
        // Ensure URL has protocol
        let targetUrl = url.trim();
        if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
          targetUrl = 'https://' + targetUrl;
        }

        console.log(`\n[${i + 1}/${urls.length}] Scraping: ${targetUrl}`);

        const response = await axios.get(targetUrl, {
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          },
          maxRedirects: 5
        });

        const html = response.data;
        const $ = cheerio.load(html);

        // Extract text content from the page (more comprehensive)
        const pageText = $('body').text();
        
        // Extract from HTML attributes (href, src, title, alt, etc.)
        const allLinks = [];
        const allAttributes = [];
        
        $('a[href]').each((j, elem) => {
          const href = $(elem).attr('href');
          const title = $(elem).attr('title');
          const text = $(elem).text();
          if (href) allLinks.push(href);
          if (title) allAttributes.push(title);
          if (text) allAttributes.push(text);
        });
        
        $('link[href]').each((j, elem) => {
          const href = $(elem).attr('href');
          if (href) allLinks.push(href);
        });
        
        // Extract from title and alt attributes
        $('[title], [alt]').each((j, elem) => {
          const title = $(elem).attr('title');
          const alt = $(elem).attr('alt');
          if (title) allAttributes.push(title);
          if (alt) allAttributes.push(alt);
        });
        
        const linksText = allLinks.join(' ');
        const attributesText = allAttributes.join(' ');
        const combinedText = pageText + ' ' + linksText + ' ' + attributesText + ' ' + html;

        // Debug: Check for mailto links
        const mailtoLinks = [];
        $('a[href]').each((j, elem) => {
          const href = $(elem).attr('href');
          if (href && href.toLowerCase().includes('mailto:')) {
            mailtoLinks.push(href);
          }
        });

        // Extract data - search ENTIRE HTML for comprehensive results
        // Pass raw HTML and cheerio instance for deep extraction
        let email = '';
        let facebookUrl = '';
        let instagramUrl = '';
        
        try {
          email = extractEmails(combinedText, $) || '';
        } catch (e) {
          console.error('Error extracting email:', e);
          email = '';
        }
        
        try {
          facebookUrl = extractFacebook(html, $) || '';
        } catch (e) {
          console.error('Error extracting Facebook:', e);
          facebookUrl = '';
        }
        
        try {
          instagramUrl = extractInstagram(html, $) || '';
        } catch (e) {
          console.error('Error extracting Instagram:', e);
          instagramUrl = '';
        }

        // Ensure all values are strings
        email = typeof email === 'string' ? email : '';
        facebookUrl = typeof facebookUrl === 'string' ? facebookUrl : '';
        instagramUrl = typeof instagramUrl === 'string' ? instagramUrl : '';

        const result = {
          url: targetUrl,
          success: true,
          data: {
            email: email,
            facebook: facebookUrl,
            instagram: instagramUrl
          }
        };

        // Log to console
        console.log(`   ✅ Email: ${email || 'None'}`);
        if (mailtoLinks.length > 0 && !email) {
          console.log(`   ⚠️  WARNING: Found ${mailtoLinks.length} mailto link(s) but extracted no email!`);
        }
        console.log(`   ✅ Facebook: ${facebookUrl || 'None'}`);
        console.log(`   ✅ Instagram: ${instagramUrl || 'None'}`);

        results.push(result);

        // Small delay between requests to be respectful
        if (i < urls.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

      } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
        results.push({
          url: url,
          success: false,
          error: error.message,
          data: {
            email: '',
            facebook: '',
            instagram: ''
          }
        });
      }
    }

    console.log(`\n✅ Batch scraping completed! Processed ${results.length} URLs`);
    console.log(`   Successful: ${results.filter(r => r.success).length}`);
    console.log(`   Failed: ${results.filter(r => !r.success).length}`);

    return res.json({
      total: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results: results
    });

  } catch (err) {
    console.error('Error in scrapeBatch:', err);
    return res.status(500).json({ 
      message: err.message || 'Failed to scrape websites' 
    });
  }
}

module.exports = {
  scrapeWebsite,
  scrapeBatch,
  scrapeWebsiteHelper
};

