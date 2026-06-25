"""
Veshannastro — flexible Razorpay Payment Link backend
=====================================================
Endpoints
  POST /create-payment-link   create an exact-amount link (any coupon/qty)
  POST /razorpay-webhook      Razorpay calls this on payment; marks WELCOME used
  GET  /                      health check

Wire-up: deploy on Render, then set shop-product.html → CONFIG.createLinkEndpoint
to  https://<your-service>.onrender.com/create-payment-link

WHY A BACKEND: creating a link calls Razorpay with Basic Auth
(KEY_ID:KEY_SECRET). The secret must never reach the browser, so it lives here.

PRICE GUARD IS ON (TRUST_CLIENT_AMOUNT = False): the server ignores the amount
the browser sends and recomputes it from sku + qty + coupon using PRICES below.
This stops anyone editing the price in DevTools and paying ₹1.

WELCOME = first-time / once-per-customer: a buyer can redeem ₹50-off WELCOME
only once. We record the redemption (by email+phone) ONLY when payment actually
succeeds (via the webhook), so an abandoned checkout never "uses up" the code.

requirements.txt:  fastapi  uvicorn[standard]  razorpay
Start command:     uvicorn create_payment_link:app --host 0.0.0.0 --port $PORT
Env vars (Render → Environment):
    RAZORPAY_KEY_ID        rzp_live_xxxxxxxx
    RAZORPAY_KEY_SECRET    <key secret from Razorpay dashboard>     (never in client)
    RAZORPAY_WEBHOOK_SECRET <the secret you set when adding the webhook>
    ALLOWED_ORIGIN         https://www.veshannastro.co.in
    DB_PATH                /var/data/welcome.db   (optional; see persistence note)

PERSISTENCE NOTE: Render's free filesystem is wiped on each restart/redeploy, so
the WELCOME ledger would reset. To keep it: attach a Render Disk and point
DB_PATH at it (e.g. /var/data/welcome.db), or swap SQLite for your Neon Postgres.
"""

import os
import math
import time
import json
import sqlite3
import razorpay
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict

KEY_ID = os.environ.get("RAZORPAY_KEY_ID", "")
KEY_SECRET = os.environ.get("RAZORPAY_KEY_SECRET", "")
WEBHOOK_SECRET = os.environ.get("RAZORPAY_WEBHOOK_SECRET", "")
ALLOWED_ORIGIN = os.environ.get("ALLOWED_ORIGIN", "*")
DB_PATH = os.environ.get("DB_PATH", "welcome.db")
# Optional: your Google Apps Script web-app URL. When set, the webhook logs each
# VERIFIED-paid order to your sheet server-side (trustworthy, unlike the client's
# optimistic logging). Leave unset to skip server-side sheet logging.
APPS_SCRIPT_URL = os.environ.get("APPS_SCRIPT_URL", "")

client = razorpay.Client(auth=(KEY_ID, KEY_SECRET)) if KEY_ID and KEY_SECRET else None

app = FastAPI(title="Veshannastro Payment Links")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[ALLOWED_ORIGIN] if ALLOWED_ORIGIN != "*" else ["*"],
    allow_methods=["POST", "OPTIONS", "GET"],
    allow_headers=["*"],
)

# ── price guard ──────────────────────────────────────────────────────────────
TRUST_CLIENT_AMOUNT = False     # ON: recompute every amount server-side
PRICES = {
    # core collection (current sale prices)
    "VA-BR-TP-001": 799, "VA-BR-AM-002": 999, "VA-BR-CQ-003": 999, "VA-BR-BT-004": 899,
    "VA-BR-CT-005": 1199, "VA-BR-YA-006": 799, "VA-BR-RJ-007": 799, "VA-BR-TE-008": 799,
    "VA-BR-RQ-009": 899, "VA-BR-GA-010": 899, "VA-BR-LL-011": 899, "VA-BR-MN-012": 799,
    # premium collection
    "VA-BR-WM-015": 1399, "VA-BR-7C-013": 1099, "VA-BR-IO-014": 1599,
    "VA-BR-LK-016": 1299, "VA-BR-RE-017": 1299, "VA-BR-PY-018": 999,
    # zodiac (placeholders)
    "ZO-001": 949, "ZO-002": 999, "ZO-003": 879, "ZO-004": 949, "ZO-005": 999, "ZO-006": 879,
    "ZO-007": 949, "ZO-008": 1099, "ZO-009": 949, "ZO-010": 999, "ZO-011": 949, "ZO-012": 879,
}

def round_half_up(x: float) -> int:
    # match the browser's Math.round so the link amount equals what the buyer saw
    return int(math.floor(x + 0.5))

def compute_amount(sku: str, qty: int, coupon: str) -> int:
    base = PRICES.get(sku, 0) * max(1, qty)
    coupon = (coupon or "").upper()
    if coupon == "HAPPY10" and qty >= 2:
        base -= round_half_up(base * 0.10)
    elif coupon == "NEW15":
        # NOTE: server can't verify the buyer truly got an AI recommendation
        # (the unlock is a client flag). To make NEW15 tamper-proof, have Maaya
        # issue an HMAC token and verify it here. Low-value gap for now.
        base -= round_half_up(base * 0.15)
    elif coupon == "WELCOME":
        base -= min(50, base)
    return max(0, base)

