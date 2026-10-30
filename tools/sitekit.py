"""Shared page shell for veshannastro.co.in.

Every page is built through `page()` so the head, header, footer,
WhatsApp button, analytics and structured data stay identical sitewide.
"""
import json
import html as _html
from urllib.parse import quote

BASE = "https://www.veshannastro.co.in"
WA_NUMBER = "918827684725"
WA_DISPLAY = "+91 88276 84725"
EMAIL = "assist@veshannastro.co.in"
PHONE2 = "918827684725"
PHONE2_DISPLAY = "+91 88276 84725"
BOOK_URL = "https://amzn.in/d/05h90t9v"
BOOK_TITLE = "Numbers &amp; Navgraha: Untold Secret of Numerology"
SHOP = "https://shop.veshannastro.co.in"
PRICE_INR = 1999
PRICE_USD = 30
UPDATED = "2026-10-24"
OG_DEFAULT = "/images/og-image.png"

NAV = [
    ("/2027-numerology-report/", "2027 Report"),
    ("/2027-numerology-report/#services", "Consultations"),
    ("/calculators/", "Calculators"),
    ("/blog/", "Blog"),
    ("/about.html", "About"),
    ("/contact.html", "Contact"),
]

ORDER_TEXT = "Hi Veshannastro, I would like to order the 2027 Personal Year Report."

LOGO = ('<svg viewBox="0 0 32 32" aria-hidden="true" focusable="false"><rect width="32" height="32" rx="7" fill="#f4c6d3"/>'
        '<path d="M8.5 10.5h15L16 23.5z" fill="none" stroke="#b9637f" stroke-opacity=".38" stroke-width="1"/>'
        '<circle cx="8.5" cy="10.5" r="3.3" fill="#e39bb1"/><circle cx="23.5" cy="10.5" r="3.3" fill="#e39bb1"/>'
        '<circle cx="16" cy="23.5" r="3.3" fill="#c96e8b"/></svg>')

WA_ICON = ('<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15h-.01a8.23 8.23 0 0 1-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.23 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.17.25-.64.81-.78.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.43-.06-.13-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.42h-.48c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.23-.16-.48-.29Z"/></svg>')

CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m5 12.5 4.2 4L19 7"/></svg>'
STAR = '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 1 18.9 13.1 31 16 18.9 18.9 16 31 13.1 18.9 1 16 13.1 13.1Z" fill="currentColor"/></svg>'

GTAG = """<script async src="https://www.googletagmanager.com/gtag/js?id=G-R20FKYJK7P"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-R20FKYJK7P');gtag('config','AW-18189866057');</script>"""


def esc(s):
    return _html.escape(str(s), quote=True)


def wa(text=ORDER_TEXT):
    """wa.me link with a prefilled message."""
    return f"https://wa.me/{WA_NUMBER}?text={quote(text)}"


def wa_btn(label, text=ORDER_TEXT, cls="btn btn-wa"):
    return f'<a class="{cls}" href="{esc(wa(text))}" target="_blank" rel="noopener">{WA_ICON}<span>{label}</span></a>'


def url(path):
    return BASE + path


def ld(obj):
    return '<script type="application/ld+json">' + json.dumps(obj, ensure_ascii=False, separators=(",", ":")) + "</script>"


ORG_ID = BASE + "/#organization"
PERSON_ID = BASE + "/#shashank"


def org_graph():
    return [
        {"@type": "Organization", "@id": ORG_ID, "name": "Veshannastro", "url": BASE + "/",
         "logo": BASE + "/images/logo.png", "email": EMAIL, "telephone": WA_DISPLAY.replace(" ", ""),
         "founder": {"@id": PERSON_ID}, "areaServed": "IN", "sameAs": ["https://www.instagram.com/veshann.astro"],
         "contactPoint": [{"@type": "ContactPoint", "contactType": "customer service", "telephone": WA_DISPLAY.replace(" ", ""),
                           "email": EMAIL, "availableLanguage": ["English", "Hindi"]},
                          {"@type": "ContactPoint", "contactType": "customer service", "telephone": PHONE2_DISPLAY.replace(" ", ""),
                           "availableLanguage": ["English", "Hindi"]}]},
        {"@type": "Person", "@id": PERSON_ID, "name": "Shashank Agrawal", "jobTitle": "Numerologist",
         "worksFor": {"@id": ORG_ID}, "url": BASE + "/about.html", "image": BASE + "/images/shashank-agrawal-portrait.jpg",
         "birthPlace": "Raipur, Chhattisgarh", "sameAs": ["https://www.instagram.com/veshann.astro"], "knowsAbout": ["Numerology", "Chaldean numerology", "Lo Shu grid", "Vedic astrology", "Palmistry"]},
        {"@type": "WebSite", "@id": BASE + "/#website", "url": BASE + "/", "name": "Veshannastro", "publisher": {"@id": ORG_ID}, "inLanguage": "en-IN"},
    ]


