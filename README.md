# Expense Tracker — Full Stack (Backend + Frontend, One Server)

A fully working Expense Tracker with a REST API backend (Node.js + Express)
that also serves the frontend directly. **One server, one port, one URL** —
no CORS issues, no juggling two terminals.

```
expense-tracker/
├── backend/
│   ├── server.js         # Express app — serves API + frontend static files
│   ├── store.js          # JSON-file data store (auto-creates expenses.json)
│   ├── routes/
│   │   ├── expenses.js   # CRUD + summary API routes
│   │   └── settings.js   # Monthly income setting
│   └── package.json
└── frontend/
    ├── index.html
    ├── style.css
    └── app.js             # calls the backend API with relative fetch() paths
```

## 1. Prerequisites

- [Node.js](https://nodejs.org) v18+ installed (includes npm)
- [VS Code](https://code.visualstudio.com)

## 2. Run Everything (one command, one server, one URL)

The backend now serves the frontend too — so there's only **one thing to
start** and **one address to open**. No more juggling two terminals or
mismatched ports.

Open a terminal in VS Code (`` Ctrl+` `` / `` Cmd+` ``):

```bash
cd expense-tracker/backend
npm install
npm start
```

You should see:

```
🚀 Expense Tracker running at http://localhost:5000
   (frontend + API both served from this one address)
```

Now open **http://localhost:5000** in your browser. That's the whole app —
dashboard, forms, everything — served directly by your backend. No Live
Server, no second terminal, no separate frontend port.

A `expenses.json` file is auto-created in `backend/` the first time you run
it, pre-seeded with one sample income and one sample expense entry — this is
your database.

### Verify it's working

Visit **http://localhost:5000/api/health** — you should see:
```json
{"success":true,"message":"Expense Tracker API is running"}
```

If that loads but the main page at `http://localhost:5000` doesn't, double
check the `frontend/` folder sits next to `backend/` (not inside it) — the
server expects: `expense-tracker/backend` and `expense-tracker/frontend` as
sibling folders.

## 3. Features

### Set Monthly Income
In the header, use the **Monthly Income** field to set your recurring
income. This amount is **automatically added into the "Total Income" card**
and your overall balance — it doesn't need a separate transaction entry.

If you also log individual income transactions (e.g. a one-off freelance
payment) via the "Add New Entry" form, those add on top of your monthly
income: `Total Income = Monthly Income + all logged income transactions`.

### Export to Excel
Click **Export to Excel** above the transaction table to download all your
visible transactions (respects any active search/type filter) as a real
`.xlsx` file — Date, Title, Category, Type, Amount, Notes columns. This runs
entirely in the browser using [SheetJS](https://sheetjs.com), no backend
involved, so it works even offline once the page is loaded.

### Design
The dashboard uses a clean fintech-style layout: Sora for headings, Inter
for body/data text, and a teal/emerald/red color system to distinguish
brand actions, income, and expenses at a glance.

## 4. API Reference

### Overview

- **Base URL (local):** `http://localhost:5000`
- **Base URL (deployed example):** `https://expo-1tg4.onrender.com`
- **Format:** JSON over HTTP
- **Authentication:** none — this API is unauthenticated by design (single-user, local/demo use)
- **Content-Type:** requests with a body must send `Content-Type: application/json`

### Response envelope

Every response follows the same shape, so client code only needs one pattern to handle all endpoints:

**Success:**
```json
{
  "success": true,
  "data": { ... } | [ ... ]
}
```

**Failure (validation error — HTTP 400):**
```json
{
  "success": false,
  "errors": ["title is required and must be a non-empty string"]
}
```

**Failure (not found / server error):**
```json
{
  "success": false,
  "error": "Expense not found"
}
```

Always check `success` first before reading `data`.

### Data model — Expense

| Field        | Type    | Required | Notes                                                  |
|--------------|---------|----------|---------------------------------------------------------|
| `id`         | integer | auto     | assigned by the server, read-only                      |
| `title`      | string  | ✅ yes   | non-empty                                                |
| `amount`     | number  | ✅ yes   | must be greater than 0                                  |
| `type`       | string  | no       | `"income"` or `"expense"` — defaults to `"expense"`     |
| `category`   | string  | no       | free text — defaults to `"General"`                     |
| `date`       | string  | ✅ yes   | format `YYYY-MM-DD`                                      |
| `notes`      | string  | no       | free text — defaults to `""`                             |
| `created_at` | string  | auto     | ISO timestamp, set by the server, read-only             |

---

### `GET /api/health`

Simple check that the server is up.

**Request:** no parameters

**Response `200`:**
```json
{ "success": true, "message": "Expense Tracker API is running" }
```

---

### `GET /api/expenses`

List all expenses. Supports optional filtering via query string — all filters are combinable (AND logic).

**Query parameters** (all optional):

| Param      | Example                | Description                                      |
|------------|--------------------------|---------------------------------------------------|
| `category` | `?category=Food`         | exact match on category                           |
| `type`     | `?type=income`            | `"income"` or `"expense"`                          |
| `from`     | `?from=2026-07-01`        | only entries on/after this date                    |
| `to`       | `?to=2026-07-31`          | only entries on/before this date                   |
| `search`   | `?search=grocer`          | case-insensitive match against title or notes       |

**Example request:**
```bash
curl "http://localhost:5000/api/expenses?type=expense&category=Food"
```

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Groceries",
      "amount": 1200,
      "type": "expense",
      "category": "Food",
      "date": "2026-07-03",
      "notes": "Initial seed data",
      "created_at": "2026-07-03T09:35:00.000Z"
    }
  ]
}
```

---

### `GET /api/expenses/summary`

Returns aggregate totals for the dashboard.

**Request:** no parameters

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "totalIncome": 50000,
    "transactionIncome": 0,
    "totalExpense": 1200,
    "balance": 48800,
    "monthlyIncome": 50000,
    "byCategory": [
      { "category": "Food", "total": 1200 }
    ]
  }
}
```

