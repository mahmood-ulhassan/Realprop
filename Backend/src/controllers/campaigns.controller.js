const Campaign = require("../models/Campaign");
const CampaignLead = require("../models/CampaignLead");
const User = require("../models/User");

/**
 * Create a new campaign with leads
 * POST /campaigns
 * Admin only
 */
async function createCampaign(req, res) {
  try {
    const { name, assignedTo, leads } = req.body;

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Campaign name is required" });
    }

    if (!assignedTo) {
      return res.status(400).json({ message: "assignedTo is required" });
    }

    if (!leads || !Array.isArray(leads) || leads.length === 0) {
      return res.status(400).json({ message: "At least one lead is required" });
    }

    // Verify assigned user exists and is a manager
    const assignedUser = await User.findById(assignedTo);
    if (!assignedUser) {
      return res.status(400).json({ message: "Assigned user not found" });
    }

    if (assignedUser.role !== "manager") {
      return res.status(400).json({ message: "Campaign can only be assigned to a manager" });
    }

    // Create campaign
    const campaign = await Campaign.create({
      name: name.trim(),
      assignedTo: assignedTo,
      status: "pending" // Will be calculated based on leads
    });

    // Create leads for this campaign
    const campaignLeads = leads.map(lead => ({
      campaignId: campaign._id,
      name: lead.name || "N/A",
      phone: lead.phone || "N/A",
      email: lead.email || "N/A",
      website: lead.website || "N/A",
      instagram: lead.instagram || "N/A",
      facebook: lead.facebook || "N/A",
      address: lead.address || "N/A",
      status: "pending" // Default status: pending (yet to be contacted)
    }));

    await CampaignLead.insertMany(campaignLeads);

    // Populate assignedTo
    await campaign.populate("assignedTo", "name email");

    console.log(`✅ Campaign created: ${campaign.name} with ${campaignLeads.length} leads`);

    return res.status(201).json({
      message: "Campaign created successfully",
      campaign: campaign,
      leadsCount: campaignLeads.length
    });
  } catch (err) {
    console.error("❌ Error creating campaign:", err);
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }
    return res.status(500).json({ message: err.message || "Failed to create campaign" });
  }
}

/**
 * Calculate campaign status based on lead statuses
 * - If ANY lead is "pending" → campaign status = "pending"
 * - If NO leads are "pending" (all are "contacted" or "NA") → campaign status = "completed"
 */
async function calculateCampaignStatus(campaignId) {
  const leads = await CampaignLead.find({ campaignId: campaignId });
  
  if (leads.length === 0) {
    return "pending";
  }
  
  // Check if any lead has status "pending"
  const hasPending = leads.some(lead => lead.status === "pending");
  
  if (hasPending) {
    // At least one lead is pending
    return "pending";
  } else {
    // No leads are pending (all are "contacted" or "NA")
    return "completed";
  }
}

/**
 * Get all campaigns with lead counts and calculated status
 * GET /campaigns
 * Admin only
 */
async function listCampaigns(req, res) {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    
    // Build query - managers only see campaigns assigned to them
    let query = {};
    if (userRole === 'manager') {
      query.assignedTo = userId;
    }
    // Admins see all campaigns (no filter)
    
    const campaigns = await Campaign.find(query)
      .populate("assignedTo", "name email")
      .sort({ createdAt: -1 });
    
    // Add lead count and calculate status for each campaign
    const campaignsWithCounts = await Promise.all(
      campaigns.map(async (campaign) => {
        const leadCount = await CampaignLead.countDocuments({ campaignId: campaign._id });
        const calculatedStatus = await calculateCampaignStatus(campaign._id);
        
        // Update campaign status in database if it's different
        if (campaign.status !== calculatedStatus) {
          await Campaign.findByIdAndUpdate(campaign._id, { status: calculatedStatus });
        }
        
        return {
          ...campaign.toObject(),
          leadCount: leadCount,
          status: calculatedStatus
        };
      })
    );
    
    return res.json(campaignsWithCounts);
  } catch (err) {
    console.error("❌ Error listing campaigns:", err);
    return res.status(500).json({ message: err.message || "Failed to list campaigns" });
  }
}

/**
 * Get campaign with leads
 * GET /campaigns/:id
 */
async function getCampaign(req, res) {
  try {
    const { id } = req.params;
    
    const campaign = await Campaign.findById(id)
      .populate("assignedTo", "name email");
    
    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    const leads = await CampaignLead.find({ campaignId: id })
      .sort({ createdAt: -1 });

    return res.json({
      campaign: campaign,
      leads: leads
    });
  } catch (err) {
    console.error("❌ Error getting campaign:", err);
    return res.status(500).json({ message: err.message || "Failed to get campaign" });
  }
}

/**
 * Update campaign (assign to different manager)
 * PUT /campaigns/:id
 */
