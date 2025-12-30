const express = require("express");
const { searchPlaces } = require("../controllers/googlePlaces.controller");
const { authenticateToken } = require("../middleware/auth.middleware");

const router = express.Router();

// Search places - requires authentication
router.post("/search", authenticateToken, searchPlaces);

module.exports = router;

