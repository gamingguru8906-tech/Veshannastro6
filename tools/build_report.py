"""Builds the 2027 report page: /2027-numerology-report/index.html

Prices, offer dates and the payment switch live at the top of this file.
Run from the repo root:  python3 tools/build_report.py
"""
import json
import os
import re
import sys
from urllib.parse import quote

sys.path.insert(0, os.path.dirname(__file__))
from build_blog import POSTS  # noqa: E402

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
BASE = "https://www.veshannastro.co.in"
PATH = "/2027-numerology-report/"
URL = BASE + PATH

WA = "917646952745"
WA_SHOW = "+91 76469 52745"
EMAIL = "assist@veshannastro.co.in"
PHONE2 = "918827684725"
PHONE2_SHOW = "+91 88276 84725"
BOOK = "https://amzn.in/d/05h90t9v"
ADDRESS = {"street": "Currency Tower, G.E. Road, VIP Road", "city": "Raipur", "region": "Chhattisgarh", "postal": "492001", "country": "IN"}

# Prices after the 30% Diwali offer, and the original price shown struck through.
REPORTS = {
    "blend": {"name": "Astro-Numero Blend", "inr": 599, "inr_mrp": 856, "usd": 30, "usd_mrp": 43, "needs_time": True,
              "line": "Numerology and astrology read together. Needs your time of birth."},
    "classic": {"name": "Classic", "inr": 499, "inr_mrp": 713, "usd": 20, "usd_mrp": 29, "needs_time": False,
                "line": "Numerology from your name and date of birth. No birth time needed."},
}
OFFER = {"pct": 30, "name": "Diwali offer", "starts": "2026-10-24", "ends": "2026-11-10", "ends_text": "10 November", "limit": 50}
DELIVERY = "24 hours"
# Pay on the page through Razorpay (api/r27). If the server is not set up or the order cannot be made online,
# the page falls back to the WhatsApp order on its own, so nothing breaks.
ONLINE_PAY = True
# Google Ads purchase conversion label (the part after the slash in AW-18189866057/LABEL). Empty: not sent.
ADS_PURCHASE_LABEL = ""
# Pay in US dollars on the page. Needs international payments on in Razorpay and R27_USD=on in Vercel.
# Off: buyers outside India send their order on WhatsApp.
USD_ONLINE = False
# Phase one closes at the end of this day, India time.
CLOSES_AT = OFFER["ends"] + "T23:59:59+05:30"

ORDER_MSG = "Hi Veshannastro, I would like to order the 2027 Personal Year Report."
BULK_MSG = "Hi Veshannastro, I would like 2027 reports for more than one person."
ASK_MSG = "Hi Veshannastro, I have a question about the 2027 report."


def page_css():
    """The page's four stylesheets inlined into one <style>, so nothing blocks the first paint. The files in
    assets/r27 stay the source: edit them and rebuild. Only this page uses them."""
    out = []
    for name in ("styles.css", "sections.css", "report.css", "motion.css"):
        with open(os.path.join(REPO, "assets", "r27", name), encoding="utf-8") as fh:
            css = re.sub(r"/\*.*?\*/", "", fh.read(), flags=re.S)
        out.append(re.sub(r"\s*\n\s*", " ", re.sub(r"[ \t]+", " ", css)).strip())
    return "".join(out)


def wa(text):
    return f"https://wa.me/{WA}?text={quote(text)}"


def blur_report_amounts(value):
    return re.sub(r"₹[\d,]+|US\$[\d,]+", lambda m: reveal_price(m.group()), value)

def reveal_price(content, extra_class=""):
    return ('<button type="button" class="price-reveal ' + extra_class + '" aria-label="Reveal report prices" aria-expanded="false">'
            '<span class="price-value" aria-hidden="true">' + content + '</span><span class="price-hint">Tap to reveal</span></button>')


def inr(n):
    s = str(n)
    return "₹" + (s[:-3] + "," + s[-3:] if len(s) > 3 else s)


ICON_WA = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm4.52 11.99c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.17.25-.64.81-.78.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.43-.06-.13-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.42h-.48c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.23-.16-.48-.29Z"/></svg>'
ICON_CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>'
ICON_CLOCK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>'
ICON_STAR = '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 1 18.9 13.1 31 16 18.9 18.9 16 31 13.1 18.9 1 16 13.1 13.1Z" fill="#cfe2ff"/></svg>'

INSIDE = [
    ("Your Personal Year and zodiac reading", "A chapter written for your exact Personal Year and sun sign: your home, work, money, relationships and health in 2027, with a personal note from Shashank."),
    ("Your numbers, worked out", "Your Personal Year, Mulank and Bhagyank, with every step of the calculation shown so you can see where each number comes from."),
    ("All 12 months, one page each", "Which months are favourable and which ask for care, what each one means for you, the full-moon date and a simple remedy to follow."),
    ("Muhurat, lucky and power dates", "Auspicious dates for every month from the Hindu Panchang, plus the dates that line up with your birth weekday and Personal Month."),
    ("Your 2027 Lo Shu grid", "Your date of birth plotted on the Lo Shu grid with your destiny number added and your 2027 Personal Year marked, so you can see where this year's energy sits in your chart."),
    ("Your crystal for 2027", "The bracelet crystal suited to your Mulank this year, and why it was chosen for you."),
    ("Name Number and Pinnacles", "How the world experiences your name, whether it is aligned with your date of birth, and the life chapter you are living through right now."),
    ("A voice note from Shashank", "Scan the QR code in your report to hear 30 to 60 seconds from Shashank on your year: its strengths, its cautions, what to do and what to avoid."),
]

PLAN_ITEMS = {
    "blend": ["Everything in Classic", "Read together with astrology from your birth chart", "Needs your date, time and place of birth"],
    "classic": ["Your Personal Year, Mulank, Bhagyank and Lo Shu grid", "All 12 months of 2027 with muhurat dates and remedies", "Needs your name, date and place of birth"],
}
PLAN_COMMON = ["Your crystal, Name Number and Pinnacles", "Voice note from Shashank (QR code)", f"PDF on WhatsApp within {DELIVERY}"]

STEPS = [
    ("Choose your report", "Pick Astro-Numero Blend or Classic and add your birth details. One report is made for one person."),
    ("Pay the energy exchange", "Pay online by UPI, card or netbanking, or message us on WhatsApp if you would like to talk first."
     if ONLINE_PAY else "Send your details to us on WhatsApp. We confirm them and share the payment link in the same chat."),
    ("Receive your report", f"Your personalised PDF arrives on WhatsApp within {DELIVERY}, with the QR code to your voice note inside."),
]


# Live consultations, booked on WhatsApp only. Prices are the ones on the two consultation pages.
CONSULTS = [
    {"id": "kundli-consultation", "label": "Vedic astrology", "name": "Vedic Kundli Consultation", "page": "/vedic-kundli-booking.html",
     "for": "Your birth chart read live: graha, bhava and dasha for one life area, with practical upaya.",
     "price": 2249, "was": 2999, "off": 25, "note": "40 to 45 minutes on Google Meet. A focused 20-minute session is ₹1,874.",
     "sessions": [("The Dhan Matrix", "wealth and money flow"), ("Prana Vitality Blueprint", "health and energy"),
                  ("The Worklife Blueprint", "career and timing"), ("The Union Code", "love and marriage"),
                  ("Jeevan 360 Reading", "the whole life path")],
     "includes": "Kundli PDF report 2 to 3 days after the session, the recording, a numerology layer and a week of follow-up.",
     "msg": "Namaste, I would like to book a Vedic Kundli consultation."},
    {"id": "numerology-consultation", "label": "Numerology", "name": "Numerology Consultation", "page": "/numerology-booking.html",
     "for": "A focused diagnosis of your number signature, with correction guidance you can act on.",
     "price": 824, "was": 1099, "off": 25, "from": True, "note": "20 minutes on Google Meet, with a PDF report and the recording.",
     "sessions": [("The Lo Shu Life Matrix", "₹1,124"), ("Name Frequency Alignment", "₹974"), ("Mobile Number Energy Audit", "₹824")],
     "includes": "Detailed PDF numerology report, the recording, the invoice and personal correction guidance.",
     "msg": "Namaste, I would like to book a Numerology consultation."},
]
SLOTS = "Session start times: Monday to Friday 7:30 to 9:30 PM IST, Saturday and Sunday 10 AM to 7 PM IST."
OFFICE = "Office hours are 10 AM to 8 PM IST, every day."

