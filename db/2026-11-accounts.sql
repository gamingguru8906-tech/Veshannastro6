-- Customer accounts for veshannastro.co.in: sign in with a WhatsApp code (OTP).
--
-- Run ONCE in the SQL editor (Supabase or Neon), connected as the database owner (the role Kamala's DATABASE_URL uses).
-- Before running, replace CHANGE_ME below with a long random password, for example from:
--     node -e "console.log(require('crypto').randomBytes(24).toString('base64url'))"
-- Then set in Vercel (Production):
--     AUTH_DATABASE_URL = postgresql://web_auth:<that password>@<your host>/<db>?sslmode=require
--       (Supabase pooler: user web_auth.<project ref>, host aws-0-<region>.pooler.supabase.com, port 6543)
--     AUTH_OTP_PEPPER   = another long random value (keys the stored code hashes)
--
-- What it does
--   * Four tables for accounts, sessions, one-time codes and login rate limits.
--   * A separate login, web_auth, that the website's account functions use. It can touch these four tables only
--     (not users, web_leads or anything of Kamala's), cannot delete accounts, and is bound by row-level security:
--     every query sees only the row of the number that was just verified or the session that was just presented.
--   * The owner (Kamala) is not bound by these policies, so Kamala can copy new accounts to the Google Sheet.

BEGIN;

CREATE TABLE IF NOT EXISTS web_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL UNIQUE CHECK (phone ~ '^[1-9][0-9]{7,14}$'),
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 80),
  email TEXT NOT NULL CHECK (char_length(email) BETWEEN 6 AND 120),
  dob DATE NOT NULL CHECK (dob >= DATE '1900-01-01'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sheet_synced_at TIMESTAMPTZ
);

-- The cookie holds a random token; only its SHA-256 is stored, so a database leak cannot be replayed as a login.
CREATE TABLE IF NOT EXISTS web_sessions (
  token_hash TEXT PRIMARY KEY CHECK (token_hash ~ '^[0-9a-f]{64}$'),
  phone TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS web_sessions_phone_idx ON web_sessions (phone);
CREATE INDEX IF NOT EXISTS web_sessions_expires_idx ON web_sessions (expires_at);

-- One live code per number: a keyed hash of it, never the code itself.
CREATE TABLE IF NOT EXISTS web_otps (
  phone TEXT PRIMARY KEY,
  code_hash TEXT NOT NULL CHECK (code_hash ~ '^[0-9a-f]{64}$'),
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fixed-window counters (per hashed number or hashed IP), shared by every Vercel instance.
CREATE TABLE IF NOT EXISTS web_auth_limits (
  bucket TEXT PRIMARY KEY,
  window_start TIMESTAMPTZ NOT NULL,
  hits INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS web_auth_limits_window_idx ON web_auth_limits (window_start);

-- The website's own login. Create it here, or in the Neon console (Roles > New role, named web_auth) and skip this line.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'web_auth') THEN
    CREATE ROLE web_auth LOGIN PASSWORD 'CHANGE_ME' NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
  END IF;
END $$;
ALTER ROLE web_auth NOBYPASSRLS;

GRANT USAGE ON SCHEMA public TO web_auth;
GRANT SELECT, INSERT, UPDATE ON web_accounts TO web_auth;
GRANT SELECT, INSERT, UPDATE, DELETE ON web_sessions, web_otps, web_auth_limits TO web_auth;

ALTER TABLE web_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_otps ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_auth_limits ENABLE ROW LEVEL SECURITY;

-- The functions set these per transaction (set_config(..., true)), from the verified code or the presented session,
-- never from what the browser sends:
--   app.phone    the number whose account this request may read or write
--   app.session  the SHA-256 of the session cookie
--   app.otp_phone  the number a code is being sent to or checked for
--   app.buckets  the rate-limit counters this request may touch (comma separated)
DROP POLICY IF EXISTS accounts_own ON web_accounts;
CREATE POLICY accounts_own ON web_accounts FOR ALL TO web_auth
  USING (phone = current_setting('app.phone', true))
  WITH CHECK (phone = current_setting('app.phone', true));

DROP POLICY IF EXISTS sessions_read ON web_sessions;
CREATE POLICY sessions_read ON web_sessions FOR SELECT TO web_auth
  USING (token_hash = current_setting('app.session', true));
DROP POLICY IF EXISTS sessions_create ON web_sessions;
CREATE POLICY sessions_create ON web_sessions FOR INSERT TO web_auth
  WITH CHECK (phone = current_setting('app.phone', true));
DROP POLICY IF EXISTS sessions_touch ON web_sessions;
CREATE POLICY sessions_touch ON web_sessions FOR UPDATE TO web_auth
  USING (token_hash = current_setting('app.session', true))
  WITH CHECK (token_hash = current_setting('app.session', true));
DROP POLICY IF EXISTS sessions_end ON web_sessions;
CREATE POLICY sessions_end ON web_sessions FOR DELETE TO web_auth
  USING (token_hash = current_setting('app.session', true));

DROP POLICY IF EXISTS otps_own ON web_otps;
CREATE POLICY otps_own ON web_otps FOR ALL TO web_auth
  USING (phone = current_setting('app.otp_phone', true))
  WITH CHECK (phone = current_setting('app.otp_phone', true));

DROP POLICY IF EXISTS limits_own ON web_auth_limits;
CREATE POLICY limits_own ON web_auth_limits FOR ALL TO web_auth
  USING (bucket = ANY (string_to_array(current_setting('app.buckets', true), ',')))
  WITH CHECK (bucket = ANY (string_to_array(current_setting('app.buckets', true), ',')));

-- Expired sessions, codes and counters belong to nobody, so RLS would hide them from web_auth. This one function
-- (run as the owner) clears them; the website calls it now and then. It deletes only expired rows.
CREATE OR REPLACE FUNCTION web_auth_cleanup() RETURNS void
  LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  DELETE FROM web_sessions WHERE expires_at < NOW();
  DELETE FROM web_otps WHERE expires_at < NOW() - INTERVAL '1 hour';
  DELETE FROM web_auth_limits WHERE window_start < NOW() - INTERVAL '1 day';
$$;
REVOKE ALL ON FUNCTION web_auth_cleanup() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION web_auth_cleanup() TO web_auth;

-- Supabase: its public API roles (anon, authenticated) get access to new tables and functions by default. The website
-- never uses them, so that access is removed. (Elsewhere these roles do not exist and this does nothing.)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'REVOKE ALL ON web_accounts, web_sessions, web_otps, web_auth_limits FROM anon, authenticated';
    EXECUTE 'REVOKE ALL ON FUNCTION web_auth_cleanup() FROM anon, authenticated';
    IF to_regprocedure('web_account_orders(text)') IS NOT NULL THEN
      EXECUTE 'REVOKE ALL ON FUNCTION web_account_orders(text) FROM anon, authenticated';
    END IF;
  END IF;
END $$;

COMMIT;
