-- Customer accounts, part two: optional birth details and order history on the "Your account" page.
--
-- Run ONCE in the SQL editor, connected as the database owner (the role Kamala's DATABASE_URL uses), AFTER
-- db/2026-11-accounts.sql. Safe to run again.
--
-- What it does
--   * Three optional columns on web_accounts: birth time, birth place and gender. The website's web_auth login can
--     already read and write web_accounts (its own row only, by row-level security), so it needs no new grant.
--   * One function, web_account_orders(session_hash), that lists the paid orders of the number behind a live
--     session: website 2027 report orders (web_orders) and orders paid through Kamala's WhatsApp payment links
--     (wa_payment_links), with the delivery time when the report has gone out. It runs as the owner, because
--     web_auth must never read those tables directly. It finds the number itself, from the session table, so
--     knowing a number is not enough: the caller has to hold a live session's hash.

BEGIN;

ALTER TABLE web_accounts ADD COLUMN IF NOT EXISTS tob TEXT CHECK (tob IS NULL OR tob ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');
ALTER TABLE web_accounts ADD COLUMN IF NOT EXISTS pob TEXT CHECK (pob IS NULL OR char_length(pob) BETWEEN 2 AND 120);
ALTER TABLE web_accounts ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IS NULL OR gender IN ('male', 'female', 'other'));

CREATE OR REPLACE FUNCTION web_account_orders(session_hash TEXT)
RETURNS TABLE (ref TEXT, title TEXT, kind TEXT, amount NUMERIC, currency TEXT, paid_at TIMESTAMPTZ,
               appointment_at TIMESTAMPTZ, invoice TEXT, delivered_at TIMESTAMPTZ)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  p TEXT;
BEGIN
  IF session_hash IS NULL OR session_hash !~ '^[0-9a-f]{64}$' THEN RETURN; END IF;
  SELECT s.phone INTO p FROM web_sessions s WHERE s.token_hash = session_hash AND s.expires_at > NOW();
  IF p IS NULL THEN RETURN; END IF;

  RETURN QUERY
  SELECT * FROM (
    -- 2027 reports paid on the website (Kamala's fulfilment writes these rows)
    SELECT o.order_id,
           COALESCE(NULLIF(o.details->>'reportName', ''), '2027 Personal Year Report'),
           'report'::TEXT,
           NULLIF(o.details->>'amount', '')::NUMERIC,
           COALESCE(NULLIF(o.details->>'currency', ''), 'INR'),
           COALESCE(o.paid_at, o.created_at),
           NULL::TIMESTAMPTZ,
           o.invoice_number,
           (SELECT MIN(d.sent_at) FROM report_deliveries d
             WHERE d.phone = o.phone AND d.status = 'sent' AND d.sent_at >= COALESCE(o.paid_at, o.created_at))
      FROM web_orders o
     WHERE o.phone = p AND o.details IS NOT NULL
    UNION ALL
    -- consultations and reports paid through a payment link Kamala sent on WhatsApp
    SELECT l.payment_link_id,
           COALESCE(NULLIF(l.service_name, ''), 'Consultation'),
           CASE WHEN l.delivery_kind = 'delivered' THEN 'report' ELSE 'consultation' END,
           ROUND(l.amount_paise / 100.0, 2),
           'INR'::TEXT,
           COALESCE(l.paid_at, l.updated_at),
           CASE WHEN l.delivery_kind = 'delivered' THEN NULL ELSE l.appointment_start END,
           l.request_invoice_number,
           l.report_delivered_at
      FROM wa_payment_links l
     WHERE l.phone = p AND l.status = 'paid'
  ) AS orders
  ORDER BY 6 DESC NULLS LAST
  LIMIT 50;
END $$;

REVOKE ALL ON FUNCTION web_account_orders(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION web_account_orders(TEXT) TO web_auth;

COMMIT;
