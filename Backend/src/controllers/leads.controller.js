const Lead = require("../models/Lead");
const Project = require("../models/Project");

// POST /leads - Admin and manager can create
async function createLead(req, res) {
  try {
    console.log("📥 POST /leads - Received body:", req.body);
    const { projectId, name, contactNo, requirement, status, referredBy, leadSource } = req.body;

    if (!projectId || !name || !contactNo) {
      return res.status(400).json({ message: "projectId, name, and contactNo are required" });
    }

    // Validate project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(400).json({ message: "Project not found" });
    }

    // If user is manager, ensure they can only create leads for their assigned project(s)
    if (req.user.role === "manager") {
      const hasAccess = req.user.projectIds?.some(id => id.toString() === projectId.toString());
      if (!hasAccess) {
        return res.status(403).json({ message: "Manager can only create leads for their assigned project(s)" });
      }
    }

    const initialStatus = status || "fresh";
    const { remark } = req.body;
    
    // Prepare remarks array - add initial remark if provided
    const remarks = [];
    if (remark && remark.trim()) {
      remarks.push({
        text: remark.trim(),
        addedBy: req.user._id,
        timestamp: new Date()
      });
    }

    const lead = await Lead.create({
      projectId,
      name,
      contactNo,
      requirement: requirement || "",
      status: initialStatus,
      referredBy: referredBy || "",
      leadSource: leadSource || "",
      remarks: remarks,
      statusHistory: [{
        status: initialStatus,
        changedBy: req.user._id,
        timestamp: new Date()
      }]
    });

    await lead.populate("remarks.addedBy", "name email");
    await lead.populate("statusHistory.changedBy", "name email");
    console.log("✅ Lead created successfully:", lead);
    return res.status(201).json(lead);
  } catch (err) {
    console.error("❌ Error creating lead:", err);
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }
    return res.status(500).json({ message: err.message });
  }
}

// GET /leads - Admin uses projectId query param, Manager uses own projectId
async function listLeads(req, res) {
  try {
    let query = {};

    if (req.user.role === "admin") {
      // Admin must provide projectId as query parameter
      const { projectId } = req.query;
      if (!projectId) {
        return res.status(400).json({ message: "projectId query parameter is required for admin" });
      }
      query.projectId = projectId;
    } else if (req.user.role === "manager") {
      // Manager uses their own assigned projectIds
      if (!req.user.projectIds || req.user.projectIds.length === 0) {
        return res.json([]); // Manager has no assigned projects
      }
      // If manager has multiple projects and projectId is provided, filter by it
      const { projectId } = req.query;
      if (projectId && req.user.projectIds.some(id => id.toString() === projectId)) {
        query.projectId = projectId;
      } else if (req.user.projectIds.length === 1) {
        query.projectId = req.user.projectIds[0];
      } else {
        // Manager has multiple projects - return all their projects' leads
        query.projectId = { $in: req.user.projectIds };
      }
    }

    const leads = await Lead.find(query)
      .populate("remarks.addedBy", "name email")
      .populate("statusHistory.changedBy", "name email")
      .sort({ createdAt: -1 });
    return res.json(leads);
  } catch (err) {
    console.error("❌ Error listing leads:", err);
    return res.status(500).json({ message: err.message });
  }
}

// PUT /leads/:id - Update lead (admin/manager can update their project's leads)
async function updateLead(req, res) {
  try {
    const { id } = req.params;
    const { name, contactNo, requirement, status, referredBy, leadSource, remark } = req.body;

    const lead = await Lead.findById(id);
    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    // Check permissions
    if (req.user.role === "manager") {
      const hasAccess = req.user.projectIds?.some(id => id.toString() === lead.projectId.toString());
      if (!hasAccess) {
        return res.status(403).json({ message: "Manager can only update leads for their assigned project(s)" });
      }
    }

    // Track if any field is being updated
    let hasUpdates = false;

    // Update lead fields
    if (name !== undefined && name !== lead.name) {
      lead.name = name;
      hasUpdates = true;
    }
    if (contactNo !== undefined && contactNo !== lead.contactNo) {
      lead.contactNo = contactNo;
      hasUpdates = true;
    }
    if (requirement !== undefined && requirement !== lead.requirement) {
      lead.requirement = requirement;
      hasUpdates = true;
    }
    
    // Track status changes
    if (status !== undefined && status !== lead.status) {
      if (!lead.statusHistory) {
        lead.statusHistory = [];
      }
      lead.statusHistory.push({
        status: status,
        changedBy: req.user._id,
        timestamp: new Date()
      });
      lead.status = status;
      hasUpdates = true;
    }
    
    if (referredBy !== undefined && referredBy !== lead.referredBy) {
      lead.referredBy = referredBy;
      hasUpdates = true;
    }
    if (leadSource !== undefined && leadSource !== lead.leadSource) {
      lead.leadSource = leadSource;
      hasUpdates = true;
    }

    // Add remark if provided
    if (remark && remark.trim()) {
      if (!lead.remarks) {
        lead.remarks = [];
      }
      lead.remarks.push({
        text: remark.trim(),
        addedBy: req.user._id,
        timestamp: new Date()
      });
      hasUpdates = true;
    }

    // Update lastUpdatedAt if any changes were made
    if (hasUpdates) {
      lead.lastUpdatedAt = new Date();
    }

    await lead.save();
    await lead.populate("remarks.addedBy", "name email");
    await lead.populate("statusHistory.changedBy", "name email");

    console.log("✅ Lead updated successfully:", lead._id);
    return res.json(lead);
  } catch (err) {
    console.error("❌ Error updating lead:", err);
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }
    return res.status(500).json({ message: err.message });
  }
}

// POST /leads/:id/remarks - Add a remark to a lead
async function addRemark(req, res) {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Remark text is required" });
    }

    const lead = await Lead.findById(id);
    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    // Check permissions
    if (req.user.role === "manager") {
      const hasAccess = req.user.projectIds?.some(id => id.toString() === lead.projectId.toString());
      if (!hasAccess) {
        return res.status(403).json({ message: "Manager can only add remarks to leads for their assigned project(s)" });
      }
    }

    // Add remark
    lead.remarks.push({
      text: text.trim(),
      addedBy: req.user._id,
      timestamp: new Date()
    });
    lead.lastUpdatedAt = new Date();

    await lead.save();
    await lead.populate("remarks.addedBy", "name email");
    await lead.populate("statusHistory.changedBy", "name email");

    console.log("✅ Remark added successfully to lead:", lead._id);
    return res.json(lead);
  } catch (err) {
    console.error("❌ Error adding remark:", err);
    return res.status(500).json({ message: err.message });
  }
}

module.exports = { createLead, listLeads, updateLead, addRemark };

