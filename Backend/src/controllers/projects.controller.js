const Project = require("../models/Project");
const User = require("../models/User");

// POST /projects - Only admin can create
async function createProject(req, res) {
  try {
    // Check if user is admin
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admin can create projects" });
    }

    console.log("📥 POST /projects - Received body:", req.body);
    const { name, location, description, managerId } = req.body;

    if (!name || !location) {
      console.log("❌ Validation failed: missing name or location");
      return res.status(400).json({ message: "name and location are required" });
    }

    // Manager assignment is optional - can be assigned later
    let manager = null;
    if (managerId) {
      // Validate manager exists and is a manager
      manager = await User.findById(managerId);
      if (!manager) {
        return res.status(400).json({ message: "Manager not found" });
      }
      if (manager.role !== "manager") {
        return res.status(400).json({ message: "User is not a manager" });
      }
    }

    // Create the project
    const project = await Project.create({
      name,
      location,
      description: description || "",
      createdBy: req.user._id
    });

    // Assign project to manager if provided
    if (manager) {
      if (!manager.projectIds) {
        manager.projectIds = [];
      }
      if (!manager.projectIds.includes(project._id)) {
        manager.projectIds.push(project._id);
      }
      await manager.save();
      console.log(`✅ Assigned project to manager: ${manager.email}`);
    }

    console.log("✅ Project created successfully:", project);
    return res.status(201).json(project);
  } catch (err) {
    console.error("❌ Error creating project:", err);
    return res.status(500).json({ message: err.message });
  }
}

// GET /projects - Admin gets all, Manager gets only their assigned project
async function listProjects(req, res) {
  try {
    let query = {};

    // If user is manager, only show their assigned project(s)
    if (req.user.role === "manager") {
      if (!req.user.projectIds || req.user.projectIds.length === 0) {
        return res.json([]); // Manager has no assigned projects
      }
      query._id = { $in: req.user.projectIds };
    }
    // Admin gets all projects (no filter)

    const projects = await Project.find(query).sort({ createdAt: -1 });
    
    // For admin, populate manager info
    if (req.user.role === "admin") {
      const projectsWithManagers = await Promise.all(
        projects.map(async (project) => {
          const manager = await User.findOne({ 
            role: "manager", 
            projectIds: project._id 
          }).select("name email");
          
          return {
            ...project.toObject(),
            manager: manager ? { name: manager.name, email: manager.email, _id: manager._id } : null
          };
        })
      );
      return res.json(projectsWithManagers);
    }
    
    return res.json(projects);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

// POST /projects/seed - Only admin can seed
async function seedProjects(req, res) {
  try {
    // Check if user is admin
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admin can seed projects" });
    }

    const sampleProjects = [
      {
        name: "Downtown Office Complex",
        location: "New York, NY",
        description: "A modern 20-story office building in the heart of Manhattan with state-of-the-art facilities and prime location."
      },
      {
        name: "Riverside Residential Tower",
        location: "Los Angeles, CA",
        description: "Luxury residential development with stunning river views, featuring 150 units with premium amenities."
      },
      {
        name: "Tech Park Innovation Hub",
        location: "Austin, TX",
        description: "Mixed-use development combining office spaces, retail, and green areas designed for tech companies."
      },
      {
        name: "Coastal Marina Resort",
        location: "Miami, FL",
        description: "Exclusive waterfront property featuring a marina, hotel, and residential condominiums with private beach access."
      },
      {
        name: "Historic Warehouse Conversion",
        location: "Portland, OR",
        description: "Renovation of a 1920s warehouse into modern lofts and commercial spaces, preserving historic character."
      }
    ];

    // Clear existing projects (optional - you can remove this if you want to keep existing data)
    const clearExisting = req.query.clear === "true";
    if (clearExisting) {
      await Project.deleteMany({});
      console.log("🗑️ Cleared existing projects");
    }

    // Check if projects already exist
    const existingCount = await Project.countDocuments();
    if (existingCount > 0 && !clearExisting) {
      return res.status(400).json({ 
        message: "Projects already exist. Use ?clear=true to replace them.",
        existingCount 
      });
    }

    // Insert sample projects
    const createdProjects = await Project.insertMany(sampleProjects);
    console.log(`✅ Seeded ${createdProjects.length} sample projects`);

    return res.status(201).json({
      message: `Successfully seeded ${createdProjects.length} projects`,
      projects: createdProjects
    });
  } catch (err) {
    console.error("❌ Error seeding projects:", err);
    return res.status(500).json({ message: err.message });
  }
}

// GET /projects/:id
async function getProjectById(req, res) {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    return res.json(project);
  } catch (err) {
    console.error("❌ Error fetching project:", err);
    return res.status(500).json({ message: err.message });
  }
}

// PUT /projects/:id
async function updateProject(req, res) {
  try {
    // Check if user is admin
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admin can update projects" });
    }

    console.log("📥 PUT /projects/:id - Received body:", req.body);
    const { name, location, description, managerId } = req.body;
    const projectId = req.params.id;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Update fields
    if (name) project.name = name;
    if (location) project.location = location;
    if (description !== undefined) project.description = description || "";

    await project.save();

    // Handle manager assignment if provided
    if (managerId !== undefined) {
      // Find current manager(s) with this project
      const currentManagers = await User.find({ 
        role: "manager", 
        projectIds: projectId 
      });

      // Remove project from current managers
      for (const manager of currentManagers) {
        manager.projectIds = manager.projectIds.filter(
          id => id.toString() !== projectId.toString()
        );
        await manager.save();
      }

      // Assign to new manager if provided
      if (managerId) {
        const newManager = await User.findById(managerId);
        if (!newManager) {
          return res.status(400).json({ message: "Manager not found" });
        }
        if (newManager.role !== "manager") {
          return res.status(400).json({ message: "User is not a manager" });
        }

        if (!newManager.projectIds) {
          newManager.projectIds = [];
        }
        if (!newManager.projectIds.includes(projectId)) {
          newManager.projectIds.push(projectId);
        }
        await newManager.save();
        console.log(`✅ Assigned project to manager: ${newManager.email}`);
      }
    }

    console.log("✅ Project updated successfully:", project);
    return res.json(project);
  } catch (err) {
    console.error("❌ Error updating project:", err);
    return res.status(500).json({ message: err.message });
  }
}

// DELETE /projects/:id
async function deleteProject(req, res) {
  try {
    // Check if user is admin
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admin can delete projects" });
    }

    const projectId = req.params.id;
    const project = await Project.findByIdAndDelete(projectId);
    
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Remove project from all managers
    const managers = await User.find({ 
      role: "manager", 
      projectIds: projectId 
    });

    for (const manager of managers) {
      manager.projectIds = manager.projectIds.filter(
        id => id.toString() !== projectId.toString()
      );
      await manager.save();
    }

    console.log("✅ Project deleted successfully");
    return res.json({ message: "Project deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting project:", err);
    return res.status(500).json({ message: err.message });
  }
}

module.exports = { createProject, listProjects, seedProjects, getProjectById, updateProject, deleteProject };
