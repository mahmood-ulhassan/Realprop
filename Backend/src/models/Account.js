const mongoose = require("mongoose");

const accountSchema = new mongoose.Schema(
  {
    projectId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Project", 
      required: true 
    },
    date: { 
      type: Date, 
      required: true 
    },
    amount: { 
      type: Number, 
      required: true,
      min: 0
    },
    type: {
      type: String,
      enum: ["income", "expense", "incomingLoan", "outgoingLoan", "payout"],
      required: true
    },
    mode: {
      type: String,
      required: true,
      trim: true,
      default: "Cash"
    },
    category: { 
      type: String, 
      required: true, 
      trim: true 
    },
    description: { 
      type: String, 
      default: "", 
      trim: true 
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Account", accountSchema);

