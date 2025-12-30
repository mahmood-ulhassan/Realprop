const Account = require("../models/Account");
const Project = require("../models/Project");

/**
 * Create a new account entry
 * POST /accounts
 * Admin only
 */
async function createAccount(req, res) {
  try {
    const { projectId, date, amount, type, mode, category, description } = req.body;
    const userId = req.user.id;

    if (!projectId || !date || !amount || !type || !mode || !category) {
      return res.status(400).json({ message: "Project, date, amount, type, mode, and category are required" });
    }

    // Verify project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const account = new Account({
      projectId,
      date: new Date(date),
      amount: parseFloat(amount),
      type,
      mode: mode.trim(),
      category: category.trim(),
      description: description || "",
      addedBy: userId
    });

    await account.save();
    await account.populate("addedBy", "name email");
    await account.populate("projectId", "name");

    return res.status(201).json(account);
  } catch (err) {
    console.error("❌ Error creating account entry:", err);
    return res.status(500).json({ message: err.message || "Failed to create account entry" });
  }
}

/**
 * Get account entries for a project with filters
 * GET /accounts
 * Admin only
 */
async function getAccounts(req, res) {
  try {
    const { projectId, type, startDate, endDate } = req.query;

    let query = {};

    // Filter by project
    if (projectId) {
      query.projectId = projectId;
    }

    // Filter by type
    if (type && ["income", "expense", "incomingLoan", "outgoingLoan", "payout"].includes(type)) {
      query.type = type;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }

    const accounts = await Account.find(query)
      .populate("projectId", "name")
      .populate("addedBy", "name email")
      .sort({ date: -1, createdAt: -1 });

    return res.json(accounts);
  } catch (err) {
    console.error("❌ Error getting accounts:", err);
    return res.status(500).json({ message: err.message || "Failed to get accounts" });
  }
}

/**
 * Get account summary (totals) for a project
 * GET /accounts/summary
 * Admin only
 */
async function getAccountSummary(req, res) {
  try {
    const { projectId, startDate, endDate } = req.query;

    let query = {};

    // Filter by project
    if (projectId) {
      query.projectId = projectId;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }

    const accounts = await Account.find(query);

    const summary = {
      totalIncome: 0,
      totalExpenses: 0,
      totalLoans: 0,
      totalPayouts: 0,
      totalProfit: 0
    };

    let totalIncomingLoans = 0;
    let totalOutgoingLoans = 0;

    accounts.forEach(account => {
      if (account.type === "income") {
        summary.totalIncome += account.amount;
      } else if (account.type === "expense") {
        summary.totalExpenses += account.amount;
      } else if (account.type === "incomingLoan") {
        totalIncomingLoans += account.amount;
      } else if (account.type === "outgoingLoan") {
        totalOutgoingLoans += account.amount;
      } else if (account.type === "payout") {
        summary.totalPayouts += account.amount;
      }
    });

    // Net loans = outgoing - incoming (positive means project is owed, negative means project owes)
    summary.totalLoans = totalOutgoingLoans - totalIncomingLoans;
    summary.totalIncomingLoans = totalIncomingLoans;
    summary.totalOutgoingLoans = totalOutgoingLoans;

    summary.totalProfit = summary.totalIncome - summary.totalExpenses;

    return res.json(summary);
  } catch (err) {
    console.error("❌ Error getting account summary:", err);
    return res.status(500).json({ message: err.message || "Failed to get account summary" });
  }
}

/**
 * Update an account entry
 * PUT /accounts/:id
 * Admin only
 */
async function updateAccount(req, res) {
  try {
    const { id } = req.params;
    const { date, amount, type, mode, category, description } = req.body;

    const updateData = {};
    if (date) updateData.date = new Date(date);
    if (amount !== undefined) updateData.amount = parseFloat(amount);
    if (type) updateData.type = type;
    if (mode) updateData.mode = mode.trim();
    if (category) updateData.category = category.trim();
    if (description !== undefined) updateData.description = description.trim();

    const account = await Account.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    )
      .populate("projectId", "name")
      .populate("addedBy", "name email");

    if (!account) {
      return res.status(404).json({ message: "Account entry not found" });
    }

    return res.json(account);
  } catch (err) {
    console.error("❌ Error updating account:", err);
    return res.status(500).json({ message: err.message || "Failed to update account entry" });
  }
}

/**
 * Delete an account entry
 * DELETE /accounts/:id
 * Admin only
 */
async function deleteAccount(req, res) {
  try {
    const { id } = req.params;

    const account = await Account.findByIdAndDelete(id);

    if (!account) {
      return res.status(404).json({ message: "Account entry not found" });
    }

    return res.json({ message: "Account entry deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting account:", err);
    return res.status(500).json({ message: err.message || "Failed to delete account entry" });
  }
}

/**
 * Get unique categories for a project
 * GET /accounts/categories
 * Admin only
 */
async function getCategories(req, res) {
  try {
    const { projectId } = req.query;

    let query = {};
    if (projectId) {
      query.projectId = projectId;
    }

    const accounts = await Account.find(query).select("category type");
    const categories = [...new Set(accounts.map(a => a.category))].sort();

    return res.json(categories);
  } catch (err) {
    console.error("❌ Error getting categories:", err);
    return res.status(500).json({ message: err.message || "Failed to get categories" });
  }
}

/**
 * Get unique modes (accounts) - global across all projects
 * GET /accounts/modes
 * Admin only
 */
async function getModes(req, res) {
  try {
    const accounts = await Account.find().select("mode");
    const modes = [...new Set(accounts.map(a => a.mode))].sort();

    return res.json(modes);
  } catch (err) {
    console.error("❌ Error getting modes:", err);
    return res.status(500).json({ message: err.message || "Failed to get modes" });
  }
}

/**
 * Get balance for all modes (all-time, global)
 * GET /accounts/balance
 * Admin only
 */
async function getBalance(req, res) {
  try {
    const allAccounts = await Account.find();

    // Group by mode and calculate balance
    const balanceByMode = {};

    allAccounts.forEach(account => {
      if (!balanceByMode[account.mode]) {
        balanceByMode[account.mode] = 0;
      }

      if (account.type === "income") {
        balanceByMode[account.mode] += account.amount;
      } else if (account.type === "expense") {
        balanceByMode[account.mode] -= account.amount;
      } else if (account.type === "incomingLoan") {
        balanceByMode[account.mode] += account.amount; // Incoming loans add to account (money coming in)
      } else if (account.type === "outgoingLoan") {
        balanceByMode[account.mode] -= account.amount; // Outgoing loans subtract from account (money going out)
      } else if (account.type === "payout") {
        balanceByMode[account.mode] -= account.amount; // Payouts are deducted
      }
    });

    // Convert to array format
    const balances = Object.keys(balanceByMode)
      .sort()
      .map(mode => ({
        mode: mode,
        balance: balanceByMode[mode]
      }));

    return res.json(balances);
  } catch (err) {
    console.error("❌ Error getting balance:", err);
    return res.status(500).json({ message: err.message || "Failed to get balance" });
  }
}

module.exports = {
  createAccount,
  getAccounts,
  getAccountSummary,
  updateAccount,
  deleteAccount,
  getCategories,
  getModes,
  getBalance
};