# Every other page on the site, linked from the Explore tabs so each one is a click from the main page.
CALCULATORS = [
    ("life-path-number", "Life Path Number Calculator", "The core number from your date of birth."),
    ("lo-shu-grid", "Lo Shu Grid Calculator", "Your 3x3 grid, with missing and repeated numbers."),
    ("lucky-number", "Lucky Number Calculator", "Your personal number from the date of birth."),
    ("lucky-colour", "Lucky Colour Calculator", "Your colour through your ruling planet."),
    ("main-planet-number", "Ruling Planet Calculator", "Which of the nine planets governs your number."),
    ("name-numerology", "Name Numerology Calculator", "The Chaldean vibration of the name you use."),
    ("destiny-number", "Destiny Number Calculator", "Your expression number from the full name."),
    ("compound-destiny", "Compound Number Calculator", "The two-digit number behind the single digit."),
    ("lucky-business-name", "Business Name Numerology Calculator", "The vibration a brand name projects."),
    ("lucky-mobile-number", "Lucky Mobile Number Calculator", "The total vibration of your phone number."),
    ("lucky-house-number", "House Number Numerology Calculator", "House and flat numbers, letters included."),
    ("vehicle-number", "Vehicle Number Calculator", "Indian registration plates, letters included."),
    ("lucky-bank-account", "Bank Account Number Calculator", "The financial vibration of an account number."),
]
# The calculator dock in Explore: three groups, a line icon for each calculator (24px, stroke = currentColor).
CALC_ICONS = {
    "life-path-number": '<path d="M4 19c4-1 3-6 8-7s4-6 8-7"/><circle cx="4" cy="19" r="1.6"/><circle cx="20" cy="5" r="1.6"/>',
    "lo-shu-grid": '<rect x="4" y="4" width="16" height="16" rx="1.5"/><path d="M9.3 4v16M14.7 4v16M4 9.3h16M4 14.7h16"/>',
    "lucky-number": '<path d="M12 3l1.9 7.1L21 12l-7.1 1.9L12 21l-1.9-7.1L3 12l7.1-1.9Z"/>',
    "lucky-colour": '<circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16Z" fill="currentColor" stroke="none" opacity=".55"/>',
    "main-planet-number": '<circle cx="12" cy="12" r="4.5"/><ellipse cx="12" cy="12" rx="10" ry="3.6" transform="rotate(-20 12 12)"/>',
    "name-numerology": '<path d="M4 18 8.5 6 13 18M5.8 14h5.4"/><path d="M15 11.5a3 3 0 1 1 0 6.5h0a3 3 0 0 1 0-6.5h4V18"/>',
    "destiny-number": '<circle cx="12" cy="12" r="8.5"/><path d="m15.5 8.5-2 5-5 2 2-5Z"/>',
    "compound-destiny": '<circle cx="9.5" cy="12" r="5.5"/><circle cx="14.5" cy="12" r="5.5"/>',
    "lucky-business-name": '<rect x="3.5" y="7.5" width="17" height="12" rx="2"/><path d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5M3.5 12.5h17"/>',
    "lucky-mobile-number": '<rect x="7" y="3" width="10" height="18" rx="2.2"/><path d="M11 17.5h2"/>',
    "lucky-house-number": '<path d="M4 11 12 4l8 7v9H4Z"/><path d="M10 20v-5h4v5"/>',
    "vehicle-number": '<path d="M5 16V11l2-4.5h10L19 11v5"/><rect x="3.5" y="11" width="17" height="5" rx="1.5"/><circle cx="7.5" cy="18" r="1.5"/><circle cx="16.5" cy="18" r="1.5"/>',
    "lucky-bank-account": '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18M7 14.5h4"/>',
}
CALC_GROUPS = [
    ("From your date of birth", ["life-path-number", "lo-shu-grid", "lucky-number", "lucky-colour", "main-planet-number"]),
    ("From your name", ["name-numerology", "destiny-number", "compound-destiny", "lucky-business-name"]),
    ("Numbers you use", ["lucky-mobile-number", "lucky-house-number", "vehicle-number", "lucky-bank-account"]),
]
# The five Vedic sessions, in the words of the kundli booking page (shortened).
SESSION_DETAILS = [
    ("The Dhan Matrix", "Dhana Bhava · Artha · Lakshmi Flow",
     "Where your money comes from, where it quietly leaks, how strong your wealth potential is, and which phases can bring real financial growth."),
    ("Prana Vitality Blueprint", "Ayur Bhava · Prana · Stability",
     "Your overall health strength, the vulnerable areas and recovery patterns, with remedies for steadier energy and inner calm."),
    ("The Worklife Blueprint", "Karma Bhava · Dasha · Profession",
     "Your strongest professional path, hidden career blocks, job or business suitability and the growth phases ahead."),
    ("The Union Code", "Saptama Bhava · Vivaha · Harmony",
     "Compatibility, marriage timing, emotional bonding and long-term stability, with clear guidance for peace in the relationship."),
    ("Jeevan 360 Reading", "Dharma · Karma · Jeevan Marga",
     "An overall reading of your growth, purpose, relationships, obstacles and direction, and why certain patterns keep repeating."),
]
ABOUT_LINKS = [
    ("/about.html", "About Shashank Agrawal", "Six years of practice, the method and the books."),
    ("/vedic-astrologer-raipur.html", "Vedic astrologer in Raipur", "Kundli and numerology readings from Raipur, Chhattisgarh."),
    ("/contact.html", "Contact", "WhatsApp, phone, email and office hours."),
    ("/privacy-policy.html", "Privacy policy", "What we keep and why."),
    ("/terms.html", "Terms and conditions", "Booking, payment and delivery terms."),
    ("/refund-policy.html", "Refund and delivery policy", "Cancellations, rescheduling and refunds."),
]


def faqs():
    b, c = REPORTS["blend"], REPORTS["classic"]
    pay = ("Buy your 2027 numerology report online on this page by UPI, card or netbanking. If you would like to talk first, message us on WhatsApp and pay from there."
           if ONLINE_PAY else "Send your details from this page to WhatsApp. We confirm them and send a secure payment link (UPI, card or netbanking) in the same chat.")
    return [
        ("What is the 2027 numerology report price in India?",
         f"The Astro-Numero Blend is {inr(b['inr'])} (was {inr(b['inr_mrp'])}) and the Classic is {inr(c['inr'])} (was {inr(c['inr_mrp'])}), with the {OFFER['pct']}% {OFFER['name']} until {OFFER['ends_text']}. Outside India they are US${b['usd']} and US${c['usd']}."),
        ("What is the difference between Astro-Numero Blend and Classic?",
         "Classic is a numerology report built from your name and date of birth. Astro-Numero Blend reads your numerology together with astrology from your birth chart, so it also needs your time of birth."),
        ("Is this a generic yearly horoscope?",
         "No. Your Personal Year, Mulank, Lo Shu grid and Name Number come from your own date of birth and name, and Chapter 1 is written for your exact Personal Year and sun sign combination. Two people rarely get the same report."),
        ("I don't know my time of birth. Can I still get it?",
         "Yes. Choose Classic. It is built from your date of birth and your name, so your birth time is not needed. The Astro-Numero Blend needs your time of birth."),
        ("Is the 2027 numerology report a PDF, and when will I receive it?",
         f"Yes. Your 2027 numerology report PDF arrives on your WhatsApp within {DELIVERY} of payment. Inside is a QR code that opens a 30 to 60 second voice note from Shashank about your year."),
        ("What is a 2027 astro numero report?",
         "It is a report that reads numerology and astrology together. Our 2027 astro numero report is the Astro-Numero Blend: your numbers read alongside your birth chart, which is why it needs your time of birth."),
        ("Does it include a 2027 Lo Shu grid report?",
         "Yes. Every report has a 2027 Lo Shu grid report page: your date of birth plotted on the grid with your destiny number added and your 2027 Personal Year marked."),
        ("How do I pay?", pay),
        ("What if my report does not arrive?",
         f"If your report has not reached you within {DELIVERY} of payment, message us on WhatsApp with your payment reference. We send it straight away, or refund you in full if we cannot deliver it. The <a href=\"/refund-policy.html\">refund and delivery policy</a> has the details."),
        ("Can I order for my family or more than one person?",
         "Each order on this page is for one person, because each personalized 2027 numerology report is built from one date of birth. For two or more people, message us on WhatsApp and we will arrange it."),
        ("How do I choose the best 2027 numerology report?",
         "Look for one built from your own date of birth and name rather than your sun sign alone, that shows how each number is worked out, reads every month of 2027 and tells you who prepared it. A detailed numerology report for 2027 should also give remedies you can act on."),
        ("Is there a free 2027 numerology report?",
         "The Personal Year calculator on this page is free and tells you the number your year is read through. The full report, with every month, your dates, Lo Shu grid and voice note, is paid. You can also read free <a href=\"/blog/2027-numerology-predictions.html\">2027 numerology predictions</a> on our blog."),
        ("Does it replace a full birth chart consultation?",
         "No. Your Mahadasha, Antardasha and Saturn cycles are read live in a separate <a href=\"/vedic-kundli-booking.html\">Vedic kundli consultation</a> with Shashank, booked on WhatsApp."),
        ("Do you offer live astrology and numerology consultations?",
         "Yes. Shashank reads Vedic kundli live in 40 to 45 minutes for ₹2,249 and numerology in 20 minutes from ₹824, both on Google Meet. Every consultation is booked on WhatsApp. See the <a href=\"/vedic-kundli-booking.html\">Vedic kundli consultation</a> and the <a href=\"/numerology-booking.html\">numerology consultation</a>."),
        ("Are there free numerology calculators?",
         "Yes. Thirteen free calculators, from Life Path and the Lo Shu grid to mobile, house and vehicle numbers, are on the <a href=\"/calculators/\">numerology calculators page</a>. They use Chaldean (Cheiro) letter values and run in your browser."),
        ("Who is Shashank Agrawal?",
         "Shashank Agrawal is a Raipur-based Vedic astrologer and numerologist with more than six years of practice and the author of Numbers &amp; Navgraha: Untold Secret of Numerology. Read <a href=\"/about.html\">about Shashank</a> or about his work as a <a href=\"/vedic-astrologer-raipur.html\">Vedic astrologer in Raipur</a>."),
        (f"Why is phase one limited to {OFFER['limit']} reports?",
         f"Every report is prepared for one person by Shashank and his team. Phase one takes {OFFER['limit']} reports and closes on {OFFER['ends_text']}."),
    ]


def esc(s):
    import html
    return html.escape(s, quote=True)


