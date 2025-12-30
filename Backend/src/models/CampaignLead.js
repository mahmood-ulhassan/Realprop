const mongoose = require("mongoose");

const campaignLeadSchema = new mongoose.Schema(
  {
    campaignId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Campaign", 
      required: true 
    },
    name: { 
      type: String, 
      required: true, 
      trim: true 
    },
    phone: { 
      type: String, 
      default: "N/A", 
      trim: true 
    },
    email: { 
      type: String, 
      default: "N/A", 
      trim: true 
    },
    website: { 
      type: String, 
      default: "N/A", 
      trim: true 
    },
    instagram: { 
      type: String, 
      default: "N/A", 
      trim: true 
    },
    facebook: { 
      type: String, 
      default: "N/A", 
      trim: true 
    },
    address: { 
      type: String, 
      default: "N/A", 
      trim: true 
    },
    status: {
      type: String,
      enum: ["pending", "contacted", "NA", "hot"],
      default: "pending"
    },
    remarks: [{
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

module.exports = mongoose.model("CampaignLead", campaignLeadSchema);