**Field notes:**
- `monthlyIncome` = the value you set via `PUT /api/settings` (see below)
- `transactionIncome` = sum of every logged transaction with `type: "income"`
- `totalIncome` = `monthlyIncome + transactionIncome` — the number shown as "Total Income" on the dashboard
- `totalExpense` = sum of every transaction with `type: "expense"`
- `balance` = `totalIncome - totalExpense`
- `byCategory` = expense totals grouped by category, sorted highest first

---

### `GET /api/expenses/:id`

Fetch a single expense by ID.

**Example request:**
```bash
curl http://localhost:5000/api/expenses/1
```

**Response `200`:** same shape as one item in the list above
**Response `404`:**
```json
{ "success": false, "error": "Expense not found" }
```

---

### `POST /api/expenses`

Create a new expense or income entry.

**Request body:**
```json
{
  "title": "Groceries",
  "amount": 1200,
  "type": "expense",
  "category": "Food",
  "date": "2026-07-03",
  "notes": "Weekly shopping"
}
```
Only `title`, `amount`, and `date` are required — `type` defaults to `"expense"`, `category` defaults to `"General"`, `notes` defaults to `""`.

**Example request:**
```bash
curl -X POST http://localhost:5000/api/expenses \
  -H "Content-Type: application/json" \
  -d '{"title":"Groceries","amount":1200,"category":"Food","date":"2026-07-03"}'
```

**Response `201`:** the created object, including its new `id` and `created_at`
**Response `400`:**
```json
{ "success": false, "errors": ["amount is required and must be a positive number"] }
```

---

### `PUT /api/expenses/:id`

Update an existing expense. Partial updates are allowed — only send the fields you want to change.

**Example request:**
```bash
curl -X PUT http://localhost:5000/api/expenses/1 \
  -H "Content-Type: application/json" \
  -d '{"amount": 1500}'
```

**Response `200`:** the full updated object
**Response `404`:** if the ID doesn't exist
**Response `400`:** if a provided field fails validation

---

### `DELETE /api/expenses/:id`

Delete an expense permanently.

**Example request:**
```bash
curl -X DELETE http://localhost:5000/api/expenses/1
```

**Response `200`:**
```json
{ "success": true, "message": "Expense 1 deleted" }
```
**Response `404`:** if the ID doesn't exist

