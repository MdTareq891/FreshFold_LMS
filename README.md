# FreshFold — Laundry Management System (v2)

A full-stack Laundry Management System with real-time order tracking, email +
browser push notifications, bilingual UI (English/Bangla), dark/light mode,
and photo-attached order notes — built entirely on free-tier services.

## What's new in this version

- **MongoDB** persistence (replaces the old JSON-file storage) — survives real hosting/redeploys
- **Real-time updates** via Socket.io — order status changes appear instantly, no refresh
- **Email notifications** (Nodemailer + free Gmail SMTP) on order placed / status changed / paid
- **Browser push notifications** (Web Push + VAPID, no third-party account) — works even with the tab closed
- **Order notes with photos** — customers can attach a note ("this part needs deep wash") plus a
  camera photo or gallery image, uploaded to Cloudinary (free tier)
- **Bilingual UI** — full English/Bangla translation, switchable anywhere in the app, persisted per account
- **Dark / light mode** — toggle, persisted, respects system preference by default
- **Modern, responsive, animated UI** — Tailwind + Framer Motion, works on mobile/tablet/desktop
- **Order status history** — every order shows a full timeline of status changes, visible to
  customer, staff, and admin
- **Fixed admin account, zero demo data** — `npm run seed:admin` creates exactly one admin
  login from your `.env` values; there's no public way to create an admin

## Project Structure

```
freshfold/
├── backend/
│   ├── models/          Mongoose schemas: User, Order, Service, Inventory, Notification
│   ├── routes/           REST API endpoints
│   ├── services/         email.js, push.js, notify.js (the notification pipeline)
│   ├── scripts/           generate-vapid.js
│   ├── db.js, auth.js, server.js, seed-admin.js
│   └── .env.example
├── frontend/
│   └── src/
│       ├── locales/       en.json, bn.json (complete translations)
│       ├── context/        Auth, Theme (dark mode), Socket.io
│       ├── hooks/           usePushNotifications.js
│       ├── api/              client.js (axios), cloudinary.js (photo upload)
│       ├── components/    Navbar, PublicTopBar, StatusBadge, ProtectedRoute
│       └── pages/            Login, Register, Customer/Staff/Admin dashboards, Receipt
└── DEPLOYMENT.md        Full free hosting walkthrough (MongoDB Atlas, Cloudinary, Gmail, Render, Vercel)
```

## Local Development

### 1. Backend
```bash
cd backend
npm install
cp .env.example .env
# edit .env — at minimum set MONGODB_URI (see DEPLOYMENT.md step 1 for a free one)
npm run gen:vapid      # prints VAPID keys — paste them into .env
npm run seed:admin     # creates your one fixed admin account, wipes any old data
npm start              # runs on http://localhost:4000
```

### 2. Frontend
```bash
cd frontend
npm install
# .env is already set up for local dev (points at localhost:4000)
# optionally add Cloudinary values if you want photo uploads to work locally
npm run dev             # runs on http://localhost:5173
```

Open **http://localhost:5173**. Log in with the admin email/password you set
in `backend/.env`, then add your real services, inventory, and staff accounts
from the Admin dashboard. Customers register themselves from the Login page.

## Going live (free hosting)

See **DEPLOYMENT.md** for the full step-by-step: MongoDB Atlas, Cloudinary,
Gmail App Password, VAPID keys, Render (backend), and Vercel/Netlify (frontend)
— all free tiers, no credit card required anywhere.

## Notification channels — what actually happens

When an order is placed, its status changes, or it's marked paid, the backend
fires all three channels at once for the customer:
1. **In-app notification** (bell icon, updates live via Socket.io)
2. **Email** (if `GMAIL_USER`/`GMAIL_APP_PASSWORD` are set)
3. **Browser push** (if the customer granted notification permission and has
   an active subscription — they're prompted to enable this from their dashboard)

Any channel that isn't configured is silently skipped — nothing breaks if you
haven't set up Gmail or VAPID yet, it just won't send that particular channel.

## Known limitations of this build

- I could not test a live MongoDB connection in the sandbox this was built in
  (no internet access to Atlas from that environment) — the code follows
  standard, well-established Mongoose patterns and boots correctly, but the
  actual database round-trip should be verified once you plug in your real
  `MONGODB_URI`.
- Render's free tier spins down after inactivity (~30-60s cold start on the
  next request) — normal for free hosting, not a bug.
- True SMS-to-phone-number notifications are not included because no SMS
  gateway is genuinely free at any real volume — email + browser push were
  used instead, per your confirmation.
