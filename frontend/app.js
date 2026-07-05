// app.js
// Talks to the Expense Tracker backend API and renders the UI.

const API_BASE = "/api/expenses";
const SETTINGS_BASE = "/api/settings";

// DOM references
const form = document.getElementById("expenseForm");
const idField = document.getElementById("expenseId");
const titleField = document.getElementById("title");
const amountField = document.getElementById("amount");
const typeField = document.getElementById("type");
const categoryField = document.getElementById("category");
const dateField = document.getElementById("date");
const notesField = document.getElementById("notes");
const submitBtn = document.getElementById("submitBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const formTitle = document.getElementById("formTitle");

const tableBody = document.getElementById("expenseTableBody");
const emptyMessage = document.getElementById("emptyMessage");
const searchBox = document.getElementById("searchBox");
const filterType = document.getElementById("filterType");
const refreshBtn = document.getElementById("refreshBtn");

const totalIncomeEl = document.getElementById("totalIncome");
const totalExpenseEl = document.getElementById("totalExpense");
const balanceEl = document.getElementById("balance");

const incomeForm = document.getElementById("incomeForm");
const monthlyIncomeInput = document.getElementById("monthlyIncomeInput");
const incomeSavedMsg = document.getElementById("incomeSavedMsg");
const exportBtn = document.getElementById("exportBtn");

// Default the date field to today
dateField.value = new Date().toISOString().slice(0, 10);

// -------------------- API helpers --------------------

async function fetchExpenses() {
  const params = new URLSearchParams();
  if (searchBox.value.trim()) params.append("search", searchBox.value.trim());
  if (filterType.value) params.append("type", filterType.value);

  const res = await fetch(`${API_BASE}?${params.toString()}`);
  const json = await res.json();
  return json.data || [];
}

async function fetchSummary() {
  const res = await fetch(`${API_BASE}/summary`);
  const json = await res.json();
  return json.data;
}

async function createExpense(payload) {
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

async function updateExpense(id, payload) {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

async function deleteExpense(id) {
  const res = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
  return res.json();
}

async function fetchSettings() {
  const res = await fetch(SETTINGS_BASE);
  const json = await res.json();
  return json.data;
}

async function saveMonthlyIncome(monthlyIncome) {
  const res = await fetch(SETTINGS_BASE, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ monthlyIncome }),
  });
  return res.json();
}

// -------------------- Rendering --------------------

function formatCurrency(n) {
  return "₹" + Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2 });
}