def page():
    b, c = REPORTS["blend"], REPORTS["classic"]
    F = faqs()
    inside = "".join(f'<li><span class="chapter-number">{i + 1:02d}</span><div><h3>{t}</h3><p>{d}</p></div></li>' for i, (t, d) in enumerate(INSIDE))
    # One figure per cover design. Mulank 3, 5, 6 and 9 share a cover, so it is shown once.
    designs = [(1, "Mulank 1"), (2, "Mulank 2"), (4, "Mulank 4"), (6, "Mulank 3, 5, 6 and 9"), (7, "Mulank 7"), (8, "Mulank 8")]
    covers = "".join(
        f'<figure style="--r:{(i - 2.5) * 5:g}deg;--y:{abs(i - 2.5) * 10:g}px;--z:{10 - int(abs(i - 2.5) * 2)}"><img src="/assets/r27/covers/mulank-{n}.webp" width="360" height="640" alt="2027 Personal Year Forecast cover for {label}" loading="lazy"><figcaption>{label}</figcaption></figure>'
        for i, (n, label) in enumerate(designs))
    steps = "".join(f'<li><span class="step-number">{i + 1}</span><h3>{t}</h3><p>{d}</p></li>' for i, (t, d) in enumerate(STEPS))
    # Countdown to the end of phase one (motion.js fills the numbers and hides it once the offer has ended).
    cd_tiles = "".join(f'<div class="cd-tile"><b data-u="{u}">00</b><span>{n}</span></div>'
                       for u, n in (("d", "days"), ("h", "hours"), ("m", "minutes"), ("s", "seconds")))

    def plan(key, featured):
        r = REPORTS[key]
        items = "".join(f"<li>{ICON_CHECK}<span>{x}</span></li>" for x in PLAN_ITEMS[key] + PLAN_COMMON)
        return f"""<article class="plan{' featured' if featured else ''}">
<span class="plan-label">{'Selected by default' if featured else 'No birth time needed'}</span>
<h3>{r['name']}</h3><p class="plan-for">{r['line']}</p>
<p class="plan-price">{reveal_price('<b>' + inr(r['inr']) + '</b> <s>' + inr(r['inr_mrp']) + '</s>')}<span class="offer-tag">{OFFER['pct']}% off</span></p>
<p class="plan-usd">Outside India: {reveal_price("US$" + str(r['usd']) + " <s>US$" + str(r['usd_mrp']) + "</s>")}</p>
<ul>{items}</ul>
<a class="pill get-report" href="#register" data-pick="{key}"><span>Choose {r['name']}</span></a>
</article>"""

    reads = "".join(f'<a href="/blog/{p["slug"]}.html"><strong>{p["h1"]}</strong><span>{p["card"]}</span></a>' for p in POSTS)
    faq_html = "".join(f'<details><summary>{q}<span class="faq-icon" aria-hidden="true"></span></summary><p>{blur_report_amounts(a) if q == F[0][0] else a}</p></details>' for q, a in F)

    def consult(c):
        rows = "".join(f'<li>{ICON_CHECK}<span><b>{n}</b>{", " if not c.get("from") else ": "}{d}</span></li>' for n, d in c["sessions"])
        return f"""<article class="plan consult" id="{c['id']}">
<span class="plan-label">{c['label']}</span>
<h3>{c['name']}</h3><p class="plan-for">{c['for']}</p>
<p class="plan-price"><b>{'from ' if c.get('from') else ''}{inr(c['price'])}</b><s>{inr(c['was'])}</s><span class="offer-tag">{c['off']}% off</span></p>
<p class="plan-usd">{c['note']}</p>
<ul>{rows}</ul>
<p class="consult-includes">{c['includes']}</p>
<div class="consult-actions"><a class="wa-btn" href="{wa(c['msg'])}" target="_blank" rel="noopener">{ICON_WA}<span>Contact us on WhatsApp</span></a><a class="ghost" href="{c['page']}">See all sessions <span aria-hidden="true">&rarr;</span></a></div>
</article>"""
    consults = "".join(consult(c) for c in CONSULTS)

    def link_list(items):
        return "".join(f'<a href="{h}"><strong>{t}</strong><span>{d}</span></a>' for h, t, d in items)
    explore_tabs = [
        ("explore-calculators", "Free calculators", [("/calculators/", "All numerology calculators", "Thirteen calculators on one page, Chaldean values.")]
         + [(f"/calculators/{slug}.html", t, d) for slug, t, d in CALCULATORS]),
        ("explore-consultations", "Consultations", [(c["page"], c["name"], c["for"]) for c in CONSULTS]
         + [("/vedic-astrologer-raipur.html", "Astrologer in Raipur", "Consultations for Raipur, Bhilai, Durg and all of Chhattisgarh.")]),
        ("explore-about", "About and policies", ABOUT_LINKS),
    ]
    tab_buttons = "".join(f'<button type="button" role="tab" id="{i}-tab" aria-controls="{i}" aria-selected="{"true" if n == 0 else "false"}">{label}</button>'
                          for n, (i, label, _) in enumerate(explore_tabs))
    calc_by_slug = {slug: (t, d) for slug, t, d in CALCULATORS}

    def dock_card(slug, first):
        t, d = calc_by_slug[slug]
        short = t.replace(" Numerology Calculator", "").replace(" Calculator", "")
        return (f'<a class="dock-card{" is-open" if first else ""}" href="/calculators/{slug}.html">'
                f'<svg class="dock-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{CALC_ICONS[slug]}</svg>'
                f'<span class="dock-body"><strong>{short}</strong><span>{d}</span><em>Open<span aria-hidden="true"> &rarr;</span></em></span></a>')
    docks = "".join(f'<div class="dock-group"><p class="dock-title">{title}</p><div class="dock">'
                    + "".join(dock_card(slug, n == 0) for n, slug in enumerate(slugs)) + '</div></div>' for title, slugs in CALC_GROUPS)
    docks += '<p class="dock-all"><a href="/calculators/">All numerology calculators on one page</a></p>'

    def panel(i, items):
        if i == "explore-calculators":
            return f'<div class="explore-panel calc-docks" role="tabpanel" id="{i}" aria-labelledby="{i}-tab">{docks}</div>'
        return f'<div class="explore-panel read-list" role="tabpanel" id="{i}" aria-labelledby="{i}-tab">{link_list(items)}</div>'
    tab_panels = "".join(panel(i, items) for i, _, items in explore_tabs)

    # The five Vedic sessions, pinned while you scroll on wide screens (a plain list everywhere else).
    vedic = CONSULTS[0]
    ON = ' class="on"'
    sessions_list = "".join(f'<li data-i="{n}"{ON if n == 0 else ""}><span class="ss-num">{n + 1:02d}</span><span class="ss-name">{name}</span><span class="ss-tag">{tag}</span></li>'
                            for n, (name, tag, _) in enumerate(SESSION_DETAILS))
    sessions_detail = "".join(
        f'<article data-i="{n}"{ON if n == 0 else ""}><h3><span class="ss-num">{n + 1:02d}</span> {name}</h3><p class="ss-tag">{tag}</p><p>{desc}</p>'
        f'<p class="ss-meta">{inr(vedic["price"])}, 40 to 45 minutes live on Google Meet</p>'
        f'<a class="ss-book" href="{wa("Namaste, I would like to book " + name + " (Vedic Kundli consultation).")}" target="_blank" rel="noopener">Book {name} on WhatsApp<span aria-hidden="true"> &rarr;</span></a></article>'
        for n, (name, tag, desc) in enumerate(SESSION_DETAILS))
    sessions_steps = "<i></i>" * len(SESSION_DETAILS)

    import re
    strip = lambda s: re.sub(r"<[^>]+>", "", s)
    org = {"@type": "Organization", "@id": BASE + "/#organization", "name": "Veshannastro", "url": BASE + "/",
           "logo": BASE + "/images/logo.png", "email": EMAIL, "telephone": WA_SHOW.replace(" ", ""),
           "contactPoint": [{"@type": "ContactPoint", "contactType": "customer service", "telephone": WA_SHOW.replace(" ", ""), "email": EMAIL,
                             "availableLanguage": ["English", "Hindi"]},
                            {"@type": "ContactPoint", "contactType": "customer service", "telephone": PHONE2_SHOW.replace(" ", ""),
                             "availableLanguage": ["English", "Hindi"]}],
           "address": {"@type": "PostalAddress", "streetAddress": ADDRESS["street"], "addressLocality": ADDRESS["city"],
                       "addressRegion": ADDRESS["region"], "postalCode": ADDRESS["postal"], "addressCountry": ADDRESS["country"]},
           "founder": {"@type": "Person", "@id": BASE + "/#shashank", "name": "Shashank Agrawal", "url": BASE + "/about.html"},
           "image": BASE + "/images/logo.png",
           "sameAs": ["https://www.instagram.com/veshann.astro"]}

    # Optional offer fields Google's Rich Results Test asks for: the report is a PDF sent on WhatsApp (no shipping cost,
    # within a day), and digital reports are not returnable (refunds only as the refund policy says).
    abroad = ["US", "GB", "AE", "CA", "AU", "SG"]
    def offer(price, currency, countries):
        return {"@type": "Offer", "price": str(price), "priceCurrency": currency, "validFrom": OFFER["starts"], "priceValidUntil": OFFER["ends"],
                "availability": "https://schema.org/LimitedAvailability", "url": URL + "#register", "seller": {"@id": BASE + "/#organization"},
                "shippingDetails": {"@type": "OfferShippingDetails",
                                    "shippingRate": {"@type": "MonetaryAmount", "value": "0", "currency": currency},
                                    "shippingDestination": [{"@type": "DefinedRegion", "addressCountry": c} for c in countries],
                                    "deliveryTime": {"@type": "ShippingDeliveryTime",
                                                     "handlingTime": {"@type": "QuantitativeValue", "minValue": 0, "maxValue": 1, "unitCode": "DAY"},
                                                     "transitTime": {"@type": "QuantitativeValue", "minValue": 0, "maxValue": 0, "unitCode": "DAY"}}},
                "hasMerchantReturnPolicy": {"@type": "MerchantReturnPolicy", "applicableCountry": countries,
                                            "returnPolicyCategory": "https://schema.org/MerchantReturnNotPermitted",
                                            "merchantReturnLink": BASE + "/refund-policy.html"}}

    def product(key):
        r = REPORTS[key]
        return {"@type": "Product", "@id": URL + "#" + key, "name": f"2027 Personal Year Forecast Report: {r['name']}",
                "description": f"Personalised 2027 numerology report PDF. {r['line']} Delivered within {DELIVERY}.",
                "image": BASE + "/assets/r27/book/cover.webp", "brand": {"@type": "Brand", "name": "Veshannastro"}, "category": "Numerology report",
                "offers": [offer(r["inr"], "INR", ["IN"]), offer(r["usd"], "USD", abroad)]}

    graph = {"@context": "https://schema.org", "@graph": [
        org,
        {"@type": "WebSite", "@id": BASE + "/#website", "url": BASE + "/", "name": "Veshannastro", "publisher": {"@id": BASE + "/#organization"}},
        {"@type": "WebPage", "@id": URL + "#webpage", "url": URL, "name": "2027 Numerology Report", "isPartOf": {"@id": BASE + "/#website"}, "inLanguage": "en-IN",
         "breadcrumb": {"@id": URL + "#breadcrumb"}},
        {"@type": "BreadcrumbList", "@id": URL + "#breadcrumb", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Veshannastro", "item": BASE + "/"},
            {"@type": "ListItem", "position": 2, "name": "2027 Numerology Report", "item": URL}]},
        product("blend"), product("classic"),
        *[{"@type": "Service", "@id": BASE + c["page"] + "#service", "name": c["name"], "url": BASE + c["page"], "provider": {"@id": BASE + "/#organization"},
           "areaServed": "IN", "description": c["for"],
           "offers": {"@type": "Offer", "price": str(c["price"]), "priceCurrency": "INR", "url": BASE + c["page"]}} for c in CONSULTS],
        {"@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": strip(q), "acceptedAnswer": {"@type": "Answer", "text": strip(a)}} for q, a in F]},
    ]}
    config = {"wa": WA, "online": ONLINE_PAY, "ads": ("AW-18189866057/" + ADS_PURCHASE_LABEL) if ADS_PURCHASE_LABEL else "", "usdOnline": USD_ONLINE, "delivery": DELIVERY, "offerEnds": OFFER["ends"], "reports": REPORTS}

    title = "2027 Numerology Report: Personal Year Forecast | Veshannastro"
    desc = (f"Buy your 2027 numerology report online: Personal Year forecast, Lo Shu grid, all 12 months and muhurat dates. "
            f"PDF in {DELIVERY}, from {inr(c['inr'])}.")
    return f"""<!doctype html>
<html lang="en-IN">
<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{title}</title>
  <meta name="description" content="{esc(desc)}">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <link rel="canonical" href="{URL}">
  <meta name="theme-color" content="#04050b">
  <meta property="og:type" content="website"><meta property="og:site_name" content="Veshannastro"><meta property="og:locale" content="en_IN">
  <meta property="og:title" content="{title}"><meta property="og:description" content="{esc(desc)}"><meta property="og:url" content="{URL}">
  <meta property="og:image" content="{BASE}/assets/r27/og.jpg"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="{BASE}/assets/r27/og.jpg">
  <link rel="icon" href="/favicon.ico" sizes="any"><link rel="icon" href="/favicon-32.png" type="image/png" sizes="32x32"><link rel="apple-touch-icon" href="/apple-touch-icon.png"><link rel="manifest" href="/site.webmanifest">
  <link rel="preload" href="/assets/fonts/manrope-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" as="image" href="/assets/r27/hero-moon.webp" imagesrcset="/assets/r27/hero-moon-860.webp 860w, /assets/r27/hero-moon.webp 1280w" imagesizes="(max-width: 700px) 860px, 100vw" fetchpriority="high">
  <style>{page_css()}</style>
  <script>(function(d){{if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;d.documentElement.classList.add("motion");setTimeout(function(){{if(!window.__motionReady)d.documentElement.classList.remove("motion")}},3500)}})(document)</script>
  <!-- Google tag: loads on the first tap, key or scroll, or 6 seconds after load, so it never slows the first paint. Events queue in dataLayer until then. --><script>(function(w,d){{var ev=["pointerdown","keydown","touchstart","scroll"],done=0;function go(){{if(done)return;done=1;ev.forEach(function(e){{w.removeEventListener(e,go,{{passive:true}})}});var s=d.createElement("script");s.async=true;s.src="https://www.googletagmanager.com/gtag/js?id=G-R20FKYJK7P";d.head.appendChild(s)}}ev.forEach(function(e){{w.addEventListener(e,go,{{passive:true}})}});w.addEventListener("load",function(){{setTimeout(go,6000)}})}})(window,document)</script>
  <script>window.dataLayer=window.dataLayer||[];function gtag(){{dataLayer.push(arguments);}}gtag('js',new Date());gtag('config','G-R20FKYJK7P');gtag('config','AW-18189866057');</script>
  <script type="application/ld+json">{json.dumps(graph, ensure_ascii=False, separators=(",", ":"))}</script>
  <script>window.R27={json.dumps(config, separators=(",", ":"))};</script>
  <script src="/assets/r27/report.js?v=16" defer></script><script src="/assets/r27/motion.js?v=6" defer></script><script src="/assets/r27/book.js?v=11" defer></script>
</head>
<body>
  <svg class="fx-defs" width="0" height="0" aria-hidden="true" focusable="false"><filter id="morph-threshold"><feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 255 -140"/></filter></svg>
  <div class="nebula" aria-hidden="true"></div><canvas class="sky" id="star-field" aria-hidden="true"></canvas>
  <div class="grain" aria-hidden="true"></div><div class="vignette" aria-hidden="true"></div><div class="progress" aria-hidden="true"></div>
  <header class="topbar">
    <a class="brand" href="{PATH}" aria-label="VESHANNASTRO home"><b>VESHANNASTRO</b></a>
    <nav class="nav-links" aria-label="Main navigation"><a href="#inside">Inside</a><a href="#finder">Your Year</a><a href="#pricing">Reports</a><a href="#services">Consultations</a><a href="/blog/">Blog</a><a href="#faq">FAQ</a></nav>
    <a class="pill pill-nav" href="#register">Get your report</a>
    <button class="burger" aria-label="Open menu" aria-expanded="false" aria-controls="mobile-menu"><i></i><i></i></button>
  </header>
  <nav class="mobile-menu" id="mobile-menu" aria-label="Mobile navigation" inert>
    <div class="wrap"><ul><li><a href="#inside">Inside</a></li><li><a href="#finder">Your Year</a></li><li><a href="#pricing">Reports</a></li><li><a href="#services">Consultations</a></li><li><a href="/calculators/">Calculators</a></li><li><a href="/blog/">Blog</a></li><li><a href="#faq">FAQ</a></li></ul>
    <div class="menu-foot"><a class="pill" href="#register">Get your report</a><a class="ghost" href="{wa(ASK_MSG)}" target="_blank" rel="noopener">Ask on WhatsApp</a></div></div>
  </nav>
  <main>
    <section class="hero" id="register" aria-labelledby="hero-title">
      <div class="hero-background" aria-hidden="true"><div class="hero-pin has-photo"><img class="hero-photo" src="/assets/r27/hero-moon.webp" srcset="/assets/r27/hero-moon-860.webp 860w, /assets/r27/hero-moon.webp 1280w" sizes="(max-width: 700px) 860px, 100vw" width="1280" height="558" alt="Full moon rising over a mountain lake at night" fetchpriority="high"><div class="moon-orbit"></div><div class="hero-shade"></div></div></div>
      <div class="hero-tags" aria-hidden="true"><span style="--x:8%;--y:34vh;--r:-7deg;--t:0s">Mulank</span><span style="--x:83%;--y:27vh;--r:6deg;--t:-2.6s">Bhagyank</span><span style="--x:10%;--y:70vh;--r:5deg;--t:-4.2s">Lo Shu Grid</span><span style="--x:81%;--y:64vh;--r:-5deg;--t:-1.3s">Personal Year</span></div>
      <h1 id="hero-title" class="stagger"><span class="sw" style="--i:0">2027</span> <span class="sw" style="--i:1">Numerology</span> <span class="sw" style="--i:2">Report</span> <br><span class="sw" style="--i:3">Personal</span> <span class="sw" style="--i:4">Year</span> <span class="sw" style="--i:5">Forecast</span> <small class="sw" style="--i:6">by Shashank Agrawal</small></h1>
      <div class="form-card">
        <div class="form-card-head"><span class="report-mark">{ICON_STAR}Phase one, {OFFER['limit']} reports</span><h2>Get your 2027 Report</h2>
          <p class="form-lead">What 2027 holds for your health, money, work and relationships, and the remedies for whatever needs care. Prepared for you alone.</p>
          <p class="form-note">Your details are saved as you type, so we can help you finish your order on WhatsApp. <a href="/privacy-policy.html" target="_blank">Privacy</a></p></div>
        <form id="registration" novalidate>
          <div class="subject-toggle report-toggle" role="radiogroup" aria-label="Choose your report">
            <button type="button" role="radio" aria-checked="true" data-report="blend">Astro-Numero Blend</button><button type="button" role="radio" aria-checked="false" data-report="classic">Classic</button></div>
          <div class="price-box" aria-live="polite"><span class="pb-label">Energy exchange</span>{reveal_price('<b id="pb-now">' + inr(b['inr']) + '</b>', "pb-now")}
            <span class="pb-was">{reveal_price('<s id="pb-was">' + inr(b['inr_mrp']) + '</s>')} <span class="offer-tag">{OFFER['name']}, {OFFER['pct']}% off</span></span>
            <p class="pb-desc"><span id="pb-line">{b['line']}</span> <span class="phase-note">Phase one: {OFFER['limit']} reports, closes {OFFER['ends_text']}.</span></p></div>
          <div class="form-grid">
            <div class="field field-wide"><label for="mobile">WhatsApp number <i>*</i></label><div class="phone-row"><select id="country-code" name="country_code" aria-label="Country code" autocomplete="tel-country-code"><option value="India|+91">+91 India</option></select><input id="mobile" name="mobile" type="tel" inputmode="tel" autocomplete="tel-national" placeholder="98765 43210" required></div><span class="field-error">Enter your number without the country code.</span></div>
            <div class="field field-wide"><label for="name">Full name <i>*</i></label><input id="name" name="name" type="text" autocomplete="name" placeholder="As it appears on your records" required><span class="field-error">Enter your full name.</span></div>
            <div class="field field-wide"><label for="email">Email <span class="optional">(optional)</span></label><input id="email" name="email" type="email" autocomplete="email" placeholder="you@example.com"><span class="field-error">Check the email, or leave it empty.</span></div>
            <div class="field field-wide"><label for="dob-day">Date of birth <i>*</i></label><div class="dob-row">
              <select id="dob-day" name="dob_day" aria-label="Day" required><option value="">Day</option></select>
              <select id="dob-month" name="dob_month" aria-label="Month" required><option value="">Month</option></select>
              <select id="dob-year" name="dob_year" aria-label="Year" required><option value="">Year</option></select></div><span class="field-error">Choose a valid date of birth.</span></div>
            <div class="field field-wide" id="tob-field"><label for="tob-hour">Time of birth <i>*</i></label><div class="tob-row">
              <select id="tob-hour" name="tob_hour" aria-label="Hour" required><option value="">Hour</option></select>
              <select id="tob-min" name="tob_min" aria-label="Minute" required><option value="">Min</option></select>
              <select id="tob-ampm" name="tob_ampm" aria-label="AM or PM" required><option value="">AM/PM</option><option>AM</option><option>PM</option></select></div>
              <span class="field-hint">Not sure of your birth time? Choose Classic.</span><span class="field-error">Enter your time of birth, or switch to Classic.</span></div>
            <div class="field field-wide"><label for="pob">Place of birth <i>*</i></label><div class="place-box"><input id="pob" name="pob" type="text" autocomplete="off" placeholder="Start typing your birth city" required role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="pob-list"><ul id="pob-list" class="place-list" role="listbox" aria-label="Matching places" hidden></ul></div><span class="field-error">Enter your place of birth.</span></div>
          </div>
          <div class="form-submit">
            <div class="field"><label for="referral">Referral code (optional)</label><input id="referral" name="referral" placeholder="If someone referred you" autocomplete="off"></div>
            <label class="consent"><input type="checkbox" name="terms" required><span>I have read the <a href="/terms.html" target="_blank">terms</a>, <a href="/privacy-policy.html" target="_blank">privacy policy</a> and <a href="/refund-policy.html" target="_blank">refund and delivery policy</a>.</span></label>
            <label class="consent"><input type="checkbox" name="wa_ok" required><span>Send my report and order updates to my WhatsApp.</span></label>
            <p id="form-error" class="form-error" role="alert" hidden>Please complete the highlighted fields.</p>
            <button class="pill" type="submit"><span id="pay-label">Review and order</span></button>
            <p class="delivery-line">{ICON_CLOCK}<span>Delivered on WhatsApp within {DELIVERY} of payment.</span></p>
            <p class="form-links"><a href="{wa(BULK_MSG)}" target="_blank" rel="noopener">Ordering for more than one person? Message us on WhatsApp</a></p>
          </div>
        </form>
      </div>
    </section>

    <section class="signature" aria-label="Curated by Shashank Agrawal"><p class="sig-line"><span>Curated by</span> <span><b>Shashank Agrawal</b></span></p></section>

    <section class="report-section book-section" id="preview" aria-labelledby="preview-title"><div class="wrap">
      <header class="section-heading"><div class="kicker">Inside a report</div><h2 id="preview-title">Prepared for one person.</h2>
        <p class="section-lead">Every report is written around a single name and date of birth, on a cover chosen by your Mulank.</p></header>
      <div class="book-stage" id="book-stage" aria-hidden="true"></div>
      <noscript><div class="book-noscript"><img src="/assets/r27/book/cover.webp" alt="Sample 2027 report cover" width="150"><img src="/assets/r27/book/page-2.webp" alt="Sample 2027 report page" width="150"><img src="/assets/r27/book/page-3.webp" alt="Sample 2027 report monthly page" width="150"></div></noscript>
      <p class="book-caption">Sample report. Names and numbers change with yours.</p>
      <button type="button" class="book-replay" id="book-replay">Play again</button>
    </div></section>

    <section class="report-section" id="inside" aria-labelledby="inside-title"><div class="wrap">
      <header class="section-heading"><div class="kicker">What's inside</div><h2 id="inside-title">Your whole year, <em>mapped month by month.</em></h2>
        <p class="section-lead">A personalised 2027 numerology report, complete and detailed. Not a horoscope written for millions: it is <mark class="hl">built from your own date of birth and name</mark>, from VESHANNASTRO, owned by Shashank Agrawal.</p></header>
      <div class="covers-fan" aria-label="2027 report covers by Mulank">{covers}</div>
      <p class="covers-note">Your cover is chosen by your Mulank, the number of your birth day. Mulank 3, 5, 6 and 9 receive the same cover.</p>
      <ol class="inside-list" style="margin-top:48px">{inside}</ol>
      <div class="ring-controls" hidden><button type="button" class="ring-prev" aria-label="Previous chapter"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="m15 5-7 7 7 7"/></svg></button><span class="ring-count" aria-live="polite">01 / {len(INSIDE):02d}</span><button type="button" class="ring-next" aria-label="Next chapter"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg></button></div>
    </div></section>

    <div class="marquee" aria-hidden="true"><div class="marquee-track"><div class="marquee-row"><span class="mq-item">Personal Year</span><i class="mq-dot"></i><span class="mq-item mq-outline" data-text="Mulank">Mulank</span><i class="mq-dot"></i><span class="mq-item">Bhagyank</span><i class="mq-dot"></i><span class="mq-item mq-outline" data-text="Lo Shu Grid">Lo Shu Grid</span><i class="mq-dot"></i><span class="mq-item">Muhurat Dates</span><i class="mq-dot"></i><span class="mq-item mq-outline" data-text="Name Number">Name Number</span><i class="mq-dot"></i><span class="mq-item">Pinnacles</span><i class="mq-dot"></i><span class="mq-item mq-outline" data-text="12 Months of 2027">12 Months of 2027</span><i class="mq-dot"></i><span class="mq-item">Remedies</span><i class="mq-dot"></i></div><div class="marquee-row"><span class="mq-item">Personal Year</span><i class="mq-dot"></i><span class="mq-item mq-outline" data-text="Mulank">Mulank</span><i class="mq-dot"></i><span class="mq-item">Bhagyank</span><i class="mq-dot"></i><span class="mq-item mq-outline" data-text="Lo Shu Grid">Lo Shu Grid</span><i class="mq-dot"></i><span class="mq-item">Muhurat Dates</span><i class="mq-dot"></i><span class="mq-item mq-outline" data-text="Name Number">Name Number</span><i class="mq-dot"></i><span class="mq-item">Pinnacles</span><i class="mq-dot"></i><span class="mq-item mq-outline" data-text="12 Months of 2027">12 Months of 2027</span><i class="mq-dot"></i><span class="mq-item">Remedies</span><i class="mq-dot"></i></div></div></div>

    <section class="report-section" id="finder" aria-labelledby="finder-title"><div class="wrap">
      <header class="section-heading"><div class="kicker">Try it</div><h2 id="finder-title">Find your <em>Personal Year</em> for 2027.</h2>
        <p class="section-lead">Every year carries a number that is personal to you, worked out from your birth day, birth month and the year itself. It sets the theme your whole report is read against. This 2027 personal year calculator also shows the cover your report is printed on.</p></header>
      <div class="year-finder">
        <form class="finder-form" autocomplete="off" aria-label="Find your Personal Year">
          <label class="finder-field"><span>Birth day</span><input name="day" type="number" inputmode="numeric" min="1" max="31" placeholder="e.g. 23" aria-label="Birth day"></label>
          <label class="finder-field"><span>Birth month</span><select name="month" aria-label="Birth month"><option value="">Select</option></select></label>
          <label class="finder-field"><span>Birth year</span><input name="year" type="number" inputmode="numeric" min="1900" placeholder="e.g. 1990" aria-label="Birth year"></label>
        </form>
        <div class="finder-result" aria-live="polite" aria-atomic="true"><p class="finder-empty">Enter your birth day, month and year to see the number that sets the tone for your 2027.</p></div>
      </div>
      <p class="section-lead" style="margin-top:22px;font-size:14px">Step by step: <a href="/blog/personal-year-number-2027-calculator.html" style="color:var(--cy)">how to calculate personal year number for 2027</a>.</p>
    </div></section>

    <section class="report-section" id="how" aria-labelledby="how-title"><div class="wrap">
      <header class="section-heading"><div class="kicker">How it works</div><h2 id="how-title">Buy your 2027 numerology report online <em>in three steps.</em></h2></header>
      <ol class="report-steps">{steps}</ol>
    </div></section>

    <section class="report-section" id="pricing" aria-labelledby="pricing-title"><div class="wrap">
      <header class="section-heading"><div class="kicker">{OFFER['name']}, {OFFER['pct']}% off</div><h2 id="pricing-title">2027 numerology report <em>price in India.</em></h2>
        <p class="section-lead">Two reports. The Astro-Numero Blend is our 2027 astro numero report, <mark class="hl">numerology and astrology read together</mark>; Classic reads your numbers alone. The amount is an energy exchange for a reading prepared for you alone.</p></header>
      <div class="countdown" data-ends="{CLOSES_AT}" hidden><p class="cd-title">The {OFFER['name']} ends in</p>
        <div class="cd-tiles" role="timer" aria-label="Time left in the {OFFER['name']}">{cd_tiles}</div>
        <p class="cd-note">Phase one closes on {OFFER['ends_text']} at 11:59 PM IST, or sooner if all {OFFER['limit']} reports are taken.</p></div>
      <div class="plans">{plan('blend', True)}{plan('classic', False)}</div>
      <p class="plans-note">Phase one is limited to {OFFER['limit']} reports and closes on {OFFER['ends_text']}. Ordering for more than one person? <a href="{wa(BULK_MSG)}" target="_blank" rel="noopener" style="color:var(--cy)">Message us on WhatsApp</a>.</p>
    </div></section>

    <section class="report-section" id="services" aria-labelledby="services-title"><div class="wrap">
      <header class="section-heading"><div class="kicker">Consultations</div><h2 id="services-title">Live consultations <em>with Shashank.</em></h2>
        <p class="section-lead">Besides the 2027 report, Shashank reads Vedic kundli and numerology one-to-one in live sessions on Google Meet. Every consultation is <mark class="hl">booked on WhatsApp</mark>: message us with the session you want, and we confirm your slot and send the payment link there.</p></header>
      <div class="morph" aria-hidden="true"><span class="morph-word">Vedic Kundli</span><span class="morph-word">Numerology</span><span class="morph-word">Krishnamurti Paddhati</span><span class="morph-word">Bhrigu Nandi Nadi</span><span class="morph-word">Jaimini Astrology</span></div>
      <div class="plans">{consults}</div>
      <p class="plans-note">{SLOTS} {OFFICE}</p>
      <div class="sessions" data-sessions><p class="kicker">Five Vedic sessions</p><h3 class="sessions-title">One session for each part of your life.</h3>
        <div class="sessions-track"><div class="sessions-sticky"><ol class="sessions-list" aria-hidden="true">{sessions_list}</ol><div class="sessions-detail">{sessions_detail}</div></div>
        <div class="sessions-steps" aria-hidden="true">{sessions_steps}</div></div></div>
    </div></section>

    <section class="report-section" id="about" aria-labelledby="about-title"><div class="wrap about-grid">
      <div class="about-copy"><div class="kicker">Owner, VESHANNASTRO</div><h2 class="section-title" id="about-title">Shashank <em>Agrawal</em></h2>
        <p>Shashank Agrawal founded VESHANNASTRO and is the author of <a href="{BOOK}" target="_blank" rel="noopener" style="color:var(--cy)"><em>Numbers &amp; Navgraha: Untold Secret of Numerology</em></a>. He works with Mulank and Bhagyank, the Lo Shu grid, Chaldean name numbers and Vedic astrology.</p>
        <p>The 2027 Personal Year Report is his reading of your year: what it holds for your health, money, work and relationships, and where it needs care, with the remedies to meet it and step into 2027 as a stronger version of yourself. Each report is <mark class="hl">prepared by Shashank and his team</mark> for one person.</p>
      </div>
    </div></section>

    <section class="report-section" id="year-2027" aria-labelledby="uy-title"><div class="wrap">
      <svg class="draw-num" viewBox="0 0 280 200" aria-hidden="true" focusable="false"><defs><linearGradient id="dn-fill" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#fff6e3"/><stop offset=".55" stop-color="#f3cd93"/><stop offset="1" stop-color="#8fd8ff"/></linearGradient></defs><text x="4" y="166">11/2</text></svg>
      <header class="section-heading"><div class="kicker"><span class="glitch" data-text="Universal Year 11/2">Universal Year 11/2</span></div><h2 id="uy-title">What 2027 means <em>in numerology.</em></h2>
        <p class="section-lead">2027 adds up to 11 (2 + 0 + 2 + 7), and 11 reduces to 2, so it is a <mark class="hl">Universal Year 11/2</mark>. In Indian numerology the 2 is ruled by the Moon: a year of partnership, patience and intuition, with the master number 11 adding a sharper inner pull. After 2026, a year of fresh starts, 2027 asks you to work with others, finish what you began and let things ripen. What it means for you depends on your Personal Year, the number set by your birth day and month together with 2027. Your report reads that Personal Year month by month, so you know which parts of 2027 to push in and which to handle with care.</p></header>
      <p class="read-more"><a href="/blog/2027-numerology-predictions.html">Read the full 2027 numerology predictions</a></p>
    </div></section>

    <section class="report-section" id="read" aria-labelledby="read-title"><div class="wrap">
      <header class="section-heading"><div class="kicker">Free to read</div><h2 id="read-title">2027 numerology <em>predictions.</em></h2>
        <p class="section-lead">Start with the free articles: what 2027 means in numerology, your Personal Year for 2027 and Mulank predictions in English and Hindi.</p></header>
      <div class="read-list">{reads}</div>
      <p class="read-more"><a href="/blog/">All articles on the blog</a></p>
    </div></section>

    <section class="report-section" id="explore" aria-labelledby="explore-title"><div class="wrap">
      <header class="section-heading"><div class="kicker">Explore</div><h2 id="explore-title">Everything on <em>Veshannastro.</em></h2>
        <p class="section-lead">Free calculators, live consultations and everything about the practice, one click from here.</p></header>
      <div class="explore" data-tabs><div class="explore-tabs" role="tablist" aria-label="Explore the site">{tab_buttons}</div>{tab_panels}</div>
    </div></section>

    <section class="report-section" id="faq" aria-labelledby="faq-title"><div class="wrap">
      <header class="section-heading"><div class="kicker">Questions</div><h2 id="faq-title">Before you <em>order.</em></h2></header>
      <div class="report-faq">{faq_html}</div>
    </div></section>

    <section class="report-section report-closing"><div class="wrap">
      <h2 class="closing-title">Read <b>2027</b> before it happens.</h2><p class="closing-flip"><span class="sr-only">Your money, career, love, health and family in 2027, month by month.</span><span aria-hidden="true">Your <span class="flip" data-words="money|career|love|health|family">money</span> in 2027, month by month.</span></p><p class="section-lead">Phase one, {OFFER['limit']} reports, until {OFFER['ends_text']}.</p><div class="report-actions"><a class="pill get-report" href="#register"><span>Get your 2027 report</span></a></div>
    </div></section>
  </main>

  <footer class="site-footer"><div class="wrap">
    <div class="foot-cols">
      <div><a class="brand" href="{PATH}"><b>VESHANNASTRO</b></a>
        <address style="margin-top:14px">Veshannastro, Shashank Agrawal<br>{ADDRESS['street']}<br>{ADDRESS['city']}, {ADDRESS['region']} {ADDRESS['postal']}<br>
        <a href="{wa(ASK_MSG)}" target="_blank" rel="noopener">WhatsApp {WA_SHOW}</a><br><a href="tel:+{PHONE2}">Phone {PHONE2_SHOW}</a><br><a href="mailto:{EMAIL}">{EMAIL}</a></address></div>
      <div><h2>2027</h2><ul><li><a href="/blog/2027-numerology-predictions.html">2027 numerology predictions</a></li><li><a href="/blog/personal-year-number-2027-calculator.html">2027 personal year calculator</a></li><li><a href="/blog/mulank-predictions-2027.html">Mulank predictions 2027</a></li><li><a href="/blog/">Blog</a></li></ul></div>
      <div><h2>Free calculators</h2><ul><li><a href="/calculators/name-numerology.html">Name numerology</a></li><li><a href="/calculators/lo-shu-grid.html">Lo Shu grid</a></li><li><a href="/calculators/lucky-mobile-number.html">Mobile number</a></li><li><a href="/calculators/life-path-number.html">Life path number</a></li><li><a href="/calculators/">All calculators</a></li></ul></div>
      <div><h2>Veshannastro</h2><ul><li><a href="/vedic-kundli-booking.html">Vedic kundli consultation</a></li><li><a href="/numerology-booking.html">Numerology consultation</a></li><li><a href="/about.html">About</a></li><li><a href="/contact.html">Contact</a></li><li><a href="/vedic-astrologer-raipur.html">Astrologer in Raipur</a></li><li><a href="/privacy-policy.html">Privacy policy</a></li><li><a href="/terms.html">Terms</a></li><li><a href="/refund-policy.html">Refund and delivery</a></li></ul></div>
    </div>
    <div class="foot-mark" aria-hidden="true"><svg class="fm-star" viewBox="0 0 32 32"><path d="M16 1 18.9 13.1 31 16 18.9 18.9 16 31 13.1 18.9 1 16 13.1 13.1Z" fill="#f3cd93"/></svg><span class="fm-glow">VESHANNASTRO</span><span class="fm-word">VESHANNASTRO</span><span class="fm-dust"><i style="--x:8%;--y:62%;--d:6.5s;--t:-1.2s"></i><i style="--x:17%;--y:30%;--d:8s;--t:-3.1s"></i><i style="--x:26%;--y:70%;--d:7s;--t:-0.4s"></i><i style="--x:38%;--y:22%;--d:9s;--t:-2.2s"></i><i style="--x:47%;--y:66%;--d:6s;--t:-4s"></i><i style="--x:56%;--y:38%;--d:8.5s;--t:-1.7s"></i><i style="--x:64%;--y:74%;--d:7.5s;--t:-3.6s"></i><i style="--x:73%;--y:26%;--d:6.8s;--t:-0.9s"></i><i style="--x:82%;--y:58%;--d:9.2s;--t:-2.8s"></i><i style="--x:91%;--y:34%;--d:7.2s;--t:-1.4s"></i></span></div>
    <div class="foot-base"><span>// SHASHANK AGRAWAL &nbsp; // VESHANNASTRO</span><span>Numerology and astrology are guidance, not guarantees. &copy; 2026 Veshannastro</span></div>
  </div></footer>

  <dialog id="review-dialog" class="review-dialog" aria-labelledby="review-title"><div class="review-scroll"><header class="review-head"><div class="dialog-title-row"><h2 id="review-title">Check your details</h2><button class="close-dialog" type="button" data-close aria-label="Close">&times;</button></div><p id="review-sub">Edit anything before you continue.</p></header><div id="review-content"></div><p class="local-payment-note" id="review-note"></p><p class="form-error" id="pay-error" role="alert" hidden></p></div>
    <footer class="dialog-foot"><button type="button" class="outline-button" data-close id="review-edit">Edit details</button><a id="review-go" class="wa-btn" href="#" target="_blank" rel="noopener">{ICON_WA}<span>Send order on WhatsApp</span></a><button type="button" class="pill pay-btn" id="review-pay" hidden><span id="review-pay-label">Pay</span></button><button type="button" class="pill" id="review-done" data-close hidden>Close</button></footer></dialog>

  <dialog id="paid-dialog" class="review-dialog paid-dialog" aria-labelledby="paid-title" data-state="checking"><div class="review-scroll">
    <div class="paid-mark" aria-hidden="true"><svg viewBox="0 0 64 64"><circle class="pr-track" cx="32" cy="32" r="28"/><circle class="pr-spin" cx="32" cy="32" r="28"/><path class="pr-check" d="M20 33l8 8 16-17"/></svg></div>
    <h2 id="paid-title" tabindex="-1">Confirming your payment</h2>
    <p id="paid-sub" class="paid-sub" role="status">This takes a few seconds. Please keep this page open.</p>
    <ol class="paid-steps"><li class="done">Payment received by Razorpay</li><li class="now">Confirming your payment</li><li>Invoice on its way to your WhatsApp</li></ol>
    <div id="paid-details"></div><p class="local-payment-note" id="paid-note"></p></div>
    <footer class="dialog-foot"><a id="paid-wa" class="outline-button" href="#" target="_blank" rel="noopener" hidden>Message us on WhatsApp</a><button type="button" class="pill" id="paid-close" hidden>Done</button></footer></dialog>

  <div class="sticky-pay" id="sticky-pay"><div class="sp-text"><b id="sp-name">Astro-Numero Blend</b><span id="sp-price">Delivered within {DELIVERY}</span></div><a class="pill get-report" href="#register">Order</a></div>
  <a class="wa-float" href="{wa(ASK_MSG)}" target="_blank" rel="noopener" aria-label="Chat on WhatsApp">{ICON_WA}<span>WhatsApp</span></a>
</body>
</html>
"""


