const Lead = require("../models/Lead");
const Project = require("../models/Project");

// Helper function to calculate date range
function getDateRange(range, from, to) {
  const now = new Date();
  let startDate, endDate;

  switch (range) {
    case "today":
      startDate = new Date(now.setHours(0, 0, 0, 0));
      endDate = new Date(now.setHours(23, 59, 59, 999));
      break;
    case "thisweek":
      const dayOfWeek = now.getDay();
      startDate = new Date(now);
      startDate.setDate(now.getDate() - dayOfWeek);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
      break;
    case "thismonth":
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    case "custom":
      if (!from || !to) {
        throw new Error("from and to dates are required for custom range");
      }
      startDate = new Date(from);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(to);
      endDate.setHours(23, 59, 59, 999);
      break;
    default:
      throw new Error("Invalid date range. Use: today, thisweek, thismonth, or custom");
  }

  return { startDate, endDate };
}

// GET /dashboard/metrics
async function getMetrics(req, res) {
  try {
    const { projectId, range, from, to } = req.query;

    // Determine projectId
    let targetProjectId = projectId;

    if (req.user.role === "manager") {
      // Manager uses their assigned project(s)
      if (!req.user.projectIds || req.user.projectIds.length === 0) {
        return res.json({ contactsAdded: 0, chatsUpdated: 0, visits: 0 });
      }
      
      // If manager has multiple projects and projectId is provided, use it
      if (projectId && req.user.projectIds.some(id => id.toString() === projectId)) {
        targetProjectId = projectId;
      } else if (req.user.projectIds.length === 1) {
        targetProjectId = req.user.projectIds[0].toString();
      } else {
        // Manager has multiple projects but didn't specify which one
        return res.status(400).json({ message: "projectId is required when manager has multiple projects" });
      }
    } else if (req.user.role === "admin") {
      // Admin must provide projectId
      if (!projectId) {
        return res.status(400).json({ message: "projectId is required for admin" });
      }
      // Validate project exists
      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(400).json({ message: "Project not found" });
      }
    }

    // Validate date range
    if (!range) {
      return res.status(400).json({ message: "range parameter is required (today, thisweek, thismonth, or custom)" });
    }

    // Get date range
    let startDate, endDate;
    try {
      ({ startDate, endDate } = getDateRange(range, from, to));
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }

    // Calculate metrics
    // 1. contactsAdded = leads created within date range
    const contactsAdded = await Lead.countDocuments({
      projectId: targetProjectId,
      createdAt: { $gte: startDate, $lte: endDate }
    });

    // 2. chatsUpdated = leads updated when remarks are added within date range
    // Find leads that have remarks added within the date range
    const leadsWithRemarks = await Lead.find({
      projectId: targetProjectId,
      "remarks.timestamp": { $gte: startDate, $lte: endDate }
    });
    
    // Count unique leads that had remarks added in this range
    const chatsUpdated = leadsWithRemarks.length;

    // 3. visits = status changed to "visited" within date range
    const leadsWithVisitedStatus = await Lead.find({
      projectId: targetProjectId,
      statusHistory: {
        $elemMatch: {
          status: "visited",
          timestamp: { $gte: startDate, $lte: endDate }
        }
      }
    });
    
    // Count unique leads that had status changed to "visited" in this range
    const visits = leadsWithVisitedStatus.length;

    return res.json({
      contactsAdded,
      chatsUpdated,
      visits
    });
  } catch (err) {
    console.error("❌ Error getting dashboard metrics:", err);
    return res.status(500).json({ message: err.message });
  }
}

module.exports = { getMetrics };

