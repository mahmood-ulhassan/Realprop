const express = require("express");
const { getMetrics } = require("../controllers/dashboard.controller");
const { authenticateToken } = require("../middleware/auth.middleware");

const router = express.Router();

// Protected route - require authentication
router.get("/metrics", authenticateToken, getMetrics);

module.exports = router;

