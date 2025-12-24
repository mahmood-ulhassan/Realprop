const express = require("express");
const { createLead, listLeads, updateLead, addRemark } = require("../controllers/leads.controller");
const { authenticateToken } = require("../middleware/auth.middleware");

const router = express.Router();

// Protected routes - require authentication
router.post("/", authenticateToken, createLead);
router.get("/", authenticateToken, listLeads);
router.put("/:id", authenticateToken, updateLead);
router.post("/:id/remarks", authenticateToken, addRemark);

module.exports = router;

