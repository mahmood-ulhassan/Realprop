const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { 
      type: String, 
      required: true, 
      enum: ["admin", "manager"],
      default: "manager"
    },
    projectIds: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Project"
    }]
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);

