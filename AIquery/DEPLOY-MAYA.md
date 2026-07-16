# Deploying Maaya AI

The production website calls `/api/chat`. The repository's `vercel.json` forwards that same-origin request to the Python service implemented in `wallet.py`. That is the primary deployment path because it also owns the cashback and payment-verification APIs.

## Production deployment

1. Deploy the repository's root `render.yaml` service, or update the existing Python Render service connected to this repository.
2. In Render, set these server-only values:

   - `DATABASE_URL`: the same PostgreSQL/Neon database used by the admin dashboard;
   - `GEMINI_API_KEY`: the private Gemini key;
   - `GEMINI_MODEL`: `gemini-2.5-flash` unless a tested replacement is chosen;
   - `MAAYA_RATE_MAX`: optional per-minute request cap, default `20`;
   - the existing Razorpay and wallet variables required by `wallet.py`.

3. Confirm the service root reports `"maaya_configured": true` and `"maaya_database_configured": true`.
4. Ensure `vercel.json` points to that exact Render service's `/api/chat` URL.
5. Redeploy the website on Vercel.
6. Send a harmless test chat, then confirm it appears in the admin app under **AI Chats**.
7. Test an escalation using non-sensitive test contact details. Confirm the structured marker is not visible in the website reply and that the chat appears under **Hot leads** in the admin app.

The browser receives only an opaque session ID. Complete transcripts and structured lead events are stored in the shared database; Gemini keys, database credentials, and admin credentials never belong in HTML or JavaScript.

## Optional standalone Node service

`AIquery/server.js` provides the same Maaya behavior for a separate Node deployment. Use `AIquery/render.yaml`, set `GEMINI_API_KEY`, `DATABASE_URL`, and restrictive `ALLOWED_ORIGINS`, then point `vercel.json` to its `/api/chat` endpoint. Do not deploy both backends for one site unless traffic is intentionally routed between them.

## Local Node demo

```bash
cd AIquery
npm install
GEMINI_API_KEY=replace-me DATABASE_URL=postgresql://... npm start
```

Open `http://localhost:3000/index.html`. Never commit a real `.env` file or paste secrets into chat, screenshots, or client-side code.
