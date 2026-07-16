# Deploying Maya Live — Step by Step

Maya has two parts:

1. **The widget** — already embedded (inlined) in your site pages. Nothing to host separately.
2. **The backend** (`server.js`) — a small Node service that holds your Gemini key and talks to the AI. **This must be deployed** so the widget has something to call. The key lives here and only here — never in the browser.

---

## ⭐ YOUR SETUP: site on Vercel + backend on Render (no code edits)

Your website is already on **Vercel**, so Vercel serves all the pages. You only need to
put the Maya backend on **Render**, and connect the two with the `vercel.json` file that is
already created for you. Nothing in the 10 pages changes.

How it connects: the widget calls `/api/chat` on your own Vercel address; `vercel.json`
quietly forwards that to your Render backend. The browser only ever sees your Vercel site,
so there's no CORS to configure and no URL to paste into any page.

### Part 1 — Put everything in one GitHub repo
Keep your website files and the `AI query` folder in the **same** GitHub repo. Layout looks like:

```
your-repo/
├─ vercel.json            ← already created (in your "veshannastro files" folder)
├─ index.html, numerology-booking.html, ... (your site pages)
└─ AI query/              ← the Maya backend (server.js, package.json, render.yaml, ...)
```

Push it to GitHub. (The `.gitignore` already stops your secret `.env` from being uploaded.)

### Part 2 — Deploy the backend on Render
1. Get a **Gemini API key**: https://aistudio.google.com/apikey → **Create API key** → copy it.
2. Go to https://render.com → **New +** → **Web Service** → connect your GitHub repo.
3. Set these fields:
   - **Name:** `veshannastro-maya`  ← must be exactly this (it makes the URL `https://veshannastro-maya.onrender.com`, which `vercel.json` points to).
   - **Root Directory:** `AI query`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance type:** Free.
4. Open the **Environment** tab and add one variable:
   - `GEMINI_API_KEY` = your Gemini key.
   - *(Do NOT set `STATIC_DIR` here — Vercel serves your pages, not Render.)*
5. Click **Create Web Service**. Wait for the log to say *"Maya backend running…"*.
6. Test the backend directly: open `https://veshannastro-maya.onrender.com/health` — it should
   say `{"status":"ok","keyConfigured":true}`.

### Part 3 — Redeploy the Vercel site
Because you added `vercel.json`, trigger a fresh Vercel deploy (push to GitHub, or in Vercel
click **Redeploy**). That's it — open any page (e.g. `/numerology-booking.html`) and chat with Maya. ✅

> If Render couldn't use the name `veshannastro-maya` (it was taken) and gave you a different
> URL, open `vercel.json`, replace the URL on the `destination` line with your real Render URL,
> and redeploy Vercel. That's the only line that could ever need changing.

---

## Reference: two other hosting shapes

- **Option A — one service serves everything.** The Node backend serves your website *and* the `/api/chat` API from the same web address (set `STATIC_DIR`). Use this only if you are NOT using Vercel.
- **Option B — backend separate, set the URL per page.** Same idea as your setup but without the Vercel proxy: you'd add `window.MAYA_API_URL` to the pages and set `ALLOWED_ORIGINS`.

---

## Before you start (5 minutes)

1. **Get a Gemini API key** — sign in at https://aistudio.google.com/apikey and click **Create API key**. Copy it. Keep it private; treat it like a password. (The free tier is enough to start; enable billing later if you need higher limits.)
2. **Create a free Render account** — https://render.com (sign in with GitHub is easiest).
3. **Put this project in a Git repo** on GitHub. The folder you need in the repo is `AI query` (contains `server.js`, `package.json`, etc.). If your whole `veshannastro` folder is already a repo, that's fine — note the path to the `AI query` folder.

> Security check: confirm your repo does **not** contain a `.env` file. The included `.gitignore` prevents committing it. Your key should only ever be typed into Render's dashboard, never into a file you push.

---

## Option A — One service serves site + API (recommended)

This makes the same web service return your HTML pages *and* answer `/api/chat`, so the widget works with no extra configuration.

