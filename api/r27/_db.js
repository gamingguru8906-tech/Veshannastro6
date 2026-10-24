'use strict';
// The shared Postgres database: the same DATABASE_URL Kamala uses on Render, set in Vercel too. With it, everything a
// person does on the website (the order form, the calculator, pages read, WhatsApp taps, payments) sits in the same
// place as their WhatsApp chats, so Kamala knows both. Without it, the form still reaches Kamala through /web-lead.
//
// The table shapes match whatsapp-agent/web-orders.js (migrate). Keep the two in step.
const { Pool } = require('pg');

let pool = null;
let schemaReady = null;

function url() { return String(process.env.DATABASE_URL || '').trim(); }
function enabled() { return Boolean(url()); }

function db() {
  if (!enabled()) return null;
  if (!pool) {
    pool = new Pool({ connectionString: url(), ssl: { rejectUnauthorized: false }, max: 2, idleTimeoutMillis: 10000, connectionTimeoutMillis: 7000 });
    pool.on('error', e => console.error('Postgres idle connection error:', e.message));
  }
  return pool;
}

function ensureSchema() {
  if (!schemaReady) {
    schemaReady = db().query(`
      CREATE TABLE IF NOT EXISTS web_leads (
        phone TEXT PRIMARY KEY,
        name TEXT, email TEXT, dob TEXT, tob TEXT, pob TEXT,
        report TEXT, report_name TEXT, price TEXT, referral TEXT,
        stage TEXT NOT NULL DEFAULT 'form',
        times INTEGER NOT NULL DEFAULT 1,
        first_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS web_visitors (
        visitor TEXT PRIMARY KEY,
        phone TEXT,
        first_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS web_events (
        id BIGSERIAL PRIMARY KEY,
        visitor TEXT,
        phone TEXT,
        kind TEXT NOT NULL,
        detail JSONB NOT NULL DEFAULT '{}'::jsonb,
        path TEXT,
        at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS web_events_phone_idx ON web_events (phone, at DESC);
      CREATE INDEX IF NOT EXISTS web_events_visitor_idx ON web_events (visitor, at DESC);
    `).catch(e => { schemaReady = null; throw e; });
  }
  return schemaReady;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
function dobText(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
  return m ? `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${m[1]}` : '';
}
const validVisitor = v => /^[a-z0-9]{16,40}$/.test(String(v || ''));

/**
 * The order form, saved against the WhatsApp number. Fills only what Kamala does not know yet (her chats win),
 * and links this browser's earlier activity to the number.
 */
async function saveLead(o, stage, visitor, priceText) {
  const p = db();
  if (!p) return 'skipped';
  await ensureSchema();
  await p.query(`INSERT INTO users (phone, name, email, dob, tob, pob, first_source, first_contact, last_contact)
    VALUES ($1,$2,$3,$4,$5,$6,'website',NOW(),NOW())
    ON CONFLICT (phone) DO UPDATE SET
      name=COALESCE(NULLIF(users.name,''), EXCLUDED.name), email=COALESCE(NULLIF(users.email,''), EXCLUDED.email),
      dob=COALESCE(NULLIF(users.dob,''), EXCLUDED.dob), tob=COALESCE(NULLIF(users.tob,''), NULLIF(EXCLUDED.tob,'')),
      pob=COALESCE(NULLIF(users.pob,''), EXCLUDED.pob), first_source=COALESCE(users.first_source, 'website')`,
  [o.phone, o.name, o.email, dobText(o.dob), o.tob || '', o.pob]);
  await p.query(`INSERT INTO web_leads (phone, name, email, dob, tob, pob, report, report_name, price, referral, stage)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    ON CONFLICT (phone) DO UPDATE SET name=EXCLUDED.name, email=EXCLUDED.email, dob=EXCLUDED.dob,
      tob=COALESCE(NULLIF(EXCLUDED.tob,''), web_leads.tob), pob=EXCLUDED.pob, report=EXCLUDED.report,
      report_name=EXCLUDED.report_name, price=EXCLUDED.price, referral=COALESCE(NULLIF(EXCLUDED.referral,''), web_leads.referral),
      stage=CASE WHEN web_leads.stage='paid' THEN 'paid' ELSE EXCLUDED.stage END, times=web_leads.times + 1, last_at=NOW()`,
  [o.phone, o.name, o.email, dobText(o.dob), o.tob || '', o.pob, o.key, o.report.name, priceText, o.referral || '', stage]);
  if (validVisitor(visitor)) {
    await p.query(`INSERT INTO web_visitors (visitor, phone) VALUES ($1,$2)
      ON CONFLICT (visitor) DO UPDATE SET phone=EXCLUDED.phone, last_at=NOW()`, [visitor, o.phone]);
    await p.query('UPDATE web_events SET phone=$2 WHERE visitor=$1 AND phone IS NULL', [visitor, o.phone]);
  }
  return 'saved';
}

const KINDS = new Set(['visit', 'select_item', 'begin_checkout', 'add_payment_info', 'purchase', 'payment_failed', 'generate_lead',
  'personal_year_calculated', 'use_calculator_date', 'whatsapp_click', 'cover_seen']);

/** What this browser did on the site (a small batch at a time). Attached to the number once the visitor is known. */
async function addEvents(visitor, events) {
  const p = db();
  if (!p || !validVisitor(visitor)) return 0;
  const rows = (Array.isArray(events) ? events : []).slice(0, 20).filter(e => e && KINDS.has(e.kind)).map(e => {
    let detail = e.detail && typeof e.detail === 'object' && !Array.isArray(e.detail) ? e.detail : {};
    let json = JSON.stringify(detail);
    if (json.length > 600) json = '{}';
    const at = Number(e.at);
    return [e.kind, json, String(e.path || '').slice(0, 200), Number.isFinite(at) && Math.abs(Date.now() - at) < 864e5 ? new Date(at) : new Date()];
  });
  if (!rows.length) return 0;
  await ensureSchema();
  const v = await p.query(`INSERT INTO web_visitors (visitor) VALUES ($1)
    ON CONFLICT (visitor) DO UPDATE SET last_at=NOW() RETURNING phone`, [visitor]);
  const phone = v.rows[0] ? v.rows[0].phone : null;
  const values = [];
  const params = [];
  rows.forEach((r, i) => {
    values.push(`($1,$2,$${i * 4 + 3},$${i * 4 + 4}::jsonb,$${i * 4 + 5},$${i * 4 + 6})`);
    params.push(...r);
  });
  await p.query(`INSERT INTO web_events (visitor, phone, kind, detail, path, at) VALUES ${values.join(',')}`, [visitor, phone, ...params]);
  return rows.length;
}

/** A paid website order, so the record shows it straight away (Kamala's fulfilment marks it too). */
async function markPaid(phone) {
  const p = db();
  if (!p || !phone) return;
  await ensureSchema();
  await p.query(`UPDATE web_leads SET stage='paid', last_at=NOW() WHERE phone=$1`, [phone]);
}

module.exports = { enabled, db, ensureSchema, saveLead, addEvents, markPaid, dobText, KINDS };
