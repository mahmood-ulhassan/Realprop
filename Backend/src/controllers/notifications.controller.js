const Notification = require("../models/Notification");
const Task = require("../models/Task");
const User = require("../models/User");

// GET /notifications - Get all notifications for current user
async function getNotifications(req, res) {
  try {
    const userId = req.user._id;
    
    const notifications = await Notification.find({ targetUserId: userId })
      .sort({ createdAt: -1 })
      .populate("taskId", "number description status")
      .populate("triggeredBy", "name email")
      .limit(50); // Limit to 50 most recent
    
    return res.json(notifications);
  } catch (err) {
    console.error("❌ Error getting notifications:", err);
    return res.status(500).json({ message: err.message });
  }
}

// GET /notifications/count - Get unread notification count
async function getUnreadCount(req, res) {
  try {
    const userId = req.user._id;
    
    const count = await Notification.countDocuments({
      targetUserId: userId,
      read: false
    });
    
    return res.json({ count });
  } catch (err) {
    console.error("❌ Error getting unread count:", err);
    return res.status(500).json({ message: err.message });
  }
}

// PUT /notifications/read - Mark all notifications as read
async function markAllAsRead(req, res) {
  try {
    const userId = req.user._id;
    
    await Notification.updateMany(
      { targetUserId: userId, read: false },
      { read: true, readAt: new Date() }
    );
    
    return res.json({ message: "All notifications marked as read" });
  } catch (err) {
    console.error("❌ Error marking notifications as read:", err);
    return res.status(500).json({ message: err.message });
  }
}

// PUT /notifications/:id/read - Mark single notification as read
async function markAsRead(req, res) {
  try {
    const notificationId = req.params.id;
    const userId = req.user._id;
    
    const notification = await Notification.findOne({
      _id: notificationId,
      targetUserId: userId
    });
    
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    
    notification.read = true;
    notification.readAt = new Date();
    await notification.save();
    
    return res.json(notification);
  } catch (err) {
    console.error("❌ Error marking notification as read:", err);
    return res.status(500).json({ message: err.message });
  }
}

// DELETE /notifications - Clear all notifications for current user
async function clearAll(req, res) {
  try {
    const userId = req.user._id;
    
    await Notification.deleteMany({ targetUserId: userId });
    
    return res.json({ message: "All notifications cleared" });
  } catch (err) {
    console.error("❌ Error clearing notifications:", err);
    return res.status(500).json({ message: err.message });
  }
}

module.exports = {
  getNotifications,
  getUnreadCount,
  markAllAsRead,
  markAsRead,
  clearAll
};

