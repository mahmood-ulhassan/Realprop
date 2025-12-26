const express = require("express");
const {
  getNotifications,
  getUnreadCount,
  markAllAsRead,
  markAsRead,
  clearAll
} = require("../controllers/notifications.controller");
const { authenticateToken } = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/", authenticateToken, getNotifications);
router.get("/count", authenticateToken, getUnreadCount);
router.put("/read", authenticateToken, markAllAsRead);
router.put("/:id/read", authenticateToken, markAsRead);
router.delete("/", authenticateToken, clearAll);

module.exports = router;

