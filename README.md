# LeadDesk Mini

A small lead-capture product built for the Digital Heroes Full Stack Development
qualification task: a public landing page with a validated lead form, and a
password-protected admin dashboard to review, search, and progress those leads.

Live URLs: `<add your deployed landing page URL here>` / `<add your deployed
admin URL here — it's the same app, /admin route>`
Test credentials: `<add the email/password you seeded, see below>`

---

## Stack

- **Frontend:** React (Vite) + React Router, plain CSS (no framework) — `/frontend`
- **Backend:** Node.js + Express + MongoDB (Mongoose) — `/backend`
- **Auth:** JWT, admin password hashed with bcrypt — no hardcoded credentials anywhere in code

---

## Data model

**Lead** (`backend/models/Lead.js`)

| Field | Type | Notes |
|---|---|---|
| `name` | String | required, 2–100 chars |
| `email` | String | required, validated format, lowercased |
| `budgetRange` | String enum | `under_1k`, `1k_5k`, `5k_15k`, `15k_plus` |
| `message` | String | required, 10–2000 chars |
| `status` | String enum | `New` (default), `Contacted`, `Closed` |
| `createdAt` / `updatedAt` | Date | via Mongoose timestamps |

`budgetRange` and `status` are enums rather than free-text so the admin filter
and the public form can never drift out of sync with what the database
accepts — an invalid value is rejected at the schema level, not just in the UI.

**Admin** (`backend/models/Admin.js`)

| Field | Type | Notes |
|---|---|---|
| `email` | String | unique |
| `passwordHash` | String | bcrypt hash, never the plaintext password |

There's deliberately no public "create admin" endpoint. The one admin account
is created by a one-time seed script (`backend/scripts/seedAdmin.js`) that
reads credentials from environment variables — this is the difference between
"real login" and a hardcoded string: the password never appears in source
control, and it's hashed the moment it's created.

---

## Auth approach

1. `POST /api/auth/login` checks the submitted password against the stored
   bcrypt hash with `admin.comparePassword()`. It returns the same "Invalid
   email or password" error whether the email doesn't exist or the password is
   wrong, so the endpoint never reveals which one failed.
2. On success it signs a short-lived JWT (`JWT_EXPIRES_IN`, default 8h)
   containing the admin's id and email.
3. The frontend stores that token in `sessionStorage` (cleared when the tab
   closes — deliberately not `localStorage`, since this is an admin session,
   not a "remember me" consumer login) and sends it as
   `Authorization: Bearer <token>` on every admin request.
4. `backend/middleware/auth.js` verifies the token on every `/api/leads` read
   or status-update request before the route handler runs. An expired,
   missing, or tampered token gets a `401` and the frontend redirects to
   `/admin/login`.
5. The login endpoint is rate-limited (10 attempts / 15 min per IP) to slow
   down brute-forcing the one admin account.

---

## Local setup

```bash
# Backend
cd backend
cp .env.example .env        # fill in MONGO_URI and JWT_SECRET
npm install
npm run seed:admin           # creates the admin user from SEED_ADMIN_* in .env
npm run dev                  # http://localhost:5000

# Frontend (separate terminal)
cd frontend
cp .env.example .env         # VITE_API_URL=http://localhost:5000
npm install
npm run dev                  # http://localhost:5173
```

Visit `http://localhost:5173` for the public form and
`http://localhost:5173/admin/login` for the dashboard.

---

## Deployment (free tier)

1. **Database:** create a free MongoDB Atlas cluster, add a database user, and
   allow access from anywhere (0.0.0.0/0) for simplicity in this exercise.
   Copy the connection string into `MONGO_URI`.
2. **Backend:** deploy `/backend` to Render (or Railway) as a Web Service.
   Set `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, and `CORS_ORIGIN` (your
   frontend's deployed URL) as environment variables there. After the first
   deploy, run `npm run seed:admin` once (Render's shell, or run it locally
   pointed at the Atlas URI) to create the admin login.
3. **Frontend:** deploy `/frontend` to Vercel or Netlify. Set `VITE_API_URL`
   to your Render backend's URL as a build-time environment variable.
4. Open the deployed frontend URL in a **fresh/incognito browser** and confirm
   both the public form and admin login work with no local state carried over
   from your dev machine — this is the reliability check the brief asks for.

---

## Design decisions worth calling out

- **Enums over free text** for `budgetRange` and `status` — keeps the admin
  filter dropdown and the database in permanent agreement, and makes an
  invalid status update a `400`, not silent data corruption.
- **Optimistic UI on status toggle** (`AdminDashboard.jsx`) — the pill updates
  instantly on click and only rolls back if the server rejects it, so the
  common case (it succeeds) feels instant instead of waiting on a round trip.
- **Rate limiting on both public write paths** (`/api/leads` POST and
  `/api/auth/login`) — the lead form is the one endpoint anyone on the
  internet can hit, and the login endpoint is the one worth guarding against
  brute force; everything else sits behind JWT auth already.

## What I'd change with another day

- Add email notifications (e.g. via Resend or SES) when a new lead comes in,
  instead of requiring the admin to keep the dashboard open.
- Add pagination to `/api/leads` — it currently caps at 500 rows, which is
  fine for a demo but not for real volume.
- Add a password-reset flow for the admin account instead of relying on
  re-running the seed script.

---

## AI usage note

"I used Claude to scaffold the LeadDesk Mini project — the Express backend (Lead/Admin models, JWT auth, validation), the React frontend, and the initial styling. After getting it running, I changed the background color to match my own preference for the landing page. I also ran into an issue where the backend wouldn't connect to MongoDB — after checking the code, I realized the .env file was missing (it's git-ignored by design, so it doesn't come with the project). I created the .env file myself, added my MongoDB Atlas connection string to MONGO_URI, and after that the server connected successfully and logged 'Connected to MongoDB'."
