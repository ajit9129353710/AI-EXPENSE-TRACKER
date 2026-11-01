const express = require("express");
const { GoogleGenAI } = require("@google/genai");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

router.post("/chat", authMiddleware, async (req, res) => {
  try {
    const { question, income, expenses, balance } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please enter your question.",
      });
    }

    const prompt = `
You are ExpenseFlow AI, a helpful personal finance assistant.

Use the following financial summary provided by the application:
Total Income: ${Number(income) || 0}
Total Expenses: ${Number(expenses) || 0}
Current Balance: ${Number(balance) || 0}

User Question: ${question}

Instructions:
- Answer in simple language.
- Give practical budgeting suggestions.
- Never invent transactions or financial data.
- Explain that estimates are not guarantees.
- Do not claim to be a certified financial advisor.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
    });

    return res.status(200).json({
      success: true,
      answer: response.text,
    });
  } catch (error) {
    console.error("ExpenseFlow AI Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "AI response failed. Please try again.",
    });
  }
});

module.exports = router;