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

Base URL: `http://localhost:5000/api/expenses`

| Method | Endpoint                | Description                              |
|--------|--------------------------|-------------------------------------------|
| GET    | `/`                      | List all expenses (filters below)        |
| GET    | `/summary`               | Totals: income, expense, balance, by category |
| GET    | `/:id`                   | Get a single expense                     |
| POST   | `/`                      | Create a new expense                     |
| PUT    | `/:id`                   | Update an expense (partial updates OK)   |
| DELETE | `/:id`                   | Delete an expense                        |

**Query filters on `GET /`:** `category`, `type` (`income`/`expense`), `from`, `to` (dates), `search`

**Example POST body:**
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

`title`, `amount`, and `date` are required. `type` defaults to `"expense"`,
`category` defaults to `"General"`.

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
