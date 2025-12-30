const express = require("express");
const { scrapeWebsite, scrapeBatch } = require("../controllers/scraper.controller");
const { authenticateToken } = require("../middleware/auth.middleware");

const router = express.Router();

// Scrape a single website
router.post("/scrape", authenticateToken, scrapeWebsite);

// Scrape multiple websites
router.post("/scrape-batch", authenticateToken, scrapeBatch);

module.exports = router;

