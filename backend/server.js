// server.js
// Entry point for the Expense Tracker API — now also serves the frontend
// directly, so there's just ONE server, ONE port, and no CORS/localhost
// mismatch to worry about.

const path = require("path");
const express = require("express");
const cors = require("cors");
const expensesRouter = require("./routes/expenses");
const settingsRouter = require("./routes/settings");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Simple request logger (helpful while developing in VS Code)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
  next();
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "Expense Tracker API is running" });
});

// API routes
app.use("/api/expenses", expensesRouter);
app.use("/api/settings", settingsRouter);

// Serve the frontend (index.html, style.css, app.js) from the same server
const frontendPath = path.join(__dirname, "..", "frontend");
app.use(express.static(frontendPath));

// Any non-API route falls back to index.html (so refreshing works)
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

// Generic error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`🚀 Expense Tracker running at http://localhost:${PORT}`);
  console.log(`   (frontend + API both served from this one address)`);
});
