const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema(
  {
    location: { type: String, required: true, trim: true },
    type: { type: String, required: true, trim: true },
    floor: { type: String, default: "", trim: true },
    rent: { type: Number, default: null },
    advance: { type: Number, default: null },
    security: { type: Number, default: null },
    commission: { type: Number, default: null },
    reofferedBy: { type: String, default: "", trim: true },
    notes: [{
      text: { type: String, required: true, trim: true },
      addedBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User",
        required: true
      },
      timestamp: { type: Date, default: Date.now }
    }]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Inventory", inventorySchema);

