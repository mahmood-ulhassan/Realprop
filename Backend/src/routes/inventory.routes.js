const express = require("express");
const { 
  createInventory, 
  listInventory, 
  getInventoryById, 
  updateInventory, 
  deleteInventory,
  addNote,
  deleteNote
} = require("../controllers/inventory.controller");
const { authenticateToken } = require("../middleware/auth.middleware");

const router = express.Router();

// Protected routes - require authentication
router.post("/", authenticateToken, createInventory);
router.get("/", authenticateToken, listInventory);
router.get("/:id", authenticateToken, getInventoryById);
router.put("/:id", authenticateToken, updateInventory);
router.delete("/:id", authenticateToken, deleteInventory);

// Notes routes
router.post("/:id/notes", authenticateToken, addNote);
router.delete("/:id/notes/:noteId", authenticateToken, deleteNote);

module.exports = router;