function renderTable(rows) {
  tableBody.innerHTML = "";
  emptyMessage.classList.toggle("hidden", rows.length > 0);

  rows.forEach((row) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.date}</td>
      <td>${escapeHtml(row.title)}</td>
      <td>${escapeHtml(row.category)}</td>
      <td class="type-badge-cell"><span class="type-badge ${row.type}">${row.type}</span></td>
      <td>${formatCurrency(row.amount)}</td>
      <td>${escapeHtml(row.notes || "")}</td>
      <td class="row-actions">
        <button class="edit-btn" data-id="${row.id}">Edit</button>
        <button class="delete-btn" data-id="${row.id}">Delete</button>
      </td>
    `;
    tableBody.appendChild(tr);
  });

  // Wire up edit/delete buttons
  tableBody.querySelectorAll(".edit-btn").forEach((btn) =>
    btn.addEventListener("click", () => startEdit(btn.dataset.id, rows))
  );
  tableBody.querySelectorAll(".delete-btn").forEach((btn) =>
    btn.addEventListener("click", () => handleDelete(btn.dataset.id))
  );
}

function renderSummary(summary) {
  totalIncomeEl.textContent = formatCurrency(summary.totalIncome);
  totalExpenseEl.textContent = formatCurrency(summary.totalExpense);
  balanceEl.textContent = formatCurrency(summary.balance);
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// -------------------- Core refresh --------------------

async function refreshAll() {
  try {
    const [rows, summary] = await Promise.all([fetchExpenses(), fetchSummary()]);
    renderTable(rows);
    renderSummary(summary);
    // Keep the income input in sync unless the user is actively typing in it
    if (document.activeElement !== monthlyIncomeInput) {
      monthlyIncomeInput.value = summary.monthlyIncome || "";
    }
  } catch (err) {
    console.error(err);
    alert("Could not reach the backend. Make sure the server is running (npm start in the backend folder).");
  }
}

// -------------------- Monthly income --------------------

incomeForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const raw = monthlyIncomeInput.value.trim();

  if (raw === "") {
    alert("Please enter an amount before saving.");
    return;
  }

  const value = parseFloat(raw);
  if (isNaN(value) || value < 0) {
    alert("Please enter a valid, non-negative monthly income.");
    return;
  }

  try {
    const result = await saveMonthlyIncome(value);
    if (!result.success) {
      alert("Error saving income: " + (result.errors ? result.errors.join(", ") : result.error));
      return;
    }
    // Visible confirmation so it's obvious the save worked
    incomeSavedMsg.classList.remove("hidden");
    incomeSavedMsg.style.opacity = "1";
    setTimeout(() => {
      incomeSavedMsg.style.opacity = "0";
      setTimeout(() => incomeSavedMsg.classList.add("hidden"), 300);
    }, 1800);

    await refreshAll();
  } catch (err) {
    console.error(err);
    alert("Could not reach the backend. Make sure the server is running (npm start in the backend folder).");
  }
});

// -------------------- Export to Excel --------------------

exportBtn.addEventListener("click", async () => {
  try {
    const rows = await fetchExpenses(); // respects current search/type filters
    if (!rows.length) {
      alert("No transactions to export.");
      return;
    }

    const sheetData = rows.map((r) => ({
      Date: r.date,
      Title: r.title,
      Category: r.category,
      Type: r.type,
      "Amount (₹)": r.amount,
      Notes: r.notes || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(sheetData);
    worksheet["!cols"] = [
      { wch: 12 }, // Date
      { wch: 24 }, // Title
      { wch: 16 }, // Category
      { wch: 10 }, // Type
      { wch: 12 }, // Amount
      { wch: 30 }, // Notes
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Expenses");

    const filename = `expense-tracker-${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, filename);
  } catch (err) {
    console.error(err);
    alert("Could not export to Excel. See console for details.");
  }
});

// -------------------- Form handling --------------------

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const payload = {
    title: titleField.value.trim(),
    amount: parseFloat(amountField.value),
    type: typeField.value,
    category: categoryField.value.trim() || "General",
    date: dateField.value,
    notes: notesField.value.trim(),
  };

  const editingId = idField.value;

  const result = editingId
    ? await updateExpense(editingId, payload)
    : await createExpense(payload);

  if (!result.success) {
    alert("Error: " + (result.errors ? result.errors.join(", ") : result.error));
    return;
  }

  resetForm();
  refreshAll();
});

function startEdit(id, rows) {
  const row = rows.find((r) => String(r.id) === String(id));
  if (!row) return;

  idField.value = row.id;
  titleField.value = row.title;
  amountField.value = row.amount;
  typeField.value = row.type;
  categoryField.value = row.category;
  dateField.value = row.date;
  notesField.value = row.notes;

  formTitle.textContent = `Editing: ${row.title}`;
  submitBtn.textContent = "Update Entry";
  cancelEditBtn.classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function resetForm() {
  form.reset();
  idField.value = "";
  dateField.value = new Date().toISOString().slice(0, 10);
  formTitle.textContent = "Add New Entry";
  submitBtn.textContent = "Add Entry";
  cancelEditBtn.classList.add("hidden");
}

cancelEditBtn.addEventListener("click", resetForm);

async function handleDelete(id) {
  if (!confirm("Delete this transaction?")) return;
  const result = await deleteExpense(id);
  if (!result.success) {
    alert("Error deleting: " + result.error);
    return;
  }
  refreshAll();
}

// -------------------- Filters --------------------

searchBox.addEventListener("input", debounce(refreshAll, 300));
filterType.addEventListener("change", refreshAll);
refreshBtn.addEventListener("click", refreshAll);

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// Initial load
refreshAll();
