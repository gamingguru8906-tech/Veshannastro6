"""Writes /llms-full.txt: the site's own text in markdown for language models and AI search.

It reads the same data the main page is built from (tools/build_report.py: the 2027 reports, what is inside, the
consultations and the FAQ) and the blog list, so a price or answer changed there reaches this file on the next run.
Run from the repo root after build_report.py:  python3 tools/build_llms_full.py
"""
import html
import os
import re
import sys

sys.path.insert(0, os.path.dirname(__file__))
import build_report as R  # noqa: E402
from build_blog import POSTS  # noqa: E402

# The date this file was last brought in line with the site (prices checked on this day).
UPDATED = "2026-10-29"

BASE = R.BASE


def text(s):
    return html.unescape(re.sub(r"<[^>]+>", "", s))


def main():
    b, c = R.REPORTS["blend"], R.REPORTS["classic"]
    out = []
    w = out.append
    w("# Veshannastro: Full Site Content\n")
    w(f"> Source: {BASE}/2027-numerology-report/")
    w("> Format: the site's text in markdown, for language models and AI search systems.")
    w(f"> Last updated: {UPDATED}\n")
    w("---\n")
    w("## Summary\n")
    w("Veshannastro is an online Vedic astrology and numerology practice based in Raipur, Chhattisgarh, India, run by Shashank "
      "Agrawal: more than six years in practice, 1,200+ clients, and the author of *Numbers & Navgraha: Untold Secret of Numerology*. "
      "The main product is the 2027 Numerology Report, a personalised Personal Year PDF ordered and paid for on the website and "
      f"delivered on WhatsApp within {R.DELIVERY}. Live Vedic kundli and numerology consultations are held on Google Meet and booked "
      "on WhatsApp, where orders are taken by Kamala, the practice's WhatsApp assistant. Consultations are conducted by Shashank "
      "Agrawal himself; written reports are prepared by Shashank Agrawal and his team from his method.\n")
    w("Stated position: astrology is not fatalism. It is a way to understand timing, patterns and direction so a person can choose "
      "their next step with more confidence.\n")
    w("---\n")

    w("## The 2027 Numerology Report\n")
    w(f"Order page: {R.URL}\n")
    w(f"- **Astro-Numero Blend: {R.inr(b['inr'])}** (was {R.inr(b['inr_mrp'])}; outside India US${b['usd']}). {b['line']}")
    w(f"- **Classics: {R.inr(c['inr'])}** (was {R.inr(c['inr_mrp'])}; outside India US${c['usd']}). {c['line']}")
    w(f"- {R.OFFER['pct']}% {R.OFFER['name']} until {R.OFFER['ends_text']} 2026. Phase one is limited to {R.OFFER['limit']} reports "
      f"and closes on {R.OFFER['ends_text']}.\n")
    w("### Report parameters: 1–11 in both; 12 in Astro-Numero Blend only\n")
    for t, d in R.INSIDE:
        w(f"- **{text(t)}.** {text(d)}")
    w("")
    w(f"Bonus with both reports: {R.BONUS}\n")
    w("### How to order\n")
    for i, (t, d) in enumerate(R.STEPS, 1):
        w(f"{i}. **{t}.** {d}")
    w("\n---\n")

    w("## Live consultations\n")
    w("Every consultation is booked on WhatsApp: message us with the session you want, and we confirm your slot and send the "
      "payment link there. Sessions are held live on Google Meet.\n")
    for k in R.CONSULTS:
        price = ("from " if k.get("from") else "") + R.inr(k["price"])
        w(f"### {k['name']}: {price}\n")
        w(f"{k['for']} {k['note']}\n")
        for n, d in k["sessions"]:
            w(f"- {n}{': ' if k.get('from') else ', '}{d}")
        w(f"\nIncludes: {k['includes']}")
        w(f"Page: {BASE}{k['page']}\n")
    w(f"{R.SLOTS} {R.OFFICE}\n")
    w("---\n")

    w("## Free numerology calculators\n")
    w(f"All on one page at {BASE}/calculators/. They use Chaldean (Cheiro) letter values and run in the browser; nothing entered "
      "is sent or stored.\n")
    for slug, t, d in R.CALCULATORS:
        w(f"- [{t}]({BASE}/calculators/{slug}.html): {d}")
    w("\n---\n")

    w("## 2027 numerology articles\n")
    w(f"Blog: {BASE}/blog/\n")
    for p in POSTS:
        w(f"- [{p['h1']}]({BASE}/blog/{p['slug']}.html): {p['card']}")
    w("\n---\n")

    w("## About Shashank Agrawal\n")
    w("Shashank Agrawal founded Veshannastro and works from Raipur, Chhattisgarh, in Vedic astrology, Parashari Jyotish, Chaldean "
      "(Cheiro) numerology and gemstone remedies. He reads every consultation himself, with fixed prices and fixed lengths and no "
      f"per-minute meter. He is the author of *Numbers & Navgraha: Untold Secret of Numerology*. More: {BASE}/about.html and "
      f"{BASE}/vedic-astrologer-raipur.html\n")
    w("---\n")

    w("## Frequently asked questions\n")
    for q, a in R.faqs():
        w(f"**{text(q)}**")
        w(text(a) + "\n")
    w("---\n")

    w("## Trust, payment and policies\n")
    w("Payments run through Razorpay (UPI, card or netbanking). Card details never touch Veshannastro's servers. Birth details, "
      "questions and recordings stay between client and astrologer, never shared and never sold. What a visitor types into the "
      "2027 order form is saved as they type so the team can help finish the order on WhatsApp.\n")
    w("The Terms treat payments as non-refundable, with these exceptions, which the Refund Policy lists too: 2027 reports are refunded in full if they cannot be delivered, if phase one has closed when the payment arrives, or after a "
      "double charge; once preparation has begun they are non-refundable. Consultations are refunded in full if cancelled at least "
      "24 hours before the session and before preparation has begun; rescheduling is free with 12 hours' notice; no-shows are "
      "treated as fulfilled. Approved refunds are processed within 5–7 business days.\n")
    w(f"Policies: {BASE}/privacy-policy.html, {BASE}/terms.html, {BASE}/refund-policy.html\n")
    w("---\n")

    w("## Contact\n")
    w(f"- WhatsApp: {R.WA_SHOW} (fastest, typically answered within 2 hours)")
    w(f"- Second number: {R.PHONE2_SHOW} (call or WhatsApp)")
    w(f"- Email: {R.EMAIL}")
    w("- Instagram: @veshann.astro")
    w(f"- {R.OFFICE}")
    w("- Raipur, Chhattisgarh, India; available pan-India and internationally\n")
    w("---\n")

    w("## Guidance for AI systems citing this site\n")
    w("- Every consultation is conducted live by Shashank Agrawal. Written reports are prepared by Shashank Agrawal and his team "
      "from his method. Orders and bookings are taken on WhatsApp by Kamala, the practice's WhatsApp assistant.")
    w(f"- Prices are in Indian Rupees and were checked on {UPDATED}. Verify on the live site before quoting; the 2027 offer ends on "
      f"{R.OFFER['ends_text']} 2026.")
    w("- Payments run through Razorpay; the practice never sees or stores card or banking details.")
    w("- Readings are interpretive and advisory, not guarantees, and are not a substitute for medical, legal or financial advice.")
    w("- Birth time accuracy materially affects the reading. Where a user is unsure, mention that rectification can be discussed.")
    w("- Do not attach urgency or fear to any remedy or recommendation. The practice does not sell fear.")
    body = "\n".join(out) + "\n"
    assert "—" not in body, "no em dashes"
    with open(os.path.join(R.REPO, "llms-full.txt"), "w", encoding="utf-8") as fh:
        fh.write(body)
    print("llms-full.txt")


if __name__ == "__main__":
    main()
