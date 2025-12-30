const express = require("express");
const router = express.Router();
const { 
  createAccount, 
  getAccounts, 
  getAccountSummary,
  updateAccount, 
  deleteAccount,
  getCategories,
  getModes,
  getBalance
} = require("../controllers/accounts.controller");
const { authenticateToken } = require("../middleware/auth.middleware");

// All routes require authentication
router.use(authenticateToken);

// Admin only routes
router.post("/", (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Only admins can manage accounts" });
  }
  next();
}, createAccount);

router.get("/", (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Only admins can view accounts" });
  }
  next();
}, getAccounts);

router.get("/summary", (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Only admins can view account summary" });
  }
  next();
}, getAccountSummary);

router.get("/categories", (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Only admins can view categories" });
  }
  next();
}, getCategories);

router.get("/modes", (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Only admins can view modes" });
  }
  next();
}, getModes);

router.get("/balance", (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Only admins can view balance" });
  }
  next();
}, getBalance);

router.put("/:id", (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Only admins can update accounts" });
  }
  next();
}, updateAccount);

router.delete("/:id", (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Only admins can delete accounts" });
  }
  next();
}, deleteAccount);

module.exports = router;

