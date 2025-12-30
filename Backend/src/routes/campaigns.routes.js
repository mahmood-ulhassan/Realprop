const express = require("express");
const router = express.Router();
const { 
  createCampaign, 
  listCampaigns, 
  getCampaign, 
  updateCampaign, 
  deleteCampaign,
  getAllCampaignLeads,
  updateLeadStatus,
  addRemark
} = require("../controllers/campaigns.controller");
const { authenticateToken } = require("../middleware/auth.middleware");

// All routes require authentication
router.use(authenticateToken);

// Admin only routes
router.post("/", (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Only admins can create campaigns" });
  }
  next();
}, createCampaign);

// Allow both admin and manager to list campaigns (managers see only their assigned campaigns)
router.get("/", listCampaigns);

// This route must come before /:id to avoid conflicts
router.get("/leads/all", getAllCampaignLeads);

router.get("/:id", getCampaign);

router.put("/:id", (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Only admins can update campaigns" });
  }
  next();
}, updateCampaign);

router.delete("/:id", (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Only admins can delete campaigns" });
  }
  next();
}, deleteCampaign);

router.put("/leads/:id", updateLeadStatus);

router.post("/leads/:id/remarks", addRemark);

module.exports = router;