# ── WELCOME redemption ledger (SQLite) ────────────────────────────────────────
def db():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("CREATE TABLE IF NOT EXISTS welcome_used "
                 "(k TEXT PRIMARY KEY, email TEXT, phone TEXT, order_id TEXT, ts INTEGER)")
    return conn

def customer_key(email: str, phone: str) -> str:
    email = (email or "").strip().lower()
    digits = "".join(c for c in (phone or "") if c.isdigit())[-10:]
    return email + "|" + digits

def welcome_used(email: str, phone: str) -> bool:
    try:
        conn = db()
        row = conn.execute("SELECT 1 FROM welcome_used WHERE k = ?",
                           (customer_key(email, phone),)).fetchone()
        conn.close()
        return row is not None
    except Exception:
        return False   # never block a sale if the ledger is unavailable

def mark_welcome_used(email: str, phone: str, order_id: str):
    try:
        conn = db()
        conn.execute("INSERT OR IGNORE INTO welcome_used VALUES (?,?,?,?,?)",
                     (customer_key(email, phone), (email or "").strip().lower(),
                      phone or "", order_id or "", int(time.time())))
        conn.commit()
        conn.close()
    except Exception:
        pass

def log_order_to_sheet(order: dict):
    """POST a verified-paid order to the Google Apps Script web app (if configured).
    Sends the same JSON shape the client logs, so your existing doPost handles it."""
    if not APPS_SCRIPT_URL:
        return
    try:
        import urllib.request
        data = json.dumps(order).encode("utf-8")
        req = urllib.request.Request(
            APPS_SCRIPT_URL, data=data,
            headers={"Content-Type": "application/json"}, method="POST")
        urllib.request.urlopen(req, timeout=10).read()
    except Exception:
        pass   # never let logging break the webhook response

# ── models ────────────────────────────────────────────────────────────────────
class Customer(BaseModel):
    name: str = ""
    email: str = ""
    contact: str = ""

class OrderIn(BaseModel):
    amount: int                       # rupees (ignored when price guard is on)
    order_id: str
    description: str = "Veshannastro band"
    customer: Customer = Customer()
    notes: Dict[str, str] = {}
    callback_url: Optional[str] = None

# ── multi-item cart models ────────────────────────────────────────────────────
class CartItem(BaseModel):
    sku: str
    qty: int = 1

class CartCustomer(BaseModel):
    name: str = ""
    email: str = ""
    contact: str = ""
    address: str = ""
    city: str = ""
    state: str = ""
    pincode: str = ""

class CartIn(BaseModel):
    order_id: str
    items: list = []                  # list of {sku, qty}
    coupon: str = ""
    description: str = "Veshannastro gemstone order"
    customer: CartCustomer = CartCustomer()
    callback_url: Optional[str] = None

def compute_cart_amount(items, coupon: str = "") -> int:
    """Sum line totals from the SERVER price table — never trust the browser.
    Applies cart coupons: HAPPY10 = 10% off on 2+ bracelets, NEW15 = 15% off."""
    total = 0
    units = 0
    for it in items or []:
        sku = (it.get("sku") if isinstance(it, dict) else getattr(it, "sku", "")) or ""
        qty = (it.get("qty") if isinstance(it, dict) else getattr(it, "qty", 1)) or 1
        try:
            qty = max(1, int(qty))
        except Exception:
            qty = 1
        total += PRICES.get(sku, 0) * qty
        units += qty
    coupon = (coupon or "").upper()
    if coupon == "HAPPY10" and units >= 2:
        total -= round_half_up(total * 0.10)
    elif coupon == "NEW15":
        total -= round_half_up(total * 0.15)
    return max(0, total)

# ── routes ──────────────────────────────────────────────────────────────────
@app.get("/")
def health():
    return {"ok": True, "configured": client is not None, "price_guard": not TRUST_CLIENT_AMOUNT}

@app.post("/create-payment-link")
def create_payment_link(order: OrderIn):
    if client is None:
        raise HTTPException(500, "Razorpay keys not configured on the server.")

    coupon = (order.notes.get("coupon", "") or "").upper()

    # WELCOME: one redemption per customer
    if coupon == "WELCOME" and welcome_used(order.customer.email, order.customer.contact):
        return JSONResponse(status_code=409, content={
            "error": "welcome_used",
            "message": "WELCOME has already been used for this email/phone."
        })

    if TRUST_CLIENT_AMOUNT:
        amount_rupees = order.amount
    else:
        amount_rupees = compute_amount(
            order.notes.get("sku", ""),
            int(order.notes.get("qty", "1") or 1),
            coupon,
        )
    if amount_rupees <= 0:
        raise HTTPException(400, "Invalid amount.")

    payload = {
        "amount": amount_rupees * 100,            # paise
        "currency": "INR",
        "accept_partial": False,
        "description": order.description[:2048],
        "reference_id": f"{order.order_id}-{int(time.time())}",
        "customer": {
            "name": order.customer.name,
            "email": order.customer.email,
            "contact": order.customer.contact,
        },
        "notify": {"sms": False, "email": False},
        "reminder_enable": False,
        # keep what we need to confirm the WELCOME redemption in the webhook
        "notes": {**order.notes, "buyer_email": order.customer.email,
                  "buyer_phone": order.customer.contact},
    }
    if order.callback_url:
        payload["callback_url"] = order.callback_url
        payload["callback_method"] = "get"

    try:
        link = client.payment_link.create(payload)
    except Exception as exc:
        raise HTTPException(502, f"Razorpay error: {exc}")

    return {"short_url": link.get("short_url"), "id": link.get("id"), "amount": amount_rupees}