# Services Kamala sells on WhatsApp besides the 2027 report (tools/kamala_services.json; they used to live in the old
# homepage's var DATA). An empty link means the service is booked in the WhatsApp chat, not on a page.
def legacy_services():
    with open(os.path.join(REPO, "tools", "kamala_services.json"), encoding="utf-8") as fh:
        cats = json.load(fh)["categories"]
    keep = ("t", "d", "p", "was", "off", "unit", "give", "link", "features")
    return [{"id": c["id"], "name": c["name"], "services": [{k: s[k] for k in keep if k in s} for s in c["services"]]}
            for c in cats if c.get("services")]


def services_for_kamala():
    import html
    import re

    def text(s):
        return html.unescape(re.sub(r"<[^>]+>", "", s))

    r27 = []
    for key in ("blend", "classic"):
        rep = REPORTS[key]
        r27.append({
            "t": f"2027 Report: {rep['name']}",
            "d": f"{rep['line']} A personalised 2027 Personal Year report PDF for one person.",
            "p": inr(rep["inr"]), "was": inr(rep["inr_mrp"]), "off": f"{OFFER['pct']}% off",
            "usd": f"US${rep['usd']}", "give": ["pdf"], "link": URL + "#register",
            "needs": ["dob", "tob", "pob"] if rep["needs_time"] else ["dob", "pob"],
            "features": PLAN_ITEMS[key] + [x for x in PLAN_COMMON if not x.startswith("PDF on")] + [f"Delivered on WhatsApp within {DELIVERY}"],
        })
    return {
        "updated": __import__("sitekit").UPDATED,
        "categories": [{"id": "r27", "name": "2027 Personal Year Report", "services": r27}] + legacy_services(),
        "offer": (f"2027 reports: {OFFER['pct']}% {OFFER['name']} until {OFFER['ends_text']}. Phase one is limited to "
                  f"{OFFER['limit']} reports and closes on {OFFER['ends_text']}. One report per person; for two or more people "
                  f"the order is taken on WhatsApp. Outside India: Astro-Numero Blend US${REPORTS['blend']['usd']}, Classic "
                  f"US${REPORTS['classic']['usd']}. Order page: {URL}"),
        "inside": [f"{t}: {d}" for t, d in INSIDE],
        "faq": [{"q": text(q), "a": text(a)} for q, a in faqs()],
        "blog": [{"title": p["h1"], "about": p["card"], "url": f"{BASE}/blog/{p['slug']}.html"} for p in POSTS],
    }


