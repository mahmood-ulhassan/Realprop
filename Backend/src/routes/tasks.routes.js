const express = require("express");
const {
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
} = require("../controllers/tasks.controller");
const { authenticateToken } = require("../middleware/auth.middleware");

const router = express.Router();

// Protected routes - require authentication
router.post("/", authenticateToken, createTask);
router.get("/", authenticateToken, listTasks);
router.get("/count/pending", authenticateToken, getPendingTasksCount);
router.get("/:id", authenticateToken, getTaskById);
router.put("/:id/view", authenticateToken, markTaskAsViewed);
router.put("/:id/view-comments", authenticateToken, markCommentsAsViewed);
router.put("/:id", authenticateToken, updateTask);
router.put("/:id/status", authenticateToken, updateTaskStatus);
router.post("/:id/comments", authenticateToken, addComment);
router.put("/:id/reassign", authenticateToken, reassignTask);
router.delete("/:id", authenticateToken, deleteTask);

module.exports = router;

