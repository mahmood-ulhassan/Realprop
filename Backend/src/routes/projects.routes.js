const express = require("express");
const { createProject, listProjects, seedProjects, getProjectById, updateProject, deleteProject } = require("../controllers/projects.controller");
const { authenticateToken } = require("../middleware/auth.middleware");

const router = express.Router();

// Protected routes - require authentication
router.post("/", authenticateToken, createProject);
router.get("/", authenticateToken, listProjects);
router.get("/:id", authenticateToken, getProjectById);
router.put("/:id", authenticateToken, updateProject);
router.delete("/:id", authenticateToken, deleteProject);
router.post("/seed", authenticateToken, seedProjects); // Only admin can seed

module.exports = router;
