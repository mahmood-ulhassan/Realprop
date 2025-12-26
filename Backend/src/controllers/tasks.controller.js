const Task = require("../models/Task");
const User = require("../models/User");
const Project = require("../models/Project");
const Lead = require("../models/Lead");
const { createNotification } = require("../utils/notificationHelper");

// POST /tasks
async function createTask(req, res) {
  try {
    console.log("📥 POST /tasks - Received body:", req.body);
    const { number, description, assignedTo, projectId, leadId } = req.body;

    if (!number || !assignedTo) {
      console.log("❌ Validation failed: missing number or assignedTo");
      return res.status(400).json({ message: "number and assignedTo are required" });
    }

    // Validate assigned user exists and is a manager
    const assignedUser = await User.findById(assignedTo);
    if (!assignedUser) {
      return res.status(400).json({ message: "Assigned user not found" });
    }
    if (assignedUser.role !== "manager") {
      return res.status(400).json({ message: "Tasks can only be assigned to managers" });
    }

    // If assigned to manager, handle project assignment
    let finalProjectId = projectId || null;
    if (assignedUser.role === "manager") {
      if (!projectId && assignedUser.projectIds && assignedUser.projectIds.length === 1) {
        // Auto-assign to manager's only project
        finalProjectId = assignedUser.projectIds[0];
      } else if (!projectId && assignedUser.projectIds && assignedUser.projectIds.length > 1) {
        return res.status(400).json({ message: "projectId is required when manager has multiple projects" });
      } else if (projectId) {
        // Validate project exists and manager has access
        const project = await Project.findById(projectId);
        if (!project) {
          return res.status(400).json({ message: "Project not found" });
        }
        if (!assignedUser.projectIds.includes(projectId)) {
          return res.status(400).json({ message: "Manager does not have access to this project" });
        }
      }
    }

    // Validate lead exists if provided
    if (leadId) {
      const lead = await Lead.findById(leadId);
      if (!lead) {
        return res.status(400).json({ message: "Lead not found" });
      }
    }

    // Check for duplicate number only among active tasks (not CLOSED or CANCELLED)
    const existingTask = await Task.findOne({
      number: number.trim(),
      status: { $nin: ['CLOSED', 'CANCELLED'] }
    });
    if (existingTask) {
      return res.status(400).json({ message: `A task with number "${number.trim()}" already exists` });
    }

    const task = await Task.create({
      number: number.trim(),
      description: description ? description.trim() : "",
      assignedTo,
      projectId: finalProjectId,
      leadId: leadId || null,
      createdBy: req.user._id,
      status: "OPEN"
    });

    await task.populate("assignedTo", "name email role");
    await task.populate("projectId", "name location");
    await task.populate("leadId", "name contactNo");
    await task.populate("createdBy", "name email");
    await task.populate("comments.addedBy", "name email");

    // Create ASSIGNMENT notification for assigned manager
    if (task.assignedTo) {
      await createNotification(
        "ASSIGNMENT",
        task._id,
        req.user._id,
        task.assignedTo._id,
        `${req.user.name || "Admin"} assigned task ${task.number} to you`
      );
    }

    console.log("✅ Task created successfully:", task);
    return res.status(201).json(task);
  } catch (err) {
    console.error("❌ Error creating task:", err);
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }
    return res.status(500).json({ message: err.message });
  }
}

// GET /tasks
async function listTasks(req, res) {
  try {
    let query = {};

    // If user is manager, only show tasks assigned to them
    if (req.user.role === "manager") {
      query.assignedTo = req.user._id;
    }
    // Admin sees all tasks (no filter)

    const tasks = await Task.find(query)
      .populate("assignedTo", "name email role")
      .populate("projectId", "name location")
      .populate("leadId", "name contactNo")
      .populate("createdBy", "name email")
      .populate("comments.addedBy", "name email")
      .sort({ createdAt: -1 });

    console.log(`✅ Retrieved ${tasks.length} tasks`);
    return res.json(tasks);
  } catch (err) {
    console.error("❌ Error listing tasks:", err);
    return res.status(500).json({ message: err.message });
  }
}