def breadcrumb_ld(crumbs):
    return {"@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": i + 1, "name": name, "item": url(path)} for i, (path, name) in enumerate(crumbs)]}


def faq_ld(faqs):
    import re
    strip = lambda s: re.sub(r"<[^>]+>", "", _html.unescape(s))
    return {"@type": "FAQPage", "mainEntity": [
        {"@type": "Question", "name": strip(q), "acceptedAnswer": {"@type": "Answer", "text": strip(a)}} for q, a in faqs]}


def faq_html(faqs, heading="Questions"):
    items = "".join(f"<details><summary>{q}</summary><p>{a}</p></details>" for q, a in faqs)
    return items


def crumb_html(crumbs):
    lis = []
    for i, (path, name) in enumerate(crumbs):
        if i == len(crumbs) - 1:
            lis.append(f'<li aria-current="page">{esc(name)}</li>')
        else:
            lis.append(f'<li><a href="{path}">{esc(name)}</a></li>')
    return '<nav class="crumb" aria-label="Breadcrumb"><ol>' + "".join(lis) + "</ol></nav>"


def header(active):
    cur = ' aria-current="page"'
    links = "".join(f'<a href="{p}"{cur if p == active else ""}>{n}</a>' for p, n in NAV)
    mlinks = "".join(f'<li><a href="{p}">{n}</a></li>' for p, n in NAV)
    return f"""<header class="site-head"><div class="wrap">
<a class="brand" href="/2027-numerology-report/" aria-label="Veshannastro home"><b>VESHANNASTRO</b></a>
<nav class="nav" aria-label="Main">{links}</nav>
<a class="btn btn-gold head-cta" href="/2027-numerology-report/#register">Get your 2027 report</a>
<button class="menu-btn" type="button" aria-expanded="false" aria-controls="mobile-menu"><i aria-hidden="true"></i>Menu</button>
</div></header>
<nav class="mobile-menu" id="mobile-menu" aria-label="Mobile"><ul>{mlinks}</ul>
{wa_btn("Chat on WhatsApp", "Hi Veshannastro, I have a question.")}</nav>"""


