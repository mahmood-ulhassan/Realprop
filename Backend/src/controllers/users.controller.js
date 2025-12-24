const User = require("../models/User");
const Project = require("../models/Project");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// POST /users
async function createUser(req, res) {
  try {
    console.log("📥 POST /users - Received body:", req.body);
    const { name, email, password, role, projectId } = req.body;

    if (!name || !email || !password) {
      console.log("❌ Validation failed: missing required fields");
      return res.status(400).json({ message: "name, email, and password are required" });
    }

    const userRole = role || "manager";

    // If user is a manager, projectId is required
    if (userRole === "manager" && !projectId) {
      return res.status(400).json({ message: "projectId is required for manager role" });
    }

    // Validate projectId exists if provided
    if (projectId) {
      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(400).json({ message: "Invalid projectId: project not found" });
      }
    }

    // Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const user = await User.create({
      name,
      email,
      passwordHash,
      role: userRole,
      projectIds: projectId ? [projectId] : []
    });

    // Don't send passwordHash in response
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      projectIds: user.projectIds,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    console.log("✅ User created successfully:", userResponse);
    return res.status(201).json(userResponse);
  } catch (err) {
    console.error("❌ Error creating user:", err);
    if (err.code === 11000) {
      return res.status(400).json({ message: "Email already exists" });
    }
    return res.status(500).json({ message: err.message });
  }
}

// GET /users
async function listUsers(req, res) {
  try {
    const users = await User.find().select("-passwordHash").sort({ createdAt: -1 });
    return res.json(users);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

// POST /users/login
async function login(req, res) {
  try {
    console.log("📥 POST /users/login - Received body:", req.body);
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate JWT token
    const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Return user data and token
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      projectIds: user.projectIds || [],
      token
    };

    console.log("✅ Login successful:", user.email);
    return res.json(userResponse);
  } catch (err) {
    console.error("❌ Error during login:", err);
    return res.status(500).json({ message: err.message });
  }
}

// GET /users/:id
async function getUserById(req, res) {
  try {
    const user = await User.findById(req.params.id)
      .select("-passwordHash")
      .populate("projectIds", "name location");
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    return res.json(user);
  } catch (err) {
    console.error("❌ Error fetching user:", err);
    return res.status(500).json({ message: err.message });
  }
}

// PUT /users/:id
async function updateUser(req, res) {
  try {
    console.log("📥 PUT /users/:id - Received body:", req.body);
    const { name, email, role, projectId, password } = req.body;
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) {
      if (!["admin", "manager"].includes(role)) {
        return res.status(400).json({ message: "Invalid role. Must be 'admin' or 'manager'" });
      }
      user.role = role;
    }

    // If role is manager, projectId is required
    const userRole = role || user.role;
    if (userRole === "manager" && !projectId && user.projectIds.length === 0) {
      return res.status(400).json({ message: "projectId is required for manager role" });
    }

    // Update project assignment
    if (projectId !== undefined) {
      // Validate project exists
      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(400).json({ message: "Invalid projectId: project not found" });
      }
      // Replace projectIds array with new projectId
      user.projectIds = projectId ? [projectId] : [];
    }

    // Update password if provided
    if (password) {
      const saltRounds = 10;
      user.passwordHash = await bcrypt.hash(password, saltRounds);
    }

    await user.save();

    // Return updated user without passwordHash
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      projectIds: user.projectIds,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    console.log("✅ User updated successfully:", userResponse);
    return res.json(userResponse);
  } catch (err) {
    console.error("❌ Error updating user:", err);
    if (err.code === 11000) {
      return res.status(400).json({ message: "Email already exists" });
    }
    return res.status(500).json({ message: err.message });
  }
}

// DELETE /users/:id
async function deleteUser(req, res) {
  try {
    const userId = req.params.id;

    // Prevent deleting yourself
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: "Cannot delete your own account" });
    }

    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log("✅ User deleted successfully:", user.email);
    return res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting user:", err);
    return res.status(500).json({ message: err.message });
  }
}

module.exports = { createUser, listUsers, login, getUserById, updateUser, deleteUser };