@app.post("/create-cart-link")
def create_cart_link(cart: CartIn):
    """Multi-item cart → exact-amount Razorpay payment link (full-page hosted checkout).
    The amount is recomputed from the SERVER price table, so the browser can't tamper."""
    if client is None:
        raise HTTPException(500, "Razorpay keys not configured on the server.")

    amount_rupees = compute_cart_amount(cart.items, cart.coupon)
    if amount_rupees <= 0:
        raise HTTPException(400, "Invalid cart / empty amount.")

    # compact human summary for the dashboard + webhook
    summary = ", ".join(
        f"{(it.get('sku') if isinstance(it, dict) else it.sku)}x"
        f"{(it.get('qty') if isinstance(it, dict) else it.qty)}"
        for it in cart.items
    )[:240]

    c = cart.customer
    payload = {
        "amount": amount_rupees * 100,            # paise
        "currency": "INR",
        "accept_partial": False,
        "description": (cart.description or "Veshannastro gemstone order")[:2048],
        "reference_id": f"{cart.order_id}-{int(time.time())}",
        "customer": {"name": c.name, "email": c.email, "contact": c.contact},
        "notify": {"sms": False, "email": False},
        "reminder_enable": False,
        # everything the webhook needs to log a verified order to the sheet
        "notes": {
            "order_id": cart.order_id, "items": summary, "kind": "cart", "coupon": (cart.coupon or ""),
            "buyer_name": c.name, "buyer_email": c.email, "buyer_phone": c.contact,
            "address": c.address[:240], "city": c.city, "state": c.state, "pincode": c.pincode,
            "amount": str(amount_rupees),
        },
    }
    if cart.callback_url:
        payload["callback_url"] = cart.callback_url
        payload["callback_method"] = "get"

    try:
        link = client.payment_link.create(payload)
    except Exception as exc:
        raise HTTPException(502, f"Razorpay error: {exc}")

    return {"short_url": link.get("short_url"), "id": link.get("id"), "amount": amount_rupees}

@app.post("/razorpay-webhook")
async def razorpay_webhook(request: Request):
    body = await request.body()
    signature = request.headers.get("x-razorpay-signature", "")
    if not WEBHOOK_SECRET:
        raise HTTPException(500, "Webhook secret not configured.")
    try:
        client.utility.verify_webhook_signature(body.decode("utf-8"), signature, WEBHOOK_SECRET)
    except Exception:
        raise HTTPException(400, "Invalid webhook signature.")

    event = json.loads(body.decode("utf-8"))
    # Fired when a payment link is paid
    if event.get("event") == "payment_link.paid":
        try:
            pl = event["payload"]["payment_link"]["entity"]
            notes = pl.get("notes", {}) or {}
            payment_id = ""
            try:
                payment_id = event["payload"]["payment"]["entity"]["id"]
            except Exception:
                payment_id = ""

            # WELCOME: record one-per-customer redemption only on real payment
            if (notes.get("coupon", "") or "").upper() == "WELCOME":
                mark_welcome_used(notes.get("buyer_email", ""),
                                  notes.get("buyer_phone", ""),
                                  notes.get("order_id", pl.get("reference_id", "")))

            # Cart orders: log the VERIFIED-paid order to the Google Sheet
            if (notes.get("kind", "") == "cart") and APPS_SCRIPT_URL:
                order = {
                    "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
                    "order_id": notes.get("order_id", pl.get("reference_id", "")),
                    "category": "Product Store", "source": "Gemstone Shop Cart (verified)",
                    "payment_status": "Paid", "payment_id": payment_id,
                    "payment_method": "Razorpay payment link", "currency": "INR",
                    "customer": {
                        "name": notes.get("buyer_name", ""), "email": notes.get("buyer_email", ""),
                        "phone": notes.get("buyer_phone", ""), "address1": notes.get("address", ""),
                        "city": notes.get("city", ""), "state": notes.get("state", ""),
                        "pincode": notes.get("pincode", ""), "country": "India",
                    },
                    "item_summary": notes.get("items", ""),
                    "total": int(notes.get("amount", "0") or 0),
                    "shipping_country": "India",
                }
                log_order_to_sheet(order)
        except Exception:
            pass
    return {"ok": True}
