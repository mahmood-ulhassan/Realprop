const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    number: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    status: {
      type: String,
      required: true,
      enum: ["OPEN", "IN_PROGRESS", "BLOCKED", "COMPLETED", "CLOSED", "REASSIGNED", "CANCELLED"],
      default: "OPEN"
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null
    },
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      default: null
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    comments: [{
      text: { type: String, required: true, trim: true },
      addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
      },
      parentCommentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
        default: null
      },
      timestamp: { type: Date, default: Date.now }
    }],
    lastUpdatedAt: { type: Date, default: Date.now },
    // Track when admin last viewed the task (for completed task notifications)
    lastViewedByAdmin: { type: Date, default: null },
    // Track when admin last viewed comments (for comment notifications)
    lastCommentsViewedByAdmin: { type: Date, default: null },
    // Track when manager last viewed the task (for new/reassigned task notifications)
    lastViewedByManager: { type: Date, default: null },
    // Track when manager last viewed comments (for comment notifications)
    lastCommentsViewedByManager: { type: Date, default: null }
  },
  { timestamps: true }
);

// Update lastUpdatedAt before saving
taskSchema.pre("save", function(next) {
  try {
    if (this.isNew) {
      this.lastUpdatedAt = new Date();
    } else if (this.isModified()) {
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

module.exports = mongoose.model("Task", taskSchema);