1. **Point the backend at your site folder.** The backend can serve any folder via the `STATIC_DIR` setting. Your site pages are in the `veshannastro files` folder, so you'll set `STATIC_DIR` to that path (step 4 below). *(If you prefer, copy the site files into the `AI query` folder and skip this.)*
2. In Render, click **New +** → **Web Service** → connect your GitHub repo.
3. Configure:
   - **Root Directory:** `AI query`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance type:** Free is fine to start.
4. Open the **Environment** tab and add these variables:
   - `GEMINI_API_KEY` = your Gemini API key
   - `GEMINI_MODEL` = `gemini-2.5-flash` (optional)
   - `STATIC_DIR` = `../veshannastro files`  *(path from the `AI query` folder to your site folder in the repo)*
   - `RATE_MAX` = `20` (optional)
   - *(You can leave `ALLOWED_ORIGINS` empty here — same-origin needs no CORS.)*
5. Click **Create Web Service**. Render builds and deploys; watch the log until it says *"Maya backend running…"*.
6. Open the service URL (e.g. `https://maya-ai-query.onrender.com`). Visit a page like `/numerology-booking.html` — Maya appears bottom-left and answers. Done. ✅

> Health check: visiting `https://your-service.onrender.com/health` should return `{"status":"ok","keyConfigured":true}`. If `keyConfigured` is `false`, your key env var isn't set.

---

## Option B — Backend separate from your existing site

Use this if your website is already live somewhere and you only want to add the backend.

1. **Deploy just the backend** using the Render Blueprint:
   - In Render click **New +** → **Blueprint**, select your repo. It reads the included `render.yaml`.
   - In the new service's **Environment** tab, set `GEMINI_API_KEY` to your Gemini API key.
   - Set `ALLOWED_ORIGINS` to your website's address(es), comma-separated, e.g. `https://veshannastro.com,https://www.veshannastro.com`. This is what stops other sites from using your key.
   - Deploy. Note the backend URL, e.g. `https://maya-ai-query.onrender.com`.
2. **Point the widget at that backend.** In each of the 10 site pages, add this one line *above* the Maya `<script>` block (or once in a shared header/template):

   ```html
   <script>window.MAYA_API_URL = "https://maya-ai-query.onrender.com/api/chat";</script>
   ```

   *(Tip: a find-and-replace across the pages, or ask me to insert it for you.)*
3. **Redeploy / re-upload your site.** Load a page — Maya answers from the separate backend. ✅

---

## The 10 pages Maya is on

Consultations: `numerology-booking.html`, `vedic-kundli-booking.html`, `booking.html`, `report-booking.html`
Bracelet: `bracelet-fusion.html`, `shop-product.html`
Checkout: `checkout.html`, `numerology-checkout.html`, `union-checkout.html`, `vedic-checkout.html`

---

## Running it locally first (optional test)

```bash
cd "AI query"
npm install
cp .env.example .env      # then edit .env, paste your GEMINI_API_KEY
npm start
```

Open http://localhost:3000/index.html and chat with Maya.

---

## Security checklist

- [x] Gemini key is only in the backend environment (Render dashboard / local `.env`), never in HTML/JS.
- [x] `.gitignore` keeps `.env` out of your repo.
- [x] `ALLOWED_ORIGINS` restricts who can call the API (set it in Option B; not needed for same-origin Option A).
- [x] Rate limiting (`RATE_MAX`, default 20/min per visitor) is on by default.
- [x] Maya's system prompt refuses to reveal keys, secrets, or its own instructions.

## Common issues

| Symptom | Fix |
|---|---|
| Widget shows "unable to reach the service" | Backend not deployed, wrong `MAYA_API_URL`, or key missing. Check `/health`. |
| Answers blocked in browser console (CORS error) | Add your site's exact origin to `ALLOWED_ORIGINS` and redeploy. |
| `keyConfigured: false` at `/health` | `GEMINI_API_KEY` isn't set in the environment. |
| 429 "Too many requests" | Rate limit hit; raise `RATE_MAX` if needed. |
| Free Render service slow on first hit | Free instances sleep when idle; first request wakes it (a few seconds). |