async function updateCampaign(req, res) {
  try {
    const { id } = req.params;
    const { assignedTo } = req.body;

    if (!assignedTo) {
      return res.status(400).json({ message: "assignedTo is required" });
    }

    // Verify assigned user exists and is a manager
    const assignedUser = await User.findById(assignedTo);
    if (!assignedUser) {
      return res.status(400).json({ message: "Assigned user not found" });
    }

    if (assignedUser.role !== "manager") {
      return res.status(400).json({ message: "Campaign can only be assigned to a manager" });
    }

    const campaign = await Campaign.findByIdAndUpdate(
      id,
      { assignedTo: assignedTo },
      { new: true }
    ).populate("assignedTo", "name email");

    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    console.log(`✅ Campaign updated: ${campaign.name}`);
    return res.json(campaign);
  } catch (err) {
    console.error("❌ Error updating campaign:", err);
    return res.status(500).json({ message: err.message || "Failed to update campaign" });
  }
}

/**
 * Delete campaign
 * DELETE /campaigns/:id
 */
async function deleteCampaign(req, res) {
  try {
    const { id } = req.params;

    const campaign = await Campaign.findById(id);
    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    // Delete all leads associated with this campaign
    await CampaignLead.deleteMany({ campaignId: id });

    // Delete the campaign
    await Campaign.findByIdAndDelete(id);

    console.log(`✅ Campaign deleted: ${campaign.name}`);
    return res.json({ message: "Campaign deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting campaign:", err);
    return res.status(500).json({ message: err.message || "Failed to delete campaign" });
  }
}

/**
 * Get all campaign leads with filters
 * GET /campaigns/leads/all
 */
async function getAllCampaignLeads(req, res) {
  try {
    const { campaignId, status, managerId } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;

    let query = {};

    // If user is a manager, automatically filter by their assigned campaigns
    if (userRole === 'manager') {
      const managerCampaigns = await Campaign.find({ assignedTo: userId });
      const managerCampaignIds = managerCampaigns.map(c => c._id);
      if (managerCampaignIds.length === 0) {
        // Manager has no campaigns, return empty
        return res.json([]);
      }
      // If a specific campaignId is provided, verify it belongs to the manager
      if (campaignId) {
        if (!managerCampaignIds.some(id => id.toString() === campaignId)) {
          // Campaign doesn't belong to manager, return empty
          return res.json([]);
        }
        query.campaignId = campaignId;
      } else {
        // No specific campaign, show all manager's campaigns
        query.campaignId = { $in: managerCampaignIds };
      }
    } else {
      // Admin: Filter by manager (through campaign) - do this first
      if (managerId) {
        const campaigns = await Campaign.find({ assignedTo: managerId });
        const campaignIds = campaigns.map(c => c._id);
        if (campaignIds.length === 0) {
          // No campaigns for this manager, return empty
          return res.json([]);
        }
        // If campaignId is also specified, it must be in the manager's campaigns
        if (campaignId) {
          if (!campaignIds.some(id => id.toString() === campaignId)) {
            return res.json([]);
          }
          query.campaignId = campaignId;
        } else {
          query.campaignId = { $in: campaignIds };
        }
      } else if (campaignId) {
        // Filter by campaign only
        query.campaignId = campaignId;
      }
    }

    // Filter by status
    if (status && ["pending", "contacted", "NA", "hot"].includes(status)) {
      query.status = status;
    }

    const leads = await CampaignLead.find(query)
      .populate({
        path: "campaignId",
        select: "name assignedTo",
        populate: {
          path: "assignedTo",
          select: "name email"
        }
      })
      .populate("remarks.addedBy", "name email")
      .sort({ createdAt: -1 });

    return res.json(leads);
  } catch (err) {
    console.error("❌ Error getting campaign leads:", err);
    return res.status(500).json({ message: err.message || "Failed to get campaign leads" });
  }
}

/**
 * Update lead status
 * PUT /campaigns/leads/:id
 */
async function updateLeadStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !["pending", "contacted", "NA", "hot"].includes(status)) {
      return res.status(400).json({ message: "Valid status is required (pending, contacted, NA, hot)" });
    }

    const lead = await CampaignLead.findByIdAndUpdate(
      id,
      { status: status },
      { new: true }
    ).populate("campaignId", "name assignedTo");

    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    if (lead.campaignId && lead.campaignId.assignedTo) {
      await lead.campaignId.populate("assignedTo", "name email");
    }

    return res.json(lead);
  } catch (err) {
    console.error("❌ Error updating lead status:", err);
    return res.status(500).json({ message: err.message || "Failed to update lead status" });
  }
}

/**
 * Add remark to campaign lead
 * POST /campaigns/leads/:id/remarks
 */
async function addRemark(req, res) {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const userId = req.user.id;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Remark text is required" });
    }

    const lead = await CampaignLead.findById(id);
    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    if (!lead.remarks) {
      lead.remarks = [];
    }

    lead.remarks.push({
      text: text.trim(),
      addedBy: userId,
      timestamp: new Date()
    });

    await lead.save();
    await lead.populate("remarks.addedBy", "name email");

    return res.json(lead);
  } catch (err) {
    console.error("❌ Error adding remark:", err);
    return res.status(500).json({ message: err.message || "Failed to add remark" });
  }
}

module.exports = {
  createCampaign,
  listCampaigns,
  getCampaign,
  updateCampaign,
  deleteCampaign,
  getAllCampaignLeads,
  updateLeadStatus,
  addRemark
};