def footer():
    return f"""<footer class="site-foot"><div class="wrap">
<div class="foot-grid">
<div class="foot-about">
<a class="brand" href="/2027-numerology-report/" aria-label="Veshannastro home"><b>VESHANNASTRO</b></a>
<p style="margin-top:14px">Numerology and Vedic astrology by Shashank Agrawal, author of <a href="{BOOK_URL}" rel="noopener" target="_blank"><em>{BOOK_TITLE}</em></a>.</p>
<div class="foot-contact"><a href="{esc(wa("Hi Veshannastro, I have a question."))}" target="_blank" rel="noopener">WhatsApp {WA_DISPLAY}</a><a href="tel:+{PHONE2}">Phone {PHONE2_DISPLAY}</a><a href="mailto:{EMAIL}">{EMAIL}</a></div>
</div>
<div><h2>2027 numerology</h2><ul>
<li><a href="/2027-numerology-report/">2027 Numerology Report</a></li>
<li><a href="/blog/2027-numerology-predictions.html">2027 Numerology Predictions</a></li>
<li><a href="/blog/personal-year-number-2027-calculator.html">2027 Personal Year Calculator</a></li>
<li><a href="/blog/mulank-predictions-2027.html">Mulank Predictions 2027</a></li>
<li><a href="/blog/personal-year-2-in-2027.html">Personal Year 2 in 2027</a></li>
<li><a href="/blog/">All blog posts</a></li>
</ul></div>
<div><h2>Free calculators</h2><ul>
<li><a href="/calculators/name-numerology.html">Name Numerology Calculator</a></li>
<li><a href="/calculators/lo-shu-grid.html">Lo Shu Grid Calculator</a></li>
<li><a href="/calculators/lucky-mobile-number.html">Mobile Number Numerology</a></li>
<li><a href="/calculators/life-path-number.html">Life Path Number Calculator</a></li>
<li><a href="/calculators/destiny-number.html">Destiny Number Calculator</a></li>
<li><a href="/calculators/">All calculators</a></li>
</ul></div>
<div><h2>Veshannastro</h2><ul>
<li><a href="/2027-numerology-report/">2027 Numerology Report</a></li>
<li><a href="/vedic-kundli-booking.html">Vedic kundli consultation</a></li>
<li><a href="/numerology-booking.html">Numerology consultation</a></li>
<li><a href="/vedic-astrologer-raipur.html">Astrologer in Raipur</a></li>
<li><a href="/about.html">About</a></li>
<li><a href="/contact.html">Contact</a></li>
</ul></div>
</div>
<div class="foot-legal">
<p>Numerology and astrology are interpretive guidance. They do not guarantee outcomes and do not replace medical, legal or financial advice.</p>
<p><a href="/privacy-policy.html">Privacy</a> &nbsp; <a href="/terms.html">Terms</a> &nbsp; <a href="/refund-policy.html">Refunds and delivery</a> &nbsp; &copy; 2026 Veshannastro</p>
</div>
</div></footer>"""


def page(path, title, description, body, *, crumbs=None, schema=None, robots="index, follow",
         og_image=OG_DEFAULT, og_type="website", scripts=(), wa_text=ORDER_TEXT, wa_label="WhatsApp",
         active=None, head_extra="", preload=None):
    canonical = url(path)
    graph = list(schema or [])
    if crumbs:
        graph.append(breadcrumb_ld(crumbs))
    ld_block = ld({"@context": "https://schema.org", "@graph": graph}) if graph else ""
    script_tags = "".join(f'<script src="{s}" defer></script>' for s in ("/assets/site.js", *scripts))
    pre = f'<link rel="preload" href="{preload}" as="image">' if preload else ""
    return f"""<!doctype html>
<html lang="en-IN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(title)}</title>
<meta name="description" content="{esc(description)}">
<meta name="robots" content="{robots}">
<link rel="canonical" href="{canonical}">
<meta name="theme-color" content="#05070f">
<meta name="author" content="Shashank Agrawal">
<meta property="og:type" content="{og_type}">
<meta property="og:site_name" content="Veshannastro">
<meta property="og:locale" content="en_IN">
<meta property="og:title" content="{esc(title)}">
<meta property="og:description" content="{esc(description)}">
<meta property="og:url" content="{canonical}">
<meta property="og:image" content="{url(og_image)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{esc(title)}">
<meta name="twitter:description" content="{esc(description)}">
<meta name="twitter:image" content="{url(og_image)}">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" href="/favicon-32.png" type="image/png" sizes="32x32">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="alternate" type="text/plain" href="{BASE}/llms.txt" title="llms.txt">
<link rel="preload" href="/assets/fonts/manrope-latin.woff2" as="font" type="font/woff2" crossorigin>
{pre}<link rel="stylesheet" href="/assets/site.css?v={UPDATED}">
{GTAG}
{ld_block}
{head_extra}
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>
<div class="haze" aria-hidden="true"></div><canvas class="sky" id="sky" aria-hidden="true"></canvas>
{header(active if active is not None else path)}
<main id="main">
{body}
</main>
{footer()}
<a class="wa-float" href="{esc(wa(wa_text))}" target="_blank" rel="noopener" aria-label="Chat on WhatsApp">{WA_ICON}<span>{wa_label}</span></a>
{script_tags}
</body>
</html>
"""


def write(repo, path, html):
    import os
    fp = os.path.join(repo, path.lstrip("/"))
    if fp.endswith("/"):
        fp += "index.html"
    os.makedirs(os.path.dirname(fp), exist_ok=True)
    with open(fp, "w", encoding="utf-8") as f:
        f.write(html)
    return fp
