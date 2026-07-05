// store.js
// A tiny dependency-free JSON-file database.
// Avoids native modules (like better-sqlite3/sqlite3) so this project
// runs anywhere with plain `npm install` + Node.js, no build tools required.

const fs = require("fs");
const path = require("path");

const DB_FILE = path.join(__dirname, "expenses.json");

function loadRaw() {
  if (!fs.existsSync(DB_FILE)) {
    const seed = {
      nextId: 2,
      settings: {
        monthlyIncome: 0,
      },
      records: [
        {
          id: 1,
          title: "Groceries",
          amount: 1200,
          type: "expense",
          category: "Food",
          date: new Date().toISOString().slice(0, 10),
          notes: "Initial seed data",
          created_at: new Date().toISOString(),
        },
      ],
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2));
    return seed;
  }
  const data = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
  // Migrate older DB files that predate the settings field
  if (!data.settings) {
    data.settings = { monthlyIncome: 0 };
    saveRaw(data);
  }
  return data;
}

function saveRaw(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

function getAll(filters = {}) {
  const data = loadRaw();
  let rows = data.records;

  if (filters.category) rows = rows.filter((r) => r.category === filters.category);
  if (filters.type) rows = rows.filter((r) => r.type === filters.type);
  if (filters.from) rows = rows.filter((r) => r.date >= filters.from);
  if (filters.to) rows = rows.filter((r) => r.date <= filters.to);
  if (filters.search) {
    const s = filters.search.toLowerCase();
    rows = rows.filter(
      (r) => r.title.toLowerCase().includes(s) || (r.notes || "").toLowerCase().includes(s)
    );
  }

  // newest first
  rows = [...rows].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.id - a.id));
  return rows;
}

function getById(id) {
  const data = loadRaw();
  return data.records.find((r) => String(r.id) === String(id));
}

function insert(record) {
  const data = loadRaw();
  const newRecord = {
    id: data.nextId,
    created_at: new Date().toISOString(),
    ...record,
  };
  data.records.push(newRecord);
  data.nextId += 1;
  saveRaw(data);
  return newRecord;
}

function update(id, changes) {
  const data = loadRaw();
  const idx = data.records.findIndex((r) => String(r.id) === String(id));
  if (idx === -1) return null;
  data.records[idx] = { ...data.records[idx], ...changes };
  saveRaw(data);
  return data.records[idx];
}

function remove(id) {
  const data = loadRaw();
  const idx = data.records.findIndex((r) => String(r.id) === String(id));
  if (idx === -1) return false;
  data.records.splice(idx, 1);
  saveRaw(data);
  return true;
}

function getSummary() {
  const data = loadRaw();
  const rows = data.records;
  const monthlyIncome = data.settings.monthlyIncome || 0;

  const transactionIncome = rows.filter((r) => r.type === "income").reduce((sum, r) => sum + r.amount, 0);
  const totalExpense = rows.filter((r) => r.type === "expense").reduce((sum, r) => sum + r.amount, 0);

  // Total Income = income transactions you've logged + your set monthly income
  const totalIncome = transactionIncome + monthlyIncome;

  const byCategoryMap = {};
  rows
    .filter((r) => r.type === "expense")
    .forEach((r) => {
      byCategoryMap[r.category] = (byCategoryMap[r.category] || 0) + r.amount;
    });

  const byCategory = Object.entries(byCategoryMap)
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);

  return {
    totalIncome,
    transactionIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    byCategory,
    monthlyIncome,
  };
}

function getSettings() {
  return loadRaw().settings;
}

function updateSettings(changes) {
  const data = loadRaw();
  data.settings = { ...data.settings, ...changes };
  saveRaw(data);
  return data.settings;
}

module.exports = { getAll, getById, insert, update, remove, getSummary, getSettings, updateSettings };
