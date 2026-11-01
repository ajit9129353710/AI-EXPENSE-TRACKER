const express = require("express");
const mongoose = require("mongoose");
const Transaction = require("../models/Transaction");
const authMiddleware = require("../middleware/authMiddleware");
const router = express.Router();
router.use(authMiddleware);

router.get("/", async (req, res) => {
  try {
    const { type, category, startDate, endDate, search } = req.query;

    const filter = {
      user: req.user._id,
    };

    if (type) {
      if (!["income", "expense"].includes(type)) {
        return res.status(400).json({
          success: false,
          message: "Invalid transaction type",
        });
      }

      filter.type = type;
    }

    if (category) {
      filter.category = category;
    }

    if (search) {
      const safeSearch = search
        .trim()
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      filter.title = {
        $regex: safeSearch,
        $options: "i",
      };
    }

    if (startDate || endDate) {
      filter.date = {};

      if (startDate) {
        const start = new Date(startDate);

        if (Number.isNaN(start.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Invalid startDate",
          });
        }

        filter.date.$gte = start;
      }

      if (endDate) {
        const end = new Date(endDate);

        if (Number.isNaN(end.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Invalid endDate",
          });
        }

        filter.date.$lte = end;
      }

      if (
        filter.date.$gte &&
        filter.date.$lte &&
        filter.date.$gte > filter.date.$lte
      ) {
        return res.status(400).json({
          success: false,
          message: "startDate cannot be after endDate",
        });
      }
    }

    const transactions = await Transaction.find(filter).sort({
      date: -1,
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: transactions.length,
      transactions,
    });
  } catch (error) {
    console.error("Get Transactions Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to fetch transactions",
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const { title, amount, type, category, date, description } = req.body;

    if (
      typeof title !== "string" ||
      !title.trim() ||
      title.trim().length > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid title is required",
      });
    }

    if (
      amount === undefined ||
      amount === null ||
      typeof amount !== "number" ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Amount must be a positive number",
      });
    }

    if (!["income", "expense"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Type must be income or expense",
      });
    }

    if (
      typeof category !== "string" ||
      !category.trim() ||
      category.trim().length > 50
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid category is required",
      });
    }

    const transactionDate = date ? new Date(date) : new Date();

    if (Number.isNaN(transactionDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid transaction date",
      });
    }

    if (
      description !== undefined &&
      (typeof description !== "string" || description.length > 500)
    ) {
      return res.status(400).json({
        success: false,
        message: "Description must be at most 500 characters",
      });
    }

    const transaction = await Transaction.create({
      user: req.user._id,
      title: title.trim(),
      amount,
      type,
      category: category.trim(),
      date: transactionDate,
      description: description || "",
    });

    res.status(201).json({
      success: true,
      message: "Transaction added successfully",
      transaction,
    });
  } catch (error) {
    console.error("Add Transaction Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to add transaction",
    });
  }
});
router.get("/summary", async (req, res) => {
  try {
    const result = await Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
        },
      },
      {
        $group: {
          _id: "$type",
          total: {
            $sum: "$amount",
          },
          count: {
            $sum: 1,
          },
        },
      },
    ]);

    const income = result.find((item) => item._id === "income");
    const expense = result.find((item) => item._id === "expense");

    const totalIncome = income ? income.total : 0;
    const totalExpense = expense ? expense.total : 0;

    res.status(200).json({
      success: true,
      summary: {
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
        incomeCount: income ? income.count : 0,
        expenseCount: expense ? expense.count : 0,
      },
    });
  } catch (error) {
    console.error("Summary Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to calculate summary",
    });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid transaction ID",
      });
    }

    const allowedFields = [
      "title",
      "amount",
      "type",
      "category",
      "date",
      "description",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided",
      });
    }

    if (
      updates.title !== undefined &&
      (typeof updates.title !== "string" ||
        !updates.title.trim() ||
        updates.title.trim().length > 100)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid title",
      });
    }

    if (updates.amount !== undefined) {
      if (
        typeof updates.amount !== "number" ||
        !Number.isFinite(updates.amount) ||
        updates.amount <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Amount must be a positive number",
        });
      }
    }

    if (
      updates.type !== undefined &&
      !["income", "expense"].includes(updates.type)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid transaction type",
      });
    }

    if (
      updates.category !== undefined &&
      (typeof updates.category !== "string" ||
        !updates.category.trim() ||
        updates.category.trim().length > 50)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid category",
      });
    }

    if (updates.date !== undefined) {
      const updatedDate = new Date(updates.date);

      if (Number.isNaN(updatedDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid transaction date",
        });
      }

      updates.date = updatedDate;
    }

    if (updates.description !== undefined) {
      if (
        typeof updates.description !== "string" ||
        updates.description.length > 500
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid description",
        });
      }
    }

    if (updates.title !== undefined) {
      updates.title = updates.title.trim();
    }

    if (updates.category !== undefined) {
      updates.category = updates.category.trim();
    }

    const transaction = await Transaction.findOneAndUpdate(
      {
        _id: id,
        user: req.user._id,
      },
      {
        $set: updates,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Transaction updated successfully",
      transaction,
    });
  } catch (error) {
    console.error("Update Transaction Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to update transaction",
    });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid transaction ID",
      });
    }

    const transaction = await Transaction.findOneAndDelete({
      _id: id,
      user: req.user._id,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Transaction deleted successfully",
    });
  } catch (error) {
    console.error("Delete Transaction Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to delete transaction",
    });
  }
});

module.exports = router;