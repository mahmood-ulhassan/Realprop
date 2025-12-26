const express = require("express");
const cors = require("cors");

const app = express();

// Allow requests from frontend (later)
app.use(cors());

// Parse JSON bodies
app.use(express.json());

const projectsRoutes = require("./routes/projects.routes");
app.use("/projects", projectsRoutes);

const usersRoutes = require("./routes/users.routes");
app.use("/users", usersRoutes);

const leadsRoutes = require("./routes/leads.routes");
app.use("/leads", leadsRoutes);

const dashboardRoutes = require("./routes/dashboard.routes");
app.use("/dashboard", dashboardRoutes);

const inventoryRoutes = require("./routes/inventory.routes");
app.use("/inventory", inventoryRoutes);

const tasksRoutes = require("./routes/tasks.routes");
app.use("/tasks", tasksRoutes);

const notificationsRoutes = require("./routes/notifications.routes");
app.use("/notifications", notificationsRoutes);

// Quick test route
app.get("/health", (req, res) => {
  res.json({ ok: true, service: "realprop-backend" });
});

// Global error handler middleware
app.use((err, req, res, next) => {
  console.error("❌ Unhandled error:", err);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack })
  });
});

module.exports = app;
