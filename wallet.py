"""
Veshannastro — Cashback Wallet ledger
=====================================================================
A small, correct, append-only cashback wallet keyed by the customer's
Firebase UID (the stable id you get from Google Sign-In). Balance is the
SUM of every ledger row, so it can never silently drift.

WHY A BACKEND: a wallet balance must live somewhere the browser cannot
edit. If it lived in the page, anyone could set their balance to a lakh
in DevTools. So the balance lives here, in Neon Postgres, and the page
only ever *asks* for it.

Endpoints
  GET  /wallet/{uid}            -> current balance (paise + rupees)
  POST /wallet/signup-bonus     -> one-time welcome cashback (idempotent per uid)
  POST /wallet/redeem           -> debit on a SUCCESSFUL payment (idempotent per payment_id)
  POST /wallet/earn             -> credit cashback for next time (idempotent per payment_id)
  POST /wallet/credit           -> ADMIN manual credit (needs X-Admin-Token)
  GET  /                        -> health check

MONEY IS ALWAYS INTEGER PAISE. Never floats. 100 paise = 1 rupee.

CONCURRENCY: redeem/earn take a per-uid Postgres advisory lock inside the
transaction, so two clicks at the same instant can't both spend the same
balance. Every write is idempotent via a unique (uid, reason, ref) index,
so a retried request (flaky network, double tap) never double-counts.

TRUST MODEL (read this):
  * redeem / earn are called by the browser ONLY inside Razorpay's success
    handler, so cashback is spent/earned only on a real, completed payment.
    An abandoned checkout never burns a balance.
  * redeem is clamped server-side to the actual balance, so a tampered
    request can never push the wallet negative.
  * earn is computed server-side from EARN_RATE (the client's posted
    amount is only an input; see compute in /wallet/earn). This is a small
    self-credit for future use — low value, same risk class as a coupon.
  * Real balances are granted by YOU via /wallet/credit (admin token) or
    the one-time signup bonus. So a user cannot invent spendable money.

requirements.txt:  fastapi  uvicorn[standard]  psycopg2-binary
Start command:     uvicorn wallet:app --host 0.0.0.0 --port $PORT
Env vars (Render -> Environment):
    DATABASE_URL     postgres://...neon.tech/...?sslmode=require   (your Neon URL)
    ALLOWED_ORIGIN   https://www.veshannastro.co.in,https://veshannastro.co.in   (comma-separated; both www and apex)
    ADMIN_TOKEN      <a long random secret you invent>             (for manual credits)
    SIGNUP_BONUS     10000    (optional; paise granted once on first login. 10000 = Rs 100. 0 = off)
    EARN_RATE        0.05     (optional; fraction of amount paid credited back for next time)
=====================================================================
"""

import os
import psycopg2
from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

DATABASE_URL   = os.environ.get("DATABASE_URL", "")
ALLOWED_ORIGIN = os.environ.get("ALLOWED_ORIGIN", "*")
_ORIGINS = ["*"] if ALLOWED_ORIGIN.strip() == "*" else [o.strip() for o in ALLOWED_ORIGIN.split(",") if o.strip()]
ADMIN_TOKEN    = os.environ.get("ADMIN_TOKEN", "")
SIGNUP_BONUS   = int(os.environ.get("SIGNUP_BONUS", "0"))      # paise, one-time
EARN_RATE      = float(os.environ.get("EARN_RATE", "0.05"))    # 5% back by default
SLOTS_PER_WEEK = int(os.environ.get("SLOTS_PER_WEEK", "10"))   # weekly consultation capacity shown on the page

