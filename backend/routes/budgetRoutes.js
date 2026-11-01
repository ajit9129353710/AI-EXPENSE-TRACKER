const express = require("express");
const mongoose = require("mongoose");
const Budget = require("../models/Budget");
const Transaction = require("../models/Transaction");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

const CATEGORIES = [
  "Food",
  "Salary",
  "Shopping",
  "Travel",
  "Bills",
  "Education",
  "Health",
  "Entertainment",
  "Business",
  "Other",
];

function getUserId(req) {
  return req.user?._id || req.user?.id || req.user?.userId;
}

function validPeriod(month, year) {
  return (
    Number.isInteger(Number(month)) &&
    Number(month) >= 1 &&
    Number(month) <= 12 &&
    Number.isInteger(Number(year)) &&
    Number(year) >= 2000 &&
    Number(year) <= 2100
  );
}

function getPeriod(req) {
  const now = new Date();

  const month = req.query.month ?? now.getMonth() + 1;
  const year = req.query.year ?? now.getFullYear();

  if (!validPeriod(month, year)) {
    return null;
  }

  return {
    month: Number(month),
    year: Number(year),
  };
}

function getTransactionDateQuery(month, year) {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));

  return {
    date: {
      $gte: start,
      $lt: end,
    },
  };
}
router.get("/", async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId || !mongoose.isValidObjectId(userId)) {
      return res.status(401).json({
        message: "Valid login required.",
      });
    }

    const period = getPeriod(req);

    if (!period) {
      return res.status(400).json({
        message: "Valid month and year required.",
      });
    }

    const budgets = await Budget.find({
      user: userId,
      month: period.month,
      year: period.year,
    }).sort({ category: 1 });

    const spending = await Transaction.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          ...getTransactionDateQuery(period.month, period.year),
          type: "expense",
        },
      },
      {
        $group: {
          _id: "$category",
          total: { $sum: "$amount" },
        },
      },
    ]);

    const spendingMap = {};

    spending.forEach((item) => {
      spendingMap[item._id || "Other"] = item.total;
    });

    const results = budgets.map((budget) => {
      const spent = Number(spendingMap[budget.category] || 0);
      const amount = Number(budget.amount);
      const percentage = amount > 0 ? (spent / amount) * 100 : 0;
      const remaining = Math.max(amount - spent, 0);

      let status = "safe";

      if (percentage >= 100) {
        status = "exceeded";
      } else if (percentage >= Number(budget.alertAt)) {
        status = "warning";
      }

      return {
        ...budget.toObject(),
        spent,
        remaining,
        percentage: Math.round(percentage * 100) / 100,
        status,
      };
    });

    return res.json({
      month: period.month,
      year: period.year,
      budgets: results,
    });
  } catch (error) {
    console.error("GET BUDGETS ERROR:", error);

    return res.status(500).json({
      message: "Budgets load nahi ho sake.",
      error: error.message,
    });
  }
});

router.post("/", async (req, res) => {
  try {
    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
      return res.status(400).json({
        message:
          "Budget data missing. Check express.json() in backend/server.js.",
      });
    }

    const userId = getUserId(req);

    if (!userId || !mongoose.isValidObjectId(userId)) {
      return res.status(401).json({
        message: "Valid login required.",
      });
    }

    const {
      name,
      category,
      amount,
      month,
      year,
      alertAt = 80,
    } = req.body;

    const currentDate = new Date();
    const selectedMonth = month ?? currentDate.getMonth() + 1;
    const selectedYear = year ?? currentDate.getFullYear();

    if (!name || !String(name).trim()) {
      return res.status(400).json({
        message: "Budget name required.",
      });
    }

    if (!CATEGORIES.includes(category)) {
      return res.status(400).json({
        message: "Valid category required.",
      });
    }

    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({
        message: "Budget amount must be greater than zero.",
      });
    }

    if (!validPeriod(selectedMonth, selectedYear)) {
      return res.status(400).json({
        message: "Valid month and year required.",
      });
    }

    if (
      !Number.isFinite(Number(alertAt)) ||
      Number(alertAt) < 1 ||
      Number(alertAt) > 100
    ) {
      return res.status(400).json({
        message: "Alert percentage must be between 1 and 100.",
      });
    }

    const budget = await Budget.create({
      user: userId,
      name: String(name).trim(),
      category,
      amount: Number(amount),
      month: Number(selectedMonth),
      year: Number(selectedYear),
      alertAt: Number(alertAt),
    });

    return res.status(201).json({
      message: "Budget successfully created.",
      budget,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message:
          "Is category ka budget is month ke liye pehle se bana hua hai.",
      });
    }

    console.error("CREATE BUDGET ERROR:", error);

    return res.status(500).json({
      message: "Budget create nahi hua.",
      error: error.message,
    });
  }
});
router.put("/:id", async (req, res) => {
  try {
    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
      return res.status(400).json({
        message:
          "Budget data missing. Check express.json() in backend/server.js.",
      });
    }

    const userId = getUserId(req);
    const { id } = req.params;

    if (!userId || !mongoose.isValidObjectId(userId)) {
      return res.status(401).json({
        message: "Valid login required.",
      });
    }

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid budget ID.",
      });
    }

    const budget = await Budget.findOne({
      _id: id,
      user: userId,
    });

    if (!budget) {
      return res.status(404).json({
        message: "Budget nahi mila.",
      });
    }

    const { name, category, amount, month, year, alertAt } = req.body;

    if (name !== undefined) {
      if (!String(name).trim()) {
        return res.status(400).json({
          message: "Budget name required.",
        });
      }

      budget.name = String(name).trim();
    }

    if (category !== undefined) {
      if (!CATEGORIES.includes(category)) {
        return res.status(400).json({
          message: "Valid category required.",
        });
      }

      budget.category = category;
    }

    if (amount !== undefined) {
      if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
        return res.status(400).json({
          message: "Budget amount must be greater than zero.",
        });
      }

      budget.amount = Number(amount);
    }

    if (month !== undefined || year !== undefined) {
      const newMonth = month ?? budget.month;
      const newYear = year ?? budget.year;

      if (!validPeriod(newMonth, newYear)) {
        return res.status(400).json({
          message: "Valid month and year required.",
        });
      }

      budget.month = Number(newMonth);
      budget.year = Number(newYear);
    }

    if (alertAt !== undefined) {
      if (
        !Number.isFinite(Number(alertAt)) ||
        Number(alertAt) < 1 ||
        Number(alertAt) > 100
      ) {
        return res.status(400).json({
          message: "Alert percentage must be between 1 and 100.",
        });
      }

      budget.alertAt = Number(alertAt);
    }

    await budget.save();

    return res.json({
      message: "Budget successfully updated.",
      budget,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Is category ka budget pehle se maujood hai.",
      });
    }

    console.error("UPDATE BUDGET ERROR:", error);

    return res.status(500).json({
      message: "Budget update nahi hua.",
      error: error.message,
    });
  }
});
router.delete("/:id", async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    if (!userId || !mongoose.isValidObjectId(userId)) {
      return res.status(401).json({
        message: "Valid login required.",
      });
    }

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid budget ID.",
      });
    }

    const budget = await Budget.findOneAndDelete({
      _id: id,
      user: userId,
    });

    if (!budget) {
      return res.status(404).json({
        message: "Budget nahi mila.",
      });
    }

    return res.json({
      message: "Budget successfully deleted.",
    });
  } catch (error) {
    console.error("DELETE BUDGET ERROR:", error);

    return res.status(500).json({
      message: "Budget delete nahi hua.",
      error: error.message,
    });
  }
});

module.exports = router;