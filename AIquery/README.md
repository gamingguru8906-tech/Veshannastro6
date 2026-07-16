# Maya — AI Query Consultant Widget

An autonomous, framework-agnostic chat widget for handling **order** and **service** inquiries. Built with plain HTML, CSS, and Vanilla JavaScript on the frontend and a small Node.js/Express backend that proxies to the Google Gemini API. Drops into any existing website.

## Files

| File | Purpose |
|------|---------|
| `index.html` | Widget markup + a demo host page |
| `style.css` | Widget UI, bright pulsing launcher, Maya header |
| `script.js` | Frontend chat logic (Vanilla JS, no dependencies) |
| `server.js` | Express backend: injects Maya's system prompt, calls Gemini |
| `package.json` | Backend dependencies and scripts |
| `.env.example` | Template for your API key and config |

## Run the demo

```bash
cd "AI query"
npm install
cp .env.example .env      # then edit .env and add your GEMINI_API_KEY
npm start
```

Open http://localhost:3000/index.html — Maya floats bottom-right.

## Embed in your own website

Add these two lines before `</body>` on any page, and copy the widget markup (the block between `<!-- MAYA WIDGET START -->` and `<!-- MAYA WIDGET END -->` in `index.html`) into your page:

```html
<link rel="stylesheet" href="/path/to/style.css">
<script src="/path/to/script.js" data-maya-api="https://your-backend.com/api/chat" defer></script>
```

The `data-maya-api` attribute points the widget at your deployed backend. Because styles are scoped under `.maya-widget` and the container uses a high `z-index` fixed overlay, the widget sits on top of any page without interfering with existing layout.

## How it works

The browser never sees the API key. `script.js` POSTs `{ message, history }` to `/api/chat`; `server.js` prepends Maya's strict system prompt, forwards the conversation to Gemini, and returns `{ reply }`.

### Maya's system prompt (enforced server-side)

- **Identity:** Maya, an autonomous, professional query consultant.
- **Scope:** Only order inquiries (tracking, status, issues) and services offered.
- **Execution:** Definitive, absolute, complete answers. Resolves every query on its own with no human escalation and zero ambiguity.

## Production notes

- Restrict CORS in `server.js` to your site's origin instead of the open default.
- Put the backend behind HTTPS and add rate limiting.
- Never commit your `.env` file.