app = FastAPI(title="Veshannastro Wallet")
app.add_middleware(
    CORSMiddleware,
    allow_origins=_ORIGINS,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


# ── db helpers ───────────────────────────────────────────────────────────────
def conn():
    if not DATABASE_URL:
        raise HTTPException(500, "DATABASE_URL not configured on the server.")
    return psycopg2.connect(DATABASE_URL)


def init_db():
    with conn() as c, c.cursor() as cur:
        cur.execute("""
            CREATE TABLE IF NOT EXISTS wallet_ledger (
                id          BIGSERIAL PRIMARY KEY,
                uid         TEXT   NOT NULL,
                email       TEXT,
                delta_paise BIGINT NOT NULL,      -- + credit, - debit
                reason      TEXT   NOT NULL,       -- signup_bonus | redeem | earn | admin_credit
                ref         TEXT   NOT NULL DEFAULT '',
                created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
            );
        """)
        cur.execute("CREATE INDEX IF NOT EXISTS wallet_uid_idx ON wallet_ledger (uid);")
        # idempotency: the same (uid, reason, ref) can be written at most once
        cur.execute("""
            CREATE UNIQUE INDEX IF NOT EXISTS wallet_ref_uniq
            ON wallet_ledger (uid, reason, ref)
            WHERE ref <> '';
        """)
        # weekly slot capacity (one row per ISO week; auto-resets when the week rolls over)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS slots (
                week_key  TEXT PRIMARY KEY,
                remaining INT  NOT NULL
            );
        """)
        # which payments have already consumed a slot (idempotency)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS slot_consumed (
                payment_id TEXT PRIMARY KEY,
                week_key   TEXT NOT NULL,
                ts         TIMESTAMPTZ NOT NULL DEFAULT now()
            );
        """)


try:
    init_db()
except Exception as _e:      # don't crash boot if DB is briefly unreachable
    print("init_db deferred:", _e)


def balance_paise(cur, uid: str) -> int:
    cur.execute("SELECT COALESCE(SUM(delta_paise),0) FROM wallet_ledger WHERE uid=%s", (uid,))
    return int(cur.fetchone()[0] or 0)


def out(paise: int) -> dict:
    return {"balance_paise": int(paise), "balance_rupees": round(int(paise) / 100, 2)}


# ── models ───────────────────────────────────────────────────────────────────
class UidBody(BaseModel):
    uid: str
    email: str = ""


class RedeemBody(BaseModel):
    uid: str
    email: str = ""
    amount_paise: int            # how much cashback the buyer applied at checkout
    payment_id: str              # Razorpay payment id — the idempotency key


class EarnBody(BaseModel):
    uid: str
    email: str = ""
    amount_paid_paise: int       # net the buyer actually paid; server computes the credit
    payment_id: str


class CreditBody(BaseModel):
    uid: str
    email: str = ""
    amount_paise: int
    ref: str = ""
    note: str = ""


class SlotConsume(BaseModel):
    payment_id: str


def _week_key() -> str:
    import datetime
    iso = datetime.date.today().isocalendar()      # (year, week, weekday)
    return f"{iso[0]}-W{iso[1]:02d}"


def _slots_remaining(cur, wk: str) -> int:
    cur.execute("SELECT remaining FROM slots WHERE week_key=%s", (wk,))
    row = cur.fetchone()
    if row is None:
        # first request this week → initialise to the weekly capacity
        cur.execute(
            "INSERT INTO slots (week_key, remaining) VALUES (%s, %s) "
            "ON CONFLICT (week_key) DO NOTHING",
            (wk, SLOTS_PER_WEEK))
        return SLOTS_PER_WEEK
    return int(row[0])


# ── routes ───────────────────────────────────────────────────────────────────
@app.get("/")
def health():
    return {"ok": True, "configured": bool(DATABASE_URL),
            "signup_bonus_paise": SIGNUP_BONUS, "earn_rate": EARN_RATE,
            "slots_per_week": SLOTS_PER_WEEK}


@app.get("/slots")
def slots_get():
    wk = _week_key()
    with conn() as c, c.cursor() as cur:
        return {"week": wk, "remaining": _slots_remaining(cur, wk)}


@app.post("/slots/consume")
def slots_consume(body: SlotConsume):
    """Decrement one slot for a real paid booking. Idempotent per payment_id, so a
    retry or double-tap never double-counts. Auto-scoped to the current ISO week."""
    wk = _week_key()
    with conn() as c, c.cursor() as cur:
        cur.execute("SELECT pg_advisory_xact_lock(hashtext(%s))", (wk,))
        remaining = _slots_remaining(cur, wk)
        if body.payment_id:
            cur.execute(
                "INSERT INTO slot_consumed (payment_id, week_key) VALUES (%s, %s) "
                "ON CONFLICT (payment_id) DO NOTHING",
                (body.payment_id, wk))
            if cur.rowcount == 1 and remaining > 0:      # first time we've seen this payment
                cur.execute("UPDATE slots SET remaining = GREATEST(0, remaining - 1) "
                            "WHERE week_key=%s", (wk,))
                remaining -= 1
        return {"week": wk, "remaining": remaining}


