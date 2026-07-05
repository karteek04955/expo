// routes/settings.js
// Stores user-level settings — currently just monthly income.

const express = require("express");
const router = express.Router();
const store = require("../store");

// GET /api/settings -> { monthlyIncome }
router.get("/", (req, res) => {
  try {
    res.json({ success: true, data: store.getSettings() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/settings -> update monthlyIncome
router.put("/", (req, res) => {
  const { monthlyIncome } = req.body;

  if (monthlyIncome === undefined || isNaN(Number(monthlyIncome)) || Number(monthlyIncome) < 0) {
    return res.status(400).json({
      success: false,
      errors: ["monthlyIncome is required and must be a non-negative number"],
    });
  }

  try {
    const updated = store.updateSettings({ monthlyIncome: Number(monthlyIncome) });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
