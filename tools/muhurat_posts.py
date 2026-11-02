"""Muhurat articles for /blog/, written in markdown under tools/muhurat/.

Each file: '# H1', the first paragraph (the lede), the body with '## ' sections, an optional
'<!--CTA-->' line for the mid-article box, '## Questions' with '### question' + answer, and '## Sources'.
build_blog.py imports POSTS from here. Edit the markdown, then run python3 tools/build_blog.py.
"""
import os
import re

import markdown

from sitekit import wa_btn, esc

HERE = os.path.join(os.path.dirname(__file__), "muhurat")
PUBLISHED = "2026-11-03"
CONSULT_HREF = "/2027-numerology-report/#muhurat-consultation"
PRICE = "₹1,269"

# slug: title (under 60 characters), meta description (under 155), card line, WhatsApp text
META = {
    "marriage-muhurat-by-date-of-birth": (
        "Marriage Muhurat by Date of Birth: How It's Picked",
        "How a marriage muhurat by date of birth is chosen: the vivah muhurat list, both partners' Moon checks, the pheras lagna, and the short 2026 winter season.",
        "Why the printed vivah muhurat list is only the start, and what both your charts decide.",
        "Hi Veshannastro, I want a marriage muhurat checked for our dates of birth."),
    "griha-pravesh-muhurat-as-per-kundli": (
        "Griha Pravesh Muhurat as Per Kundli: What to Check",
        "Griha pravesh muhurat as per your kundli: the three kinds of entry, why your door direction matters, the closed months, and what to send for your new house.",
        "Possession date or entry date? How the griha pravesh muhurat is picked for your own home.",
        "Hi Veshannastro, I want a griha pravesh muhurat for my new house."),
    "vehicle-purchase-muhurat": (
        "Vehicle Purchase Muhurat: Delivery Day Matters Most",
        "Vehicle purchase muhurat explained: why delivery day is the one to time, the movable nakshatras, days to avoid, and how the owner's kundli narrows the dates.",
        "Booking, payment or delivery? Which moment of a car or bike purchase gets the muhurat.",
        "Hi Veshannastro, I want a muhurat for taking delivery of my vehicle."),
    "business-opening-muhurat": (
        "Business Opening Muhurat: Whose Kundli Counts?",
        "Business and shop opening muhurat: whose chart is checked, partners, the panchang rules, what counts as the opening for an online brand, and what to send.",
        "Owner, partner or the person at the counter: whose chart decides a shop opening muhurat.",
        "Hi Veshannastro, I want a business opening muhurat."),
    "c-section-muhurat": (
        "C Section Muhurat: Working Inside the Doctor's Dates",
        "C section muhurat done safely: the doctor's window comes first, why families ask, what the astrologer checks in two or three days, and when to drop the plan.",
        "Why the doctor's window comes first, and how a birth time is chosen inside it.",
        "Hi Veshannastro, our doctor has given a window for a C-section and we would like a muhurat."),
    "property-purchase-muhurat": (
        "Property Purchase Muhurat: Agreement, Registry or Keys?",
        "Property purchase and registry muhurat: which step to time, the four month registration rule, fixed nakshatras, joint buyers and what to send.",
        "Token, agreement, sale deed or registry: which step of a property purchase gets the muhurat.",
        "Hi Veshannastro, I want a muhurat for a property purchase or registry."),
    "bhoomi-pujan-muhurat": (
        "Bhoomi Pujan Muhurat: Picking the Day to Break Ground",
        "Bhoomi pujan muhurat for house construction: the panchang rules, the owner's chart, plot direction, fitting the date to the building season, and what to send.",
        "How the bhoomi pujan date is chosen, and why approvals and the monsoon come into it.",
        "Hi Veshannastro, I want a bhoomi pujan muhurat for construction."),
}
ORDER = list(META)


def slugify(text):
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")[:48]


def md_html(text):
    html = markdown.markdown(text, extensions=["sane_lists"])
    # External links open in a new tab; internal ones stay.
    html = re.sub(r'<a href="(https?://[^"]+)">', r'<a href="\1" target="_blank" rel="noopener">', html)
    return html


def mid_box(question):
    return (f'<div class="cta-box cta-inline"><p>A date from a list suits the sky. A muhurat checked against your own kundli also suits you. '
            f'The Muhurat Selection Consultation is {PRICE}, booked on WhatsApp, for clients in India.</p>'
            f'<a class="btn btn-gold" href="{CONSULT_HREF}" data-cta="mid-box">See the muhurat consultation</a></div>')


def end_box(question):
    return f"""<div class="cta-box"><h2>Want a muhurat checked against your kundli?</h2>
<p>Tell us the event and the dates you are considering. The Muhurat Selection Consultation is {PRICE}, booked on WhatsApp, for clients in India.</p>
<div class="btn-row"><a class="btn btn-gold" href="{CONSULT_HREF}" data-cta="bottom-box">See the muhurat consultation</a>{wa_btn("Ask on WhatsApp", question, "btn btn-line")}</div></div>"""


def parse(slug):
    raw = open(os.path.join(HERE, slug + ".md"), encoding="utf-8").read().strip()
    h1, rest = raw.split("\n", 1)
    h1 = h1.lstrip("# ").strip()
    rest = rest.strip()
    lede, rest = rest.split("\n\n", 1)
    main, tail = rest.split("\n## Questions", 1)
    faq_part, sources_part = tail.split("\n## Sources", 1)
    faqs = []
    for block in faq_part.split("\n### ")[1:]:
        q, a = block.strip().split("\n", 1)
        a_html = md_html(a.strip())
        a_html = re.sub(r"^<p>|</p>$", "", a_html.strip())
        faqs.append((esc(q.strip()), a_html))
    # Body: give every h2 an id and build the table of contents from them.
    body = md_html(main.replace("<!--CTA-->", "MIDBOXMARK"))
    toc = []

    def h2(m):
        title = re.sub(r"<[^>]+>", "", m.group(1))
        hid = slugify(title)
        toc.append((hid, title))
        return f'<h2 id="{hid}">{m.group(1)}</h2>'
    body = re.sub(r"<h2>(.*?)</h2>", h2, body)
    body = body.replace("<p>MIDBOXMARK</p>", "MIDBOXMARK")
    lede_html = re.sub(r"^<p>|</p>$", "", md_html(lede).strip())
    sources = md_html(sources_part.strip())
    return h1, lede_html, body, toc, faqs, sources


def toc_html(items):
    return '<nav class="toc" aria-label="In this post"><p>In this post</p><ol>' + "".join(
        f'<li><a href="#{i}">{t}</a></li>' for i, t in items) + "</ol></nav>"


def build_posts():
    posts = []
    for slug in ORDER:
        title, desc, card, question = META[slug]
        h1, lede, body, toc, faqs, sources = parse(slug)
        body = body.replace("MIDBOXMARK", mid_box(question))
        body = (toc_html(toc + [("faq", "Questions"), ("sources", "Sources")]) + body + "\n<!--FAQ-->\n"
                + f'<section class="sources" aria-labelledby="sources"><h2 id="sources">Sources</h2>{sources}</section>')
        posts.append(dict(slug=slug, cat="Muhurat", title=title, h1=h1, desc=desc, card=card, lede=lede,
                          body=body, faqs=faqs, question=question, related=[], published=PUBLISHED,
                          cta=end_box(question)))
    # Related reading: neighbours in the list, so every post links to three others and none is left out.
    for i, p in enumerate(posts):
        p["related"] = [ORDER[(i + k) % len(ORDER)] for k in (1, 2, 3)]
    return posts


POSTS = build_posts()
