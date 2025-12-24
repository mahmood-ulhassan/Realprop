const mongoose = require("mongoose");

const leadSchema = new mongoose.Schema(
  {
    projectId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Project", 
      required: true 
    },
    name: { type: String, required: true, trim: true },
    contactNo: { type: String, required: true, trim: true },
    requirement: { type: String, default: "", trim: true },
    status: { 
      type: String, 
      required: true,
      enum: ["fresh", "contacted", "requirement", "offer given", "hot", "closed", "success", "visit planned", "visited"],
      default: "fresh"
    },
    statusHistory: [{
      status: { type: String, required: true },
      changedBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User",
        required: true
      },
      timestamp: { type: Date, default: Date.now }
    }],
    referredBy: { type: String, default: "", trim: true },
    leadSource: { type: String, default: "", trim: true },
    remarks: [{
      text: { type: String, required: true, trim: true },
      addedBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User",
        required: true
      },
      timestamp: { type: Date, default: Date.now }
    }],
    lastUpdatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// Update lastUpdatedAt before saving if document is modified
leadSchema.pre("save", function(next) {
  try {
    // For new documents, set lastUpdatedAt to now
    if (this.isNew) {
      this.lastUpdatedAt = new Date();
    } else if (this.isModified()) {
      // For existing documents, update lastUpdatedAt if any field is modified
      this.lastUpdatedAt = new Date();
    }
    if (next && typeof next === 'function') {
      next();
    }
  } catch (error) {
    if (next && typeof next === 'function') {
      next(error);
    } else {
      throw error;
    }
  }
});

module.exports = mongoose.model("Lead", leadSchema);

