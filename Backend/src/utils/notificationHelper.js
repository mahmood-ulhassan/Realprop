const Notification = require("../models/Notification");
const Task = require("../models/Task");
const User = require("../models/User");

/**
 * Create a notification for task activity
 * @param {String} type - Notification type (COMMENT, STATUS_CHANGE, ASSIGNMENT, REASSIGNMENT)
 * @param {String} taskId - Task ID
 * @param {String} triggeredBy - User ID who triggered the event
 * @param {String|Array} targetUserIds - User ID(s) who should receive the notification
 * @param {String} message - Notification message
 * @param {Object} metadata - Additional metadata
 */
async function createNotification(type, taskId, triggeredBy, targetUserIds, message, metadata = {}) {
  try {
    // Ensure targetUserIds is an array
    const targetIds = Array.isArray(targetUserIds) ? targetUserIds : [targetUserIds];
    
    // Get task and user details for message
    const task = await Task.findById(taskId).populate("assignedTo", "name");
    const triggeredByUser = await User.findById(triggeredBy).select("name");
    
    if (!task) {
      console.error("Task not found for notification:", taskId);
      return;
    }

    // Create notifications for each target user
    const notifications = targetIds
      .filter(id => id && id.toString() !== triggeredBy.toString()) // Don't notify the person who triggered it
      .map(targetUserId => ({
        type,
        taskId,
        triggeredBy,
        targetUserId,
        message: message || generateDefaultMessage(type, task, triggeredByUser),
        metadata
      }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
      console.log(`✅ Created ${notifications.length} notification(s) for task ${taskId}`);
    }
  } catch (err) {
    console.error("❌ Error creating notification:", err);
  }
}

/**
 * Generate default message based on notification type
 */
function generateDefaultMessage(type, task, triggeredBy) {
  const taskNumber = task.number || "Task";
  const userName = triggeredBy?.name || "Someone";
  
  switch (type) {
    case "COMMENT":
      return `${userName} commented on task ${taskNumber}`;
    case "STATUS_CHANGE":
      return `${userName} changed status of task ${taskNumber} to ${task.status}`;
    case "ASSIGNMENT":
      return `${userName} assigned task ${taskNumber} to you`;
    case "REASSIGNMENT":
      return `${userName} reassigned task ${taskNumber} to you`;
    default:
      return `Activity on task ${taskNumber}`;
  }
}

module.exports = { createNotification };