if __name__ == "__main__":
    out = os.path.join(REPO, PATH.strip("/"), "index.html")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    open(out, "w", encoding="utf-8").write(page())
    print(os.path.relpath(out, REPO))
    # The payment server charges from this same table (api/r27/_catalog.json), never from the browser.
    catalog = {"reports": {k: {f: v[f] for f in ("name", "inr", "inr_mrp", "usd", "usd_mrp", "needs_time")} for k, v in REPORTS.items()},
               "offer": {"pct": OFFER["pct"], "name": OFFER["name"], "closes_at": CLOSES_AT, "limit": OFFER["limit"]},
               "delivery": DELIVERY, "whatsapp": WA}
    cat = os.path.join(REPO, "api", "r27", "_catalog.json")
    os.makedirs(os.path.dirname(cat), exist_ok=True)
    open(cat, "w", encoding="utf-8").write(json.dumps(catalog, indent=2, ensure_ascii=False) + "\n")
    print(os.path.relpath(cat, REPO))
    # What Kamala knows about the website (services.json): every service with its price, the 2027 page's facts and
    # the blog. She reads it every hour, so a price changed here reaches her chats without touching her code.
    svc = os.path.join(REPO, "services.json")
    open(svc, "w", encoding="utf-8").write(json.dumps(services_for_kamala(), indent=1, ensure_ascii=False) + "\n")
    print(os.path.relpath(svc, REPO))
