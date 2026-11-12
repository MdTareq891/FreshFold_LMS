# FreshFold LMS — Deployment Guide (100% Free, No Card Required)

This guide walks through hosting the whole app for free using services that
don't require a credit card: **MongoDB Atlas** (database), **Cloudinary**
(photo storage), **Gmail** (email notifications), **Web Push/VAPID** (browser
push notifications), **Render** (backend hosting), and **Vercel or Netlify**
(frontend hosting).

Do these in order — each step produces a value you'll paste into an `.env` file.

---

## 1. MongoDB Atlas (free database, no card)

1. Go to https://www.mongodb.com/cloud/atlas/register and sign up (free, no card).
2. Create a **free M0 cluster** (512MB storage, forever free).
3. Under **Database Access**, create a database user (username + password) — save these.
4. Under **Network Access**, add IP address `0.0.0.0/0` (allow access from anywhere —
   needed since Render's IP isn't fixed on the free tier).
5. Click **Connect** → **Drivers** → copy the connection string. It looks like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Replace `<username>`/`<password>` with your real values, and add a database name
   before the `?`, e.g. `.../freshfold?retryWrites=true...`
7. Save this as `MONGODB_URI` — you'll need it in step 6.

---

## 2. Cloudinary (free photo storage, no card)

1. Go to https://cloudinary.com/users/register/free and sign up (free tier: 25GB, no card).
2. On your Cloudinary dashboard, copy your **Cloud Name** (shown at the top).
3. Go to **Settings → Upload → Upload presets → Add upload preset**.
4. Set **Signing Mode** to **Unsigned** (this lets the browser upload directly
   without exposing your API secret). Give it a name, e.g. `freshfold_unsigned`. Save.
5. You now have two values:
   - `VITE_CLOUDINARY_CLOUD_NAME` = your cloud name
   - `VITE_CLOUDINARY_UPLOAD_PRESET` = the preset name you just created

---

## 3. Gmail App Password (free email sending)

1. You need a Gmail account with **2-Step Verification** turned on
   (Google Account → Security → 2-Step Verification).
2. Go to https://myaccount.google.com/apppasswords
3. Create an app password (choose "Mail" as the app). Google gives you a
   16-character password like `abcd efgh ijkl mnop`.
4. Save:
   - `GMAIL_USER` = your Gmail address
   - `GMAIL_APP_PASSWORD` = the 16-character password (remove spaces)

This is completely free and has a generous sending limit (~500 emails/day),
more than enough for order notifications.

---

## 4. Web Push / VAPID keys (free, no third-party account)

This uses the browser's built-in Push API — no external service needed at all.

1. In the `backend` folder, run:
   ```bash
   npm install
   npm run gen:vapid
   ```
2. It prints two keys. Save both:
   - `VAPID_PUBLIC_KEY`
   - `VAPID_PRIVATE_KEY`
3. The public key also needs to go on the **frontend** as `VITE_VAPID_PUBLIC_KEY`
   (the app actually fetches it live from the backend, but keeping a copy in
   your notes is useful).

---

## 5. Generate a JWT secret

Any long random string works. Generate one with:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```
Save this as `JWT_SECRET`.

---

## 6. Deploy the backend on Render (free, no card)

1. Push the `backend/` folder to a GitHub repository.
2. Go to https://render.com and sign up (free, no card required for the free
   web service tier).
3. **New → Web Service** → connect your GitHub repo → select the repo.
4. Settings:
   - **Root Directory:** `backend` (if backend and frontend are in the same repo)
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free
5. Under **Environment**, add every variable from `backend/.env.example` with
   your real values from steps 1–5 above. Also set:
   - `CORS_ORIGIN` = your frontend URL (you'll get this in step 7 — you can
     come back and update it after deploying the frontend)
6. Deploy. Once live, copy your backend URL, e.g. `https://freshfold-api.onrender.com`.
7. **Run the admin seed once** — Render's free tier doesn't give you a persistent
   shell easily, so the simplest approach is: temporarily change the Start
   Command to `node seed-admin.js && node server.js` for the **first deploy only**,
   then change it back to just `node server.js` and redeploy. (Alternatively,
   use Render's "Shell" tab if available on your plan to run `npm run seed:admin` directly.)

> **Free tier note:** Render's free web services "spin down" after ~15 minutes
> of no traffic and take ~30–60 seconds to wake back up on the next request.
> This is normal and fine for a project/demo; if you need always-on hosting
> you'd need a paid tier on any provider.

---

## 7. Deploy the frontend on Vercel or Netlify (free, no card)

### Option A — Vercel
1. Push the `frontend/` folder to GitHub (same repo or separate).
2. Go to https://vercel.com, sign up free, **Add New Project**, import the repo.
3. **Root Directory:** `frontend`
4. **Build Command:** `npm run build`  **Output Directory:** `dist`
5. Add environment variables (Project Settings → Environment Variables):
   ```
   VITE_API_URL=https://freshfold-api.onrender.com/api
   VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
   VITE_CLOUDINARY_UPLOAD_PRESET=freshfold_unsigned
   ```
6. Deploy. Copy your frontend URL, e.g. `https://freshfold-lms.vercel.app`.

### Option B — Netlify
Same idea: **Add new site → Import from Git**, root directory `frontend`,
build command `npm run build`, publish directory `dist`, same environment
variables as above.

---

## 8. Final step — connect the two

Go back to Render (backend) → Environment → update `CORS_ORIGIN` to your
actual frontend URL from step 7 (e.g. `https://freshfold-lms.vercel.app`).
Redeploy the backend so it accepts requests from your live frontend.

---

## 9. Run the admin seed for real data

However you run it (Render Shell, or the temporary start-command trick above),
running:
```bash
npm run seed:admin
```
wipes any existing data and creates exactly **one** admin account using
`ADMIN_EMAIL` / `ADMIN_PASSWORD` from your environment variables. There is
no public way to create an admin account — this is intentional.

Log in as admin, then add your real services, inventory, and staff accounts
from the dashboard. No demo data is ever created.

---

## Summary of every environment variable

**Backend (Render):**
| Variable | From step |
|---|---|
| `MONGODB_URI` | 1 |
| `JWT_SECRET` | 5 |
| `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | you choose |
| `CORS_ORIGIN` | 7 (your frontend URL) |
| `GMAIL_USER`, `GMAIL_APP_PASSWORD` | 3 |
| `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_CONTACT_EMAIL` | 4 |
| `PORT` | Render sets this automatically, leave as-is |

**Frontend (Vercel/Netlify):**
| Variable | From step |
|---|---|
| `VITE_API_URL` | 6 (your backend URL + `/api`) |
| `VITE_CLOUDINARY_CLOUD_NAME` | 2 |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | 2 |

---

## Cost recap — why this is genuinely free

| Service | Free tier limit | Card required? |
|---|---|---|
| MongoDB Atlas M0 | 512MB storage, forever | No |
| Cloudinary | 25GB storage/bandwidth per month | No |
| Gmail SMTP | ~500 emails/day | No (just your existing Gmail) |
| Web Push (VAPID) | Unlimited, browser-native | No (no account at all) |
| Render (backend) | 750 hrs/month free web service | No |
| Vercel / Netlify | Generous free hobby tier | No |

None of these require adding a payment method for the tiers used here.
