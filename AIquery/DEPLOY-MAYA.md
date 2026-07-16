# Deploying Maaya AI

The production website calls `/api/chat`. The repository's `vercel.json` forwards that same-origin request to the existing Node service at `https://veshannastro6.onrender.com/api/chat`, implemented by `AIquery/server.js`.

## Production deployment

1. In the existing Render service `veshannastro6`, confirm the repository root directory is `AIquery` and the branch is the intended release branch.
2. Keep these server-only environment values configured:

   - `GEMINI_API_KEY`: the private Gemini key;
   - `GEMINI_MODEL`: the currently tested model;
   - `DATABASE_URL`: the same PostgreSQL/Neon database used by the admin dashboard;
   - `SHEET_WEBHOOK_URL`: the existing Maaya escalation Apps Script `/exec` URL;
   - `ALLOWED_ORIGINS`: the two production website origins;
   - `RATE_MAX`: optional per-minute request cap, default `20`.

3. Deploy the selected branch and open `https://veshannastro6.onrender.com/health`.
4. Continue only when `keyConfigured`, `databaseConfigured`, and `sheetLogging` are all `true`.
5. Redeploy the website on Vercel if `vercel.json` or widget code changed.
6. Send a harmless test chat and confirm it appears under **AI Chats** in the admin app.
7. Test an escalation using non-sensitive test contact details. Confirm:

   - the structured marker is not visible in the website reply;
   - the conversation appears under **Hot leads** in the admin app;
   - the existing Maaya Google Sheet receives one escalation row.

The database is the admin dashboard's complete transcript source. The Sheet webhook remains a backup escalation log. Gemini keys, database credentials, and admin credentials never belong in HTML or JavaScript.

## Compatible Python endpoint

`wallet.py` also contains a compatible `/api/chat` endpoint for a future combined Python deployment. It is not the destination currently configured in `vercel.json`; do not switch production traffic to it unless that migration is intentional and tested.

## Local Node demo

```bash
cd AIquery
npm install
GEMINI_API_KEY=replace-me DATABASE_URL=postgresql://... npm start
```

Open `http://localhost:3000/index.html`. Never commit a real `.env` file or paste secrets into chat, screenshots, or client-side code.
