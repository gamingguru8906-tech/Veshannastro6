# Maaya AI — Operations & Leads Widget

An empathetic operations assistant for astrology services, order questions, and human follow-up requests. The backend keeps Gemini credentials private, persists complete conversation transcripts to PostgreSQL, and emits structured lead escalations for the admin dashboard.

## Files

| File | Purpose |
|------|---------|
| `index.html` | Widget markup + a demo host page |
| `style.css` | Widget UI, bright pulsing launcher, Maaya header |
| `script.js` | Frontend chat logic (Vanilla JS, no dependencies) |
| `server.js` | Express backend: injects Maaya's system prompt, calls Gemini |
| `package.json` | Backend dependencies and scripts |
| `render.yaml` | Render service and environment-variable blueprint |

## Run the demo

```bash
cd AIquery
npm install
GEMINI_API_KEY=replace-me DATABASE_URL=postgresql://... npm start
```

Open http://localhost:3000/index.html — Maaya floats bottom-right.

## Embed in your own website

Add these two lines before `</body>` on any page, and copy the widget markup (the block between `<!-- MAYA WIDGET START -->` and `<!-- MAYA WIDGET END -->` in `index.html`) into your page:

```html
<link rel="stylesheet" href="/path/to/style.css">
<script src="/path/to/script.js" data-maya-api="https://your-backend.com/api/chat" defer></script>
```

The `data-maya-api` attribute points the widget at your deployed backend. Because styles are scoped under `.maya-widget` and the container uses a high `z-index` fixed overlay, the widget sits on top of any page without interfering with existing layout.

## How it works

The browser never sees the API key. The widget posts its message, recent context, and opaque session ID to `/api/chat`. The backend loads the server-side transcript, forwards only the latest context to Gemini, removes the hidden escalation marker from the customer-facing answer, and stores the complete conversation in the shared PostgreSQL `sessions` table. The admin app reads that same table.

### Maaya's system prompt (enforced server-side)

- **Identity:** Maaya AI for authentic Vedic astrology, numerology, Kundli, reports, consultations, and gemstone orders.
- **Accuracy:** Never invents delivery, refund, payment, or order-status confirmations.
- **Escalation:** Collects name, WhatsApp/mobile, email, and a summary before creating a high-priority founder follow-up.
- **Privacy:** The structured `LEAD_ESCALATION` payload is removed before the browser receives the reply.

## Production notes

- Set `DATABASE_URL` to the same PostgreSQL database used by the admin dashboard.
- Keep `SHEET_WEBHOOK_URL` set to the existing Maaya lead-logging Apps Script URL if the Sheet backup is required.
- Restrict `ALLOWED_ORIGINS` to the production website origins.
- Keep the default rate limit or tune `RATE_MAX` deliberately.
- Never commit your `.env` file.
