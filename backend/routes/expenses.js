// routes/expenses.js
// All expense-related API endpoints live here.

const express = require("express");
const router = express.Router();
const store = require("../store");

// Small helper to validate incoming expense payloads
function validateExpense(body, { partial = false } = {}) {
  const errors = [];
  const { title, amount, type, date } = body;

  if (!partial || title !== undefined) {
    if (!title || typeof title !== "string" || !title.trim()) {
      errors.push("title is required and must be a non-empty string");
    }
  }
  if (!partial || amount !== undefined) {
    if (amount === undefined || isNaN(Number(amount)) || Number(amount) <= 0) {
      errors.push("amount is required and must be a positive number");
    }
  }
  if (!partial || type !== undefined) {
    if (type && !["income", "expense"].includes(type)) {
      errors.push("type must be either 'income' or 'expense'");
    }
  }
  if (!partial || date !== undefined) {
    if (!date || isNaN(Date.parse(date))) {
      errors.push("date is required and must be a valid date (YYYY-MM-DD)");
    }
  }
  return errors;
}

// GET /api/expenses -> list all expenses (supports optional filters: category, type, from, to, search)
router.get("/", (req, res) => {
  try {
    const rows = store.getAll(req.query);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/expenses/summary -> totals for dashboard
router.get("/summary", (req, res) => {
  try {
    res.json({ success: true, data: store.getSummary() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/expenses/:id -> single expense
router.get("/:id", (req, res) => {
  const row = store.getById(req.params.id);
  if (!row) {
    return res.status(404).json({ success: false, error: "Expense not found" });
  }
  res.json({ success: true, data: row });
});

// POST /api/expenses -> create new expense
router.post("/", (req, res) => {
  const errors = validateExpense(req.body);
  if (errors.length) {
    return res.status(400).json({ success: false, errors });
  }

  const { title, amount, type = "expense", category = "General", date, notes = "" } = req.body;

  try {
    const newRow = store.insert({
      title: title.trim(),
      amount: Number(amount),
      type,
      category,
      date,
      notes,
    });
    res.status(201).json({ success: true, data: newRow });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/expenses/:id -> update existing expense (partial update allowed)
router.put("/:id", (req, res) => {
  const existing = store.getById(req.params.id);
  if (!existing) {
    return res.status(404).json({ success: false, error: "Expense not found" });
  }

  const errors = validateExpense(req.body, { partial: true });
  if (errors.length) {
    return res.status(400).json({ success: false, errors });
  }

  const changes = {};
  if (req.body.title !== undefined) changes.title = req.body.title.trim();
  if (req.body.amount !== undefined) changes.amount = Number(req.body.amount);
  if (req.body.type !== undefined) changes.type = req.body.type;
  if (req.body.category !== undefined) changes.category = req.body.category;
  if (req.body.date !== undefined) changes.date = req.body.date;
  if (req.body.notes !== undefined) changes.notes = req.body.notes;

  try {
    const newRow = store.update(req.params.id, changes);
    res.json({ success: true, data: newRow });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/expenses/:id -> remove an expense
router.delete("/:id", (req, res) => {
  const existing = store.getById(req.params.id);
  if (!existing) {
    return res.status(404).json({ success: false, error: "Expense not found" });
  }

  store.remove(req.params.id);
  res.json({ success: true, message: `Expense ${req.params.id} deleted` });
});

module.exports = router;