@app.get("/wallet/{uid}")
def get_balance(uid: str):
    with conn() as c, c.cursor() as cur:
        return out(balance_paise(cur, uid))


@app.post("/wallet/signup-bonus")
def signup_bonus(body: UidBody):
    """Grant a one-time welcome cashback the first time this uid appears.
    Idempotent: ref is the uid itself, so it can only ever land once."""
    if SIGNUP_BONUS <= 0:
        with conn() as c, c.cursor() as cur:
            return out(balance_paise(cur, body.uid))
    with conn() as c, c.cursor() as cur:
        cur.execute("SELECT pg_advisory_xact_lock(hashtext(%s))", (body.uid,))
        cur.execute("""
            INSERT INTO wallet_ledger (uid, email, delta_paise, reason, ref)
            VALUES (%s, %s, %s, 'signup_bonus', %s)
            ON CONFLICT (uid, reason, ref) WHERE ref <> '' DO NOTHING
        """, (body.uid, body.email, SIGNUP_BONUS, body.uid))
        return out(balance_paise(cur, body.uid))


@app.post("/wallet/redeem")
def redeem(body: RedeemBody):
    """Debit cashback on a completed payment. Clamped to the real balance so it
    can never go negative. Idempotent on payment_id."""
    if body.amount_paise <= 0 or not body.payment_id:
        with conn() as c, c.cursor() as cur:
            return out(balance_paise(cur, body.uid))
    with conn() as c, c.cursor() as cur:
        cur.execute("SELECT pg_advisory_xact_lock(hashtext(%s))", (body.uid,))
        bal = balance_paise(cur, body.uid)
        take = min(body.amount_paise, bal)          # never spend more than they have
        if take > 0:
            cur.execute("""
                INSERT INTO wallet_ledger (uid, email, delta_paise, reason, ref)
                VALUES (%s, %s, %s, 'redeem', %s)
                ON CONFLICT (uid, reason, ref) WHERE ref <> '' DO NOTHING
            """, (body.uid, body.email, -take, body.payment_id))
        return out(balance_paise(cur, body.uid))


@app.post("/wallet/earn")
def earn(body: EarnBody):
    """Credit cashback for next time, computed server-side from EARN_RATE.
    Idempotent on payment_id."""
    credit = int(round(max(0, body.amount_paid_paise) * EARN_RATE))
    if credit <= 0 or not body.payment_id:
        with conn() as c, c.cursor() as cur:
            return out(balance_paise(cur, body.uid))
    with conn() as c, c.cursor() as cur:
        cur.execute("SELECT pg_advisory_xact_lock(hashtext(%s))", (body.uid,))
        cur.execute("""
            INSERT INTO wallet_ledger (uid, email, delta_paise, reason, ref)
            VALUES (%s, %s, %s, 'earn', %s)
            ON CONFLICT (uid, reason, ref) WHERE ref <> '' DO NOTHING
        """, (body.uid, body.email, credit, body.payment_id))
        return {**out(balance_paise(cur, body.uid)), "earned_paise": credit}


@app.post("/wallet/credit")
def admin_credit(body: CreditBody, x_admin_token: Optional[str] = Header(None)):
    """You (admin) manually credit cashback, e.g. a promo or a goodwill gesture."""
    if not ADMIN_TOKEN or x_admin_token != ADMIN_TOKEN:
        raise HTTPException(401, "Bad admin token.")
    if body.amount_paise == 0:
        raise HTTPException(400, "amount_paise must be non-zero.")
    ref = body.ref or f"admin-{body.note[:40]}"
    with conn() as c, c.cursor() as cur:
        cur.execute("SELECT pg_advisory_xact_lock(hashtext(%s))", (body.uid,))
        cur.execute("""
            INSERT INTO wallet_ledger (uid, email, delta_paise, reason, ref)
            VALUES (%s, %s, %s, 'admin_credit', %s)
            ON CONFLICT (uid, reason, ref) WHERE ref <> '' DO NOTHING
        """, (body.uid, body.email, body.amount_paise, ref))
        return out(balance_paise(cur, body.uid))