// GET /tasks/:id
async function getTaskById(req, res) {
  try {
    const task = await Task.findById(req.params.id)
      .populate("assignedTo", "name email role")
      .populate("projectId", "name location")
      .populate("leadId", "name contactNo")
      .populate("createdBy", "name email")
      .populate("comments.addedBy", "name email");

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Check permissions
    if (req.user.role === "manager" && task.assignedTo._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    return res.json(task);
  } catch (err) {
    console.error("❌ Error getting task:", err);
    if (err.name === "CastError") {
      return res.status(400).json({ message: "Invalid task ID" });
    }
    return res.status(500).json({ message: err.message });
  }
}

// PUT /tasks/:id/status
async function updateTaskStatus(req, res) {
  try {
    console.log("📥 PUT /tasks/:id/status - Received body:", req.body);
    const { status } = req.body;
    const taskId = req.params.id;

    const validStatuses = ["OPEN", "IN_PROGRESS", "BLOCKED", "COMPLETED", "CLOSED", "REASSIGNED", "CANCELLED"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Check permissions
    if (req.user.role === "manager") {
      if (task.assignedTo.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Access denied" });
      }
      // Managers can only set: COMPLETED
      if (status !== "COMPLETED") {
        return res.status(403).json({ message: "Managers can only set status to COMPLETED" });
      }
    }

    // Only admin can CLOSE or CANCELLED
    if (["CLOSED", "CANCELLED"].includes(status) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admin can close or cancel tasks" });
    }

    // Only admin can CLOSE, and only when status is COMPLETED
    if (status === "CLOSED" && task.status !== "COMPLETED") {
      return res.status(400).json({ message: "Can only close tasks with COMPLETED status" });
    }

    const oldStatus = task.status;
    task.status = status;
    await task.save();
    await task.populate("assignedTo", "name email role");
    await task.populate("projectId", "name location");
    await task.populate("leadId", "name contactNo");
    await task.populate("createdBy", "name email");
    await task.populate("comments.addedBy", "name email");

    // Create STATUS_CHANGE notification
    // Notify: task creator (admin) and assigned manager (if different from current user)
    const targetUsers = [];
    // Always notify the task creator (admin) - handle both populated and unpopulated
    const createdById = task.createdBy?._id || task.createdBy;
    if (createdById) {
      targetUsers.push(createdById);
      console.log("📢 Adding task creator to notification targets:", createdById.toString());
    }
    // Notify assigned manager if they're different from the current user
    const assignedToId = task.assignedTo?._id || task.assignedTo;
    if (assignedToId && assignedToId.toString() !== req.user._id.toString()) {
      targetUsers.push(assignedToId);
      console.log("📢 Adding assigned manager to notification targets:", assignedToId.toString());
    }
    
    console.log("📢 Notification targets for status change:", targetUsers.map(id => id.toString()), "Triggered by:", req.user._id.toString());
    
    if (targetUsers.length > 0 && oldStatus !== status) {
      try {
        // Get user name for notification
        const user = await User.findById(req.user._id).select("name");
        await createNotification(
          "STATUS_CHANGE",
          task._id,
          req.user._id,
          targetUsers,
          `${user?.name || "Someone"} changed status of task ${task.number || task._id} from ${oldStatus} to ${status}`,
          { oldStatus, newStatus: status }
        );
      } catch (notifError) {
        console.error("⚠️ Error creating notification (status change still saved):", notifError);
        // Don't fail the request if notification creation fails
      }
    }

    console.log("✅ Task status updated successfully:", task);
    return res.json(task);
  } catch (err) {
    console.error("❌ Error updating task status:", err);
    if (err.name === "CastError") {
      return res.status(400).json({ message: "Invalid task ID" });
    }
    return res.status(500).json({ message: err.message });
  }
}

// POST /tasks/:id/comments
async function addComment(req, res) {
  try {
    console.log("📥 POST /tasks/:id/comments - Received body:", req.body);
    const { text, parentCommentId } = req.body;
    const taskId = req.params.id;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    const task = await Task.findById(taskId).populate("assignedTo", "_id");
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Check permissions
    if (req.user.role === "manager") {
      // Handle both populated and unpopulated assignedTo
      let assignedToId;
      if (task.assignedTo && typeof task.assignedTo === 'object' && task.assignedTo._id) {
        // Populated
        assignedToId = task.assignedTo._id.toString();
      } else if (task.assignedTo) {
        // Unpopulated ObjectId
        assignedToId = task.assignedTo.toString();
      }
      
      if (!assignedToId || assignedToId !== req.user._id.toString()) {
        console.log("❌ Permission denied - Manager ID:", req.user._id.toString(), "Assigned To ID:", assignedToId);
        return res.status(403).json({ message: "Access denied" });
      }
    }

    task.comments.push({
      text: text.trim(),
      addedBy: req.user._id,
      parentCommentId: parentCommentId || null,
      timestamp: new Date()
    });

    // Reset viewing status when new comment is added (so it shows as notification)
    // This ensures both admin and manager get notified of new comments
    if (req.user.role === "admin") {
      // If admin adds comment, manager should be notified
      task.lastCommentsViewedByManager = null;
    } else if (req.user.role === "manager") {
      // If manager adds comment, admin should be notified
      task.lastCommentsViewedByAdmin = null;
    }

    await task.save();
    
    // Reload the task to get the full populated data including the new comment
    const populatedTask = await Task.findById(taskId)
      .populate("assignedTo", "name email role")
      .populate("projectId", "name location")
      .populate("leadId", "name contactNo")
      .populate("createdBy", "name email")
      .populate("comments.addedBy", "name email");
    
    if (!populatedTask) {
      console.error("❌ Error: Task not found after saving comment");
      return res.status(500).json({ message: "Error retrieving task after adding comment" });
    }

    // Create COMMENT notification
    // Notify: task creator (admin) and assigned manager (if different from current user)
    const targetUsers = [];
    // Always notify the task creator (admin) - handle both populated and unpopulated
    const createdById = populatedTask.createdBy?._id || populatedTask.createdBy;
    if (createdById) {
      targetUsers.push(createdById);
      console.log("📢 Adding task creator to notification targets:", createdById.toString());
    }
    // Notify assigned manager if they're different from the current user
    const assignedToId = populatedTask.assignedTo?._id || populatedTask.assignedTo;
    if (assignedToId && assignedToId.toString() !== req.user._id.toString()) {
      targetUsers.push(assignedToId);
      console.log("📢 Adding assigned manager to notification targets:", assignedToId.toString());
    }
    
    console.log("📢 Notification targets for comment:", targetUsers.map(id => id.toString()), "Triggered by:", req.user._id.toString());
    
    // Create COMMENT notification (don't let notification errors block comment saving)
    if (targetUsers.length > 0) {
      try {
        // Get user name for notification
        const user = await User.findById(req.user._id).select("name");
        await createNotification(
          "COMMENT",
          populatedTask._id,
          req.user._id,
          targetUsers,
          `${user?.name || "Someone"} commented on task ${populatedTask.number || populatedTask._id}`
        );
      } catch (notifError) {
        console.error("⚠️ Error creating notification (comment still saved):", notifError);
        // Don't fail the request if notification creation fails
      }
    }

    console.log("✅ Comment added successfully, comments count:", populatedTask.comments?.length || 0);
    return res.json(populatedTask);
  } catch (err) {
    console.error("❌ Error adding comment:", err);
    console.error("❌ Error stack:", err.stack);
    if (err.name === "CastError") {
      return res.status(400).json({ message: "Invalid task ID" });
    }
    return res.status(500).json({ message: err.message || "Internal server error" });
  }
}

// PUT /tasks/:id/reassign
async function reassignTask(req, res) {
  try {
    console.log("📥 PUT /tasks/:id/reassign - Received body:", req.body);
    const { comment } = req.body;
    const taskId = req.params.id;

    // Only admin can reassign
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admin can reassign tasks" });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Reassign: change status to REASSIGNED and add comment if provided
    task.status = "REASSIGNED";
    // Reset manager's viewing status when task is reassigned (so they get notification)
    task.lastViewedByManager = null;
    task.lastCommentsViewedByManager = null;
    
    if (comment && comment.trim()) {
      task.comments.push({
        text: comment.trim(),
        addedBy: req.user._id,
        timestamp: new Date()
      });
      // Reset admin's comment viewing status when new comment is added
      task.lastCommentsViewedByAdmin = null;
    }

    await task.save();
    await task.populate("assignedTo", "name email role");
    await task.populate("projectId", "name location");
    await task.populate("leadId", "name contactNo");
    await task.populate("createdBy", "name email");
    await task.populate("comments.addedBy", "name email");

    // Create REASSIGNMENT notification for assigned manager
    if (task.assignedTo) {
      await createNotification(
        "REASSIGNMENT",
        task._id,
        req.user._id,
        task.assignedTo._id,
        `${req.user.name || "Admin"} reassigned task ${task.number} to you`
      );
    }

    console.log("✅ Task reassigned successfully");
    return res.json(task);
  } catch (err) {
    console.error("❌ Error reassigning task:", err);
    if (err.name === "CastError") {
      return res.status(400).json({ message: "Invalid task ID" });
    }
    return res.status(500).json({ message: err.message });
  }
}

// PUT /tasks/:id
async function updateTask(req, res) {
  try {
    console.log("📥 PUT /tasks/:id - Received body:", req.body);
    const { number, description, assignedTo, projectId } = req.body;
    const taskId = req.params.id;

    // Only admin can update task details
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admin can update task details" });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Check for duplicate number only among active tasks (not CLOSED or CANCELLED) if number is being updated
    if (number !== undefined && number.trim() !== task.number) {
      const existingTask = await Task.findOne({
        number: number.trim(),
        status: { $nin: ['CLOSED', 'CANCELLED'] },
        _id: { $ne: taskId } // Exclude current task
      });
      if (existingTask) {
        return res.status(400).json({ message: `A task with number "${number.trim()}" already exists` });
      }
    }

    // Update fields
    if (number !== undefined) task.number = number.trim();
    if (description !== undefined) task.description = description ? description.trim() : "";

    // Handle assignedTo and projectId changes
    const oldAssignedTo = task.assignedTo ? task.assignedTo.toString() : null;
    if (assignedTo !== undefined) {
      const assignedUser = await User.findById(assignedTo);
      if (!assignedUser) {
        return res.status(400).json({ message: "Assigned user not found" });
      }
      if (assignedUser.role !== "manager") {
        return res.status(400).json({ message: "Tasks can only be assigned to managers" });
      }
      task.assignedTo = assignedTo;

      // Handle project assignment for managers
      if (projectId !== undefined) {
        if (projectId && !assignedUser.projectIds.includes(projectId)) {
          return res.status(400).json({ message: "Manager does not have access to this project" });
        }
        task.projectId = projectId || null;
      } else if (!projectId && assignedUser.projectIds && assignedUser.projectIds.length === 1) {
        // Auto-assign to manager's only project
        task.projectId = assignedUser.projectIds[0];
      }
    } else if (projectId !== undefined) {
      task.projectId = projectId || null;
    }

    await task.save();
    await task.populate("assignedTo", "name email role");
    
    // Create REASSIGNMENT notification if assignedTo changed
    if (assignedTo !== undefined && oldAssignedTo !== assignedTo.toString() && task.assignedTo) {
      // Get user name for notification
      const user = await User.findById(req.user._id).select("name");
      await createNotification(
        "REASSIGNMENT",
        task._id,
        req.user._id,
        task.assignedTo._id,
        `${user?.name || "Admin"} reassigned task ${task.number} to you`
      );
    }
    await task.populate("projectId", "name location");
    await task.populate("leadId", "name contactNo");
    await task.populate("createdBy", "name email");
    await task.populate("comments.addedBy", "name email");

    console.log("✅ Task updated successfully:", task);
    return res.json(task);
  } catch (err) {
    console.error("❌ Error updating task:", err);
    if (err.name === "CastError") {
      return res.status(400).json({ message: "Invalid task ID" });
    }
    return res.status(500).json({ message: err.message });
  }
}

// DELETE /tasks/:id
async function deleteTask(req, res) {
  try {
    // Only admin can delete
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admin can delete tasks" });
    }

    const task = await Task.findByIdAndDelete(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    console.log("✅ Task deleted successfully");
    return res.json({ message: "Task deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting task:", err);
    if (err.name === "CastError") {
      return res.status(400).json({ message: "Invalid task ID" });
    }
    return res.status(500).json({ message: err.message });
  }
}

// GET /tasks/count/pending
// PUT /tasks/:id/view - Mark task as viewed by admin or manager
async function markTaskAsViewed(req, res) {
  try {
    const taskId = req.params.id;
    const task = await Task.findById(taskId);
    
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Check permissions
    if (req.user.role === "admin") {
      task.lastViewedByAdmin = new Date();
    } else if (req.user.role === "manager") {
      // Manager can only mark tasks assigned to them as viewed
      if (task.assignedTo.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Access denied" });
      }
      task.lastViewedByManager = new Date();
    } else {
      return res.status(403).json({ message: "Access denied" });
    }

    await task.save();

    return res.json({ success: true, task });
  } catch (err) {
    console.error("Error marking task as viewed:", err);
    return res.status(500).json({ message: err.message });
  }
}

// PUT /tasks/:id/view-comments - Mark comments as viewed by admin or manager
async function markCommentsAsViewed(req, res) {
  try {
    const taskId = req.params.id;
    const task = await Task.findById(taskId);
    
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Check permissions
    if (req.user.role === "admin") {
      task.lastCommentsViewedByAdmin = new Date();
    } else if (req.user.role === "manager") {
      // Manager can only mark comments as viewed for tasks assigned to them
      if (task.assignedTo.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Access denied" });
      }
      task.lastCommentsViewedByManager = new Date();
    } else {
      return res.status(403).json({ message: "Access denied" });
    }

    await task.save();

    return res.json({ success: true, task });
  } catch (err) {
    console.error("Error marking comments as viewed:", err);
    return res.status(500).json({ message: err.message });
  }
}

async function getPendingTasksCount(req, res) {
  try {
    // For admin: count notifications (completed tasks not viewed + tasks with new comments)
    if (req.user.role === "admin") {
      // Count completed tasks that admin hasn't viewed (excluding CLOSED tasks)
      const completedNotViewed = await Task.countDocuments({
        status: "COMPLETED",
        $or: [
          { lastViewedByAdmin: null },
          { lastViewedByAdmin: { $exists: false } }
        ]
      });

      // Count tasks with new comments (comments added after lastCommentsViewedByAdmin)
      // Only count tasks that are not CLOSED
      const tasksWithNewComments = await Task.find({
        comments: { $exists: true, $ne: [] },
        status: { $ne: "CLOSED" }
      });

      let newCommentsCount = 0;
      for (const task of tasksWithNewComments) {
        if (task.comments && task.comments.length > 0) {
          const lastCommentTime = new Date(
            Math.max(...task.comments.map(c => new Date(c.timestamp).getTime()))
          );
          
          // If admin never viewed comments, or last comment is after last view
          if (!task.lastCommentsViewedByAdmin || 
              lastCommentTime > new Date(task.lastCommentsViewedByAdmin)) {
            newCommentsCount++;
          }
        }
      }

      const totalNotifications = completedNotViewed + newCommentsCount;
      return res.json({ count: totalNotifications });
    } else {
      // Manager: count notifications (new/reassigned tasks not viewed + tasks with new comments)
      const managerId = req.user._id;
      
      // Get all tasks assigned to manager
      const allTasks = await Task.find({
        assignedTo: managerId,
        status: { $ne: "CLOSED" }
      });
      
      // Count tasks that manager hasn't viewed yet
      let tasksNotViewed = 0;
      for (const task of allTasks) {
        if (!task.lastViewedByManager) {
          // Never viewed - count it
          tasksNotViewed++;
        } else {
          // Check if task was created or updated after last view
          const lastViewTime = new Date(task.lastViewedByManager);
          const createdTime = new Date(task.createdAt);
          const updatedTime = new Date(task.updatedAt);
          
          // If task was created or updated after manager last viewed it, count it
          if (createdTime > lastViewTime || updatedTime > lastViewTime) {
            tasksNotViewed++;
          }
        }
      }

      // Count tasks with new comments (comments added after lastCommentsViewedByManager)
      let newCommentsCount = 0;
      for (const task of allTasks) {
        if (task.comments && task.comments.length > 0) {
          const lastCommentTime = new Date(
            Math.max(...task.comments.map(c => new Date(c.timestamp).getTime()))
          );
          
          // If manager never viewed comments, or last comment is after last view
          if (!task.lastCommentsViewedByManager || 
              lastCommentTime > new Date(task.lastCommentsViewedByManager)) {
            newCommentsCount++;
          }
        }
      }

      const totalNotifications = tasksNotViewed + newCommentsCount;
      return res.json({ count: totalNotifications });
    }
  } catch (err) {
    console.error("❌ Error getting pending tasks count:", err);
    return res.status(500).json({ message: err.message });
  }
}

module.exports = {
  createTask,
  listTasks,
  getTaskById,
  updateTaskStatus,
  addComment,
  reassignTask,
  updateTask,
  deleteTask,
  getPendingTasksCount,
  markTaskAsViewed,
  markCommentsAsViewed
};