---

### `GET /api/settings`

Get current settings (currently just monthly income).

**Response `200`:**
```json
{ "success": true, "data": { "monthlyIncome": 50000 } }
```

---

### `PUT /api/settings`

Set your monthly income. This value is automatically folded into `totalIncome` on the summary endpoint — no separate transaction needed.

**Request body:**
```json
{ "monthlyIncome": 50000 }
```

**Example request:**
```bash
curl -X PUT http://localhost:5000/api/settings \
  -H "Content-Type: application/json" \
  -d '{"monthlyIncome": 50000}'
```

**Response `200`:**
```json
{ "success": true, "data": { "monthlyIncome": 50000 } }
```
**Response `400`:**
```json
{ "success": false, "errors": ["monthlyIncome is required and must be a non-negative number"] }
```

### HTTP status code summary

| Code | Meaning                                   |
|------|--------------------------------------------|
| 200  | Success (read, update, delete)             |
| 201  | Created (successful POST)                  |
| 400  | Validation error — check `errors` array     |
| 404  | Resource not found                          |
| 500  | Unexpected server error — check `error`     |

## 5. Troubleshooting

- **"Could not reach the backend" alert** → the `npm start` terminal isn't
  running, or crashed. Check it for red error text. Also confirm the
  `frontend/` folder is a sibling of `backend/` (same parent folder), since
  the server serves it via a relative path.
- **Blank page at localhost:5000** → make sure `frontend/index.html` exists
  and the terminal shows the 🚀 startup message with no errors above it.
- **CORS errors** → shouldn't happen anymore since frontend and backend now
  share the same origin (`http://localhost:5000`) — but `cors()` is still
  enabled as a safety net.
- **Change the port** → set an environment variable before starting:
  `PORT=6000 npm start`, then open `http://localhost:6000` instead. No need
  to edit `app.js` — it uses relative paths (`/api/...`) so it follows
  whatever port/host you're on automatically.

## 6. Where to Deploy

Since the backend now serves the frontend too, this is a single Node.js web
app — deploy it as **one service**, not two. These platforms all support
that directly, with free tiers:

| Platform | Notes |
|----------|-------|
| **[Render](https://render.com)** | Easiest for beginners. New → Web Service → connect GitHub repo → Root Directory `backend` → Build `npm install` → Start `npm start`. Free tier sleeps after inactivity. |
| **[Railway](https://railway.app)** | Similar workflow to Render, generous free trial credit, very fast deploys. |
| **[Fly.io](https://fly.io)** | More control (Docker-based), good free allowance, slightly more setup via `fly launch`. |
| **[Cyclic](https://www.cyclic.sh)** | Built specifically for simple Node/Express apps, minimal config. |
| **[Glitch](https://glitch.com)** | Good for quick demos/assignments, edits and runs directly in the browser. |
| **[DigitalOcean App Platform](https://www.digitalocean.com/products/app-platform)** | Paid, but reliable and simple if you outgrow free tiers. |

**Important — data persistence:** this app stores data in a local
`expenses.json` file. Most free hosting tiers (Render, Railway, Fly.io) wipe
the filesystem on redeploy or restart, so your data won't survive long-term
on the free plan. That's fine for a demo or assignment submission. If you
need real persistence later, swap in a hosted database (e.g. Render's free
PostgreSQL, or MongoDB Atlas's free tier) in place of `store.js`.

**Recommended for a quick assignment submission:** Render's free Web Service
— push to GitHub, connect the repo, set Root Directory to `backend`, deploy,
and you'll have a public `https://your-app.onrender.com` link to share.

## 7. Notes on the "AI Triad" Prompt Pipeline

This project maps to the 5-stage pipeline from your mini-project brief:

1. **Role & Context** → this backend defines the domain model (title, amount, type, category, date, notes)
2. **Few-Shot** → seeded sample records establish the expected input/output shape
3. **Structured Outputs** → every API response follows `{ success, data | error }` JSON
4. **Chain-of-Thought** → validation logic in `expenses.js` step-by-step checks each field
5. **Multi-Step Chaining** → frontend (`app.js`) chains fetch → render table → render summary into one pipeline
