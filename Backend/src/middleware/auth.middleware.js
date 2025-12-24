const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function authenticateToken(req, res, next) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    // Extract token (remove "Bearer " prefix)
    const token = authHeader.substring(7);

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    // Verify token
    const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
    const decoded = jwt.verify(token, JWT_SECRET);

    // Find user from database
    const user = await User.findById(decoded.userId).select("-passwordHash");
    
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (err) {
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token" });
    }
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }
    console.error("❌ Auth middleware error:", err);
    return res.status(500).json({ message: "Authentication failed" });
  }
}

// Middleware to check if user is admin
function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  
  next();
}

module.exports = { authenticateToken, requireAdmin };

