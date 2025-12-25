const Inventory = require("../models/Inventory");

// POST /inventory
async function createInventory(req, res) {
  try {
    console.log("📥 POST /inventory - Received body:", req.body);
    const { location, type, floor, size, sizeUnit, rent, advance, security, commission, reofferedBy, isRented, rentComing, agreementYears, tenant, notes } = req.body;

    if (!location || !type) {
      console.log("❌ Validation failed: missing location or type");
      return res.status(400).json({ message: "location and type are required" });
    }

    // Prepare notes array - add initial note if provided
    const notesArray = [];
    if (notes && notes.trim()) {
      notesArray.push({
        text: notes.trim(),
        addedBy: req.user._id,
        timestamp: new Date()
      });
    }

    const inventory = await Inventory.create({
      location: location.trim(),
      type: type.trim(),
      floor: floor ? floor.trim() : "",
      size: size || null,
      sizeUnit: sizeUnit ? sizeUnit.trim() : "",
      rent: rent || null,
      advance: advance || null,
      security: security || null,
      commission: commission || null,
      reofferedBy: reofferedBy ? reofferedBy.trim() : "",
      isRented: isRented || false,
      rentComing: rentComing || null,
      agreementYears: agreementYears || null,
      tenant: tenant ? tenant.trim() : "",
      notes: notesArray
    });

    await inventory.populate("notes.addedBy", "name email");
    console.log("✅ Inventory created successfully:", inventory);
    return res.status(201).json(inventory);
  } catch (err) {
    console.error("❌ Error creating inventory:", err);
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }
    return res.status(500).json({ message: err.message });
  }
}

// GET /inventory
async function listInventory(req, res) {
  try {
    const inventory = await Inventory.find()
      .populate("notes.addedBy", "name email")
      .sort({ createdAt: -1 });

    console.log(`✅ Retrieved ${inventory.length} inventory items`);
    return res.json(inventory);
  } catch (err) {
    console.error("❌ Error listing inventory:", err);
    return res.status(500).json({ message: err.message });
  }
}

// GET /inventory/:id
async function getInventoryById(req, res) {
  try {
    const inventory = await Inventory.findById(req.params.id)
      .populate("notes.addedBy", "name email");

    if (!inventory) {
      return res.status(404).json({ message: "Inventory item not found" });
    }

    return res.json(inventory);
  } catch (err) {
    console.error("❌ Error getting inventory:", err);
    if (err.name === "CastError") {
      return res.status(400).json({ message: "Invalid inventory ID" });
    }
    return res.status(500).json({ message: err.message });
  }
}

// PUT /inventory/:id
async function updateInventory(req, res) {
  try {
    console.log("📥 PUT /inventory/:id - Received body:", req.body);
    const { location, type, floor, size, sizeUnit, rent, advance, security, commission, reofferedBy, isRented, rentComing, agreementYears, tenant, notes } = req.body;
    const inventoryId = req.params.id;

    const inventory = await Inventory.findById(inventoryId);
    if (!inventory) {
      return res.status(404).json({ message: "Inventory item not found" });
    }

    // Update fields
    if (location !== undefined) inventory.location = location.trim();
    if (type !== undefined) inventory.type = type.trim();
    if (floor !== undefined) inventory.floor = floor ? floor.trim() : "";
    if (size !== undefined) inventory.size = size || null;
    if (sizeUnit !== undefined) inventory.sizeUnit = sizeUnit ? sizeUnit.trim() : "";
    if (rent !== undefined) inventory.rent = rent || null;
    if (advance !== undefined) inventory.advance = advance || null;
    if (security !== undefined) inventory.security = security || null;
    if (commission !== undefined) inventory.commission = commission || null;
    if (reofferedBy !== undefined) inventory.reofferedBy = reofferedBy ? reofferedBy.trim() : "";
    if (isRented !== undefined) inventory.isRented = isRented || false;
    if (rentComing !== undefined) inventory.rentComing = rentComing || null;
    if (agreementYears !== undefined) inventory.agreementYears = agreementYears || null;
    if (tenant !== undefined) inventory.tenant = tenant ? tenant.trim() : "";

    // If notes is provided as a string (from initial notes field), add it to notes array if it doesn't exist
    if (notes !== undefined && notes.trim()) {
      const notesText = notes.trim();
      // Check if this note already exists (to avoid duplicates on update)
      const noteExists = inventory.notes.some(n => n.text === notesText);
      if (!noteExists) {
        inventory.notes.push({
          text: notesText,
          addedBy: req.user._id,
          timestamp: new Date()
        });
      }
    }

    await inventory.save();
    await inventory.populate("notes.addedBy", "name email");

    console.log("✅ Inventory updated successfully:", inventory);
    return res.json(inventory);
  } catch (err) {
    console.error("❌ Error updating inventory:", err);
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }
    return res.status(500).json({ message: err.message });
  }
}

// DELETE /inventory/:id
async function deleteInventory(req, res) {
  try {
    const inventory = await Inventory.findByIdAndDelete(req.params.id);

    if (!inventory) {
      return res.status(404).json({ message: "Inventory item not found" });
    }

    console.log("✅ Inventory deleted successfully");
    return res.json({ message: "Inventory item deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting inventory:", err);
    if (err.name === "CastError") {
      return res.status(400).json({ message: "Invalid inventory ID" });
    }
    return res.status(500).json({ message: err.message });
  }
}

// POST /inventory/:id/notes - Add a note
async function addNote(req, res) {
  try {
    console.log("📥 POST /inventory/:id/notes - Received body:", req.body);
    const { text } = req.body;
    const inventoryId = req.params.id;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Note text is required" });
    }

    const inventory = await Inventory.findById(inventoryId);
    if (!inventory) {
      return res.status(404).json({ message: "Inventory item not found" });
    }

    inventory.notes.push({
      text: text.trim(),
      addedBy: req.user._id,
      timestamp: new Date()
    });

    await inventory.save();
    await inventory.populate("notes.addedBy", "name email");

    console.log("✅ Note added successfully");
    return res.json(inventory);
  } catch (err) {
    console.error("❌ Error adding note:", err);
    if (err.name === "CastError") {
      return res.status(400).json({ message: "Invalid inventory ID" });
    }
    return res.status(500).json({ message: err.message });
  }
}

// DELETE /inventory/:id/notes/:noteId - Delete a note
async function deleteNote(req, res) {
  try {
    const inventoryId = req.params.id;
    const noteId = req.params.noteId;

    const inventory = await Inventory.findById(inventoryId);
    if (!inventory) {
      return res.status(404).json({ message: "Inventory item not found" });
    }

    const noteIndex = inventory.notes.findIndex(n => n._id.toString() === noteId);
    if (noteIndex === -1) {
      return res.status(404).json({ message: "Note not found" });
    }

    inventory.notes.splice(noteIndex, 1);
    await inventory.save();
    await inventory.populate("notes.addedBy", "name email");

    console.log("✅ Note deleted successfully");
    return res.json(inventory);
  } catch (err) {
    console.error("❌ Error deleting note:", err);
    if (err.name === "CastError") {
      return res.status(400).json({ message: "Invalid inventory or note ID" });
    }
    return res.status(500).json({ message: err.message });
  }
}

module.exports = {
  createInventory,
  listInventory,
  getInventoryById,
  updateInventory,
  deleteInventory,
  addNote,
  deleteNote
};

