const express = require("express");
const { createUser, listUsers, login, getUserById, updateUser, deleteUser } = require("../controllers/users.controller");
const { authenticateToken, requireAdmin } = require("../middleware/auth.middleware");

const router = express.Router();

// Public routes
router.post("/login", login);

// Protected routes - Admin only
router.post("/", authenticateToken, requireAdmin, createUser);
router.get("/", authenticateToken, requireAdmin, listUsers);
router.get("/:id", authenticateToken, requireAdmin, getUserById);
router.put("/:id", authenticateToken, requireAdmin, updateUser);
router.delete("/:id", authenticateToken, requireAdmin, deleteUser);

module.exports = router;

