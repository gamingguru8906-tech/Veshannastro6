"""Builds /blog/ : the index page and every post.

Run from the repo root:   python3 tools/build_blog.py
Add a YouTube video to a post by filling VIDEOS below, then run again.
"""
import os
import re
import sys

sys.path.insert(0, os.path.dirname(__file__))
from sitekit import (org_graph, page, write, wa, wa_btn, esc, url, faq_ld, faq_html, crumb_html, BASE, ORG_ID, PERSON_ID,
                     PRICE_USD, BOOK_URL, BOOK_TITLE, UPDATED)
from data2027 import (PY, MULANK, BHAGYANK, PLANET, PLANET_HI, PERSONAL_MONTH, UNIVERSAL_MONTHS, reduce,
                      personal_months, example_birthdays)

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
BLOG = "/blog/"
PUBLISHED = "2026-10-24"
PUBLISHED_TEXT = "24 October 2026"

# slug -> {"id": YouTube id, "title": ..., "upload": "YYYY-MM-DD", "desc": ...}
VIDEOS = {}

PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7 4.5v15l13-7.5z"/></svg>'


def finder(suffix):
    return f"""<div class="finder" data-finder data-order="/2027-numerology-report/#register">
<form class="finder-form" autocomplete="off" aria-label="2027 Personal Year calculator">
<div class="field"><label for="f-day{suffix}">Birth day</label><input id="f-day{suffix}" name="day" type="number" inputmode="numeric" min="1" max="31" placeholder="14"></div>
<div class="field"><label for="f-month{suffix}">Birth month</label><select id="f-month{suffix}" name="month"><option value="">Select</option></select></div>
<div class="field"><label for="f-year{suffix}">Birth year</label><input id="f-year{suffix}" name="year" type="number" inputmode="numeric" min="1900" placeholder="1992"></div>
</form>
<div class="finder-result" aria-live="polite"><p class="finder-empty">Enter your birth day, month and year to see your 2027 Personal Year number.</p></div>
</div>"""


def join_and(xs):
    xs = list(xs)
    return xs[0] if len(xs) == 1 else ", ".join(xs[:-1]) + " and " + xs[-1]


def toc(items):
    return '<nav class="toc" aria-label="In this post"><p>In this post</p><ol>' + "".join(
        f'<li><a href="#{i}">{t}</a></li>' for i, t in items) + "</ol></nav>"


def cta(question):
    return f"""<div class="cta-box"><h2>Want your whole 2027 mapped?</h2>
<p>The 2027 Personal Year Report reads all twelve of your months, with muhurat and lucky dates, your Lo Shu grid, a 10-year life graph and a personally recorded voice note from Shashank. Astro-Numero Blend (12 parameters, including Dasha) ₹599 or Classics (11 parameters) ₹499 (Diwali offer, 30% off). Delivered on WhatsApp within 24 hours.</p>
<div class="btn-row"><a class="btn btn-gold" href="/2027-numerology-report/#register">Get your 2027 report</a>{wa_btn("Ask a question", question, "btn btn-line")}</div></div>"""


AUTHOR_BOX = f"""<aside class="author-box"><img src="/images/shashank-agrawal-160.jpg" width="72" height="72" alt="Shashank Agrawal" loading="lazy">
<p><strong>Shashank Agrawal</strong>Founder of Veshannastro. Works with Mulank and Bhagyank, the Lo Shu grid and Chaldean name numerology. Author of <a href="{BOOK_URL}" target="_blank" rel="noopener"><em>{BOOK_TITLE}</em></a>. <a href="/about.html">About Shashank</a></p></aside>"""


# --------------------------------------------------------------------------- posts
POSTS = []


def add(**p):
    POSTS.append(p)


# 1. 2027 numerology predictions ------------------------------------------------
HUB_FAQ = [
    ("What does 2027 mean in numerology?", "2027 adds up to 11 (2 + 0 + 2 + 7), which reduces to 2. It is a Universal Year 11/2: a year of partnership, patience, diplomacy and intuition. In Indian numerology the number 2 is ruled by the Moon."),
    ("Is 2027 a good year in numerology?", "For most people it is a slower, steadier year than 2026. It favours cooperation, relationships and agreements over solo pushes. Whether it is good for you depends on your Personal Year, which you can find with the free calculator in this post."),
    ("What is the universal year number for 2027?", "11, reducing to 2. Many numerologists write it as 11/2 to keep the master number visible."),
    ("What are the lucky numbers for 2027?", "2 and 11 carry the year's energy for everyone, along with dates that reduce to 2: the 2nd, 11th, 20th and 29th of any month. Your personal lucky numbers come from your Mulank."),
    ("Which months of 2027 are best?", "For the world as a whole, August (a 1 month) is the year's second start, June (an 8 month) favours money and career, and September (an 11/2 month) favours agreements. Your own best months depend on your Personal Year."),
]


def body_hub():
    py_cards = "".join(
        f'<a href="{BLOG}personal-year-{n}-in-2027.html"><span class="num">{n}</span><strong>Personal Year {n} in 2027</strong><span>{PY[n]["name"]}. Ruled by {PLANET[n]}.</span></a>'
        for n in range(1, 10))
    um_rows = "".join(f"<tr><th>{m}</th><td>{n}</td><td>{t}</td></tr>" for m, n, t in UNIVERSAL_MONTHS)
    mul_rows = "".join(f'<tr><th><a href="{BLOG}mulank-predictions-2027.html#mulank-{n}">Mulank {n}</a></th><td>{PLANET[n]}</td><td>{MULANK[n]["tone"]}</td></tr>' for n in range(1, 10))
    return f"""
<dl class="facts"><div><dt>Universal Year</dt><dd>11/2</dd></div><div><dt>Ruling planet</dt><dd>Moon (Chandra)</dd></div><div><dt>Colours</dt><dd>White, silver</dd></div><div><dt>Day</dt><dd>Monday</dd></div></dl>
{toc([("what-2027-means", "What 2027 means in numerology"), ("good-year", "Is 2027 a good year?"), ("calculator", "Find your 2027 Personal Year"),
      ("by-personal-year", "Predictions by Personal Year"), ("mulank", "Mulank 2027 at a glance"), ("career", "Career"), ("love", "Love"),
      ("money", "Money and finance"), ("health", "Health"), ("business", "Business"), ("lucky", "Lucky numbers and colours"),
      ("remedies", "Remedies"), ("monthly", "Month-by-month forecast"), ("vedic", "Vedic numerology view"), ("name", "Name numerology in 2027"), ("faq", "Questions")])}

<h2 id="what-2027-means">What does 2027 mean in numerology?</h2>
<p>Add the digits of the year: 2 + 0 + 2 + 7 = 11. Eleven is a master number, and it reduces to 1 + 1 = 2. That makes 2027 a Universal Year 11/2. The 2 sets the everyday tone: cooperation, partnership, diplomacy, patience and sensitivity. The 11 underneath adds intuition, idealism and nervous energy.</p>
<p>It follows 2026, a Universal Year 1 (2 + 0 + 2 + 6 = 10, and 1 + 0 = 1), when new things were set in motion. In a 2 year those beginnings either find partners and take root, or stall because they were built alone. Results in 2027 come through agreements, relationships and timing rather than force. 2028 will be a 3 year, more social and expressive.</p>
<p>In Indian numerology (ank jyotish), the number 2 is ruled by the Moon (Chandra). The Moon governs the mind, emotions, the mother, the public and water, which is why 2027 is read as an emotionally charged, people-centred year.</p>

<h2 id="good-year">Is 2027 a good year in numerology?</h2>
<p>For most people, 2027 is a steadier, slower year than 2026. It suits marriage and relationship decisions, partnerships, joint ventures, negotiation, counselling and any work that depends on trust. It is less suited to aggressive solo moves, hasty contracts and forcing outcomes.</p>
<p>Whether it is good for you depends on two numbers. Your <strong>Personal Year</strong> (from your birth day and month) gives your year's theme, and your <strong>Mulank</strong> (from your birth day) shows how comfortable the Moon's year is for your ruling planet. In the classical planetary friendships, the Sun, Jupiter and Mars are friends of the Moon, so Mulank 1, 3 and 9 find 2027 supportive. Rahu and Saturn are not, so Mulank 4 and 8 find it more demanding.</p>

<h2 id="calculator">Find your 2027 Personal Year</h2>
<p>Enter your date of birth to see your Personal Year number for 2027. It runs in your browser and nothing is stored. For the method and worked examples, read <a href="{BLOG}personal-year-number-2027-calculator.html">how to calculate your Personal Year number for 2027</a>.</p>
{finder("-hub")}

<h2 id="by-personal-year">2027 numerology predictions by date of birth</h2>
<p>Your Personal Year number decides how 2027 feels for you. Pick yours for career, love, money, health and a month-by-month forecast.</p>
<div class="link-grid">{py_cards}</div>

<h2 id="mulank">Mulank 2027 at a glance</h2>
<p>In Indian numerology your Mulank (birth number) is your birth day reduced to one digit. Each Mulank is ruled by a planet, and 2027's Moon either supports that planet or tests it.</p>
<div class="table-wrap"><table><thead><tr><th>Mulank</th><th>Planet</th><th>2027 for you</th></tr></thead><tbody>{mul_rows}</tbody></table></div>
<p><a class="text-link" href="{BLOG}mulank-predictions-2027.html">Read Mulank 1 to 9 predictions for 2027, in English and Hindi</a></p>

<h2 id="career">2027 numerology career predictions</h2>
<p>A 2 year rewards people who make others successful. Promotions tend to come through someone vouching for you, clients through referrals, and growth through partnerships. Support roles, client service, HR, counselling, negotiation, law, hospitality and healthcare are well placed.</p>
<p>Personal Years 1 and 8 are the strongest for career moves in 2027. Personal Year 7 is better for skills and qualifications than for switching jobs. Personal Year 9 is for completing projects and handing over, with new starts in 2028.</p>

<h2 id="love">2027 love numerology predictions</h2>
<p>Relationships are the centre of a 2 year. It is one of the better years for engagement, marriage talks and repairing family relationships, and one of the harder years for people who avoid difficult conversations. Feelings run high, so small comments land harder than usual.</p>
<p>Personal Years 2 and 6 are the strongest for commitment. Personal Year 9 brings endings for relationships that have run their course. Personal Year 5 brings new people and less patience for routine.</p>

<h2 id="money">2027 numerology money and finance predictions</h2>
<p>Money in a 2 year grows steadily rather than suddenly. Joint finances, family money, partnership income and savings plans do well. Speculative bets, impulse trades and lending without paperwork are the usual leaks.</p>
<p>Personal Year 8 is the strongest money year of the cycle. Personal Year 4 is for clearing loans and fixing budgets. Personal Year 5 sees money move in and out quickly, so keep an emergency fund. This is numerology, not financial advice.</p>

<h2 id="health">2027 numerology health predictions</h2>
<p>The Moon governs the mind, sleep and fluids in traditional texts, so 2027's health theme is emotional balance. Stress shows up first in sleep, digestion and mood. Regular sleep, water, walks and time away from screens matter more than usual. Numerology is not medical advice; see a doctor for anything that worries you.</p>

<h2 id="business">2027 numerology for business</h2>
<p>A good year to find a partner, sign distributors, build client relationships and fix contracts. A weaker year for going it alone. Check that your business name supports you with the <a href="/calculators/lucky-business-name.html">business name numerology calculator</a>, and launch new products in a Personal Month 1 or 8. In the universal calendar, August (a 1 month) is the year's second start.</p>

<h2 id="lucky">2027 lucky numbers and colours</h2>
<p>The year's own numbers are 2 and 11. Dates that reduce to 2 carry the year's energy: the 2nd, 11th, 20th and 29th of any month. White, silver and cream are the Moon's colours, and Monday is its day.</p>
<p>Your personal lucky numbers and colours come from your Mulank. The <a href="{BLOG}mulank-predictions-2027.html">Mulank 2027 post</a> lists them for each number.</p>

<h2 id="remedies">2027 numerology remedies</h2>
<p>Remedies for a Moon year are simple and suit everyone:</p>
<ul>
<li>Offer water or milk to a Shivling on Mondays.</li>
<li>Spend time with your mother or an elder woman in the family, and look after her needs.</li>
<li>Keep a fixed sleep time and drink enough water.</li>
<li>Wear white or silver on important days.</li>
</ul>
<p>The remedy for your own number is in your <a href="#by-personal-year">Personal Year post</a>.</p>

<h2 id="monthly">2027 numerology monthly forecast</h2>
<p>Each month of 2027 has a universal number: the year's 2 plus the calendar month, reduced. These describe the world's mood. Your own month is your Personal Year plus the calendar month, and is listed in each Personal Year post.</p>
<div class="table-wrap"><table><thead><tr><th>Month</th><th>Number</th><th>What it favours</th></tr></thead><tbody>{um_rows}</tbody></table></div>

<h2 id="vedic">Vedic numerology predictions 2027 for India</h2>
<p>In the Indian system the year number is read with its ruling planet. 2027 is the Moon's year. The Moon is a natural friend of the Sun, Jupiter and Mars, so Mulank 1, 3 and 9 find it supportive. Its relationship with Rahu and Saturn is uneasy, so Mulank 4 and 8 need more patience. Mulank 2 sees the Moon doubled. Mercury, Venus and Ketu (Mulank 5, 6 and 7) see mixed results.</p>
<p>This is a numerology reading. Planetary transits and your own dasha come from your birth chart and are read in a <a href="/vedic-kundli-booking.html">Vedic kundli consultation</a>.</p>

<h2 id="name">2027 name numerology predictions</h2>
<p>Your name number does not change with the year, but how it sits with the year does. Name numbers 1, 2, 3 and 9 are comfortable in a Moon year. Name numbers 4 and 8 work better with extra structure and patience. If you are thinking about a spelling change, a 2 year is a good time to try it in daily use before committing. Find yours with the <a href="/calculators/name-numerology.html">name numerology calculator</a>.</p>
"""


add(slug="2027-numerology-predictions", cat="2027 Forecast",
    title="2027 Numerology Predictions & Forecast: Universal Year 11/2",
    h1="2027 Numerology Predictions and Forecast",
    desc="What 2027 means in numerology: Universal Year 11/2, ruled by the Moon. Free 2027 personal year calculator, predictions by date of birth and monthly forecast.",
    card="What the Universal Year 11/2 means for career, love, money and health, with a free calculator and month-by-month forecast.",
    lede="2027 is a Universal Year 11/2. After the fresh start of 2026, the world slows down and works through other people: partnerships, agreements, marriages, negotiations and patience. Here is what that means for you.",
    body=body_hub(), faqs=HUB_FAQ, question="Hi Veshannastro, I have a question about 2027.",
    related=["personal-year-number-2027-calculator", "mulank-predictions-2027", "personal-year-2-in-2027"])

# 2. Calculator guide -------------------------------------------------------------
CALC_FAQ = [
    ("How do I calculate my personal year number for 2027?", "Reduce your birth day to one digit, reduce your birth month to one digit, add 2 for 2027, and reduce the total to one digit. Born 14 March: 1 + 4 = 5, March is 3, so 5 + 3 + 2 = 10, and 1 + 0 = 1. Personal Year 1."),
    ("Do I use my birth year?", "No. The Personal Year uses your birth day, your birth month and the current year. Your birth year is used for your life path number (Bhagyank), which does not change."),
    ("Why is 2027 counted as 2?", "Because 2 + 0 + 2 + 7 = 11, and 1 + 1 = 2. Some numerologists keep the 11 visible and call 2027 an 11/2 year."),
    ("When does my Personal Year start: 1 January or my birthday?", "This calculator uses the calendar year, 1 January to 31 December, which is the most common method. Some numerologists start it on your birthday instead; if you follow that method, read the year before as well for the months before your birthday."),
    ("2027 mein mera saal kaisa rahega, kaise pata karein?", "Apni janm tareekh ko ek ank tak jodiye, janm ka mahina bhi ek ank tak, phir 2027 ke liye 2 jodiye aur kul ko ek ank tak ghataaiye. Yahi aapka 2027 Personal Year hai. Jaise 14 March: 1 + 4 = 5, March 3, to 5 + 3 + 2 = 10, yaani 1. Har Personal Year ka 2027 ka matlab upar ki list mein hai."),
    ("Personal Year aur Mulank mein kya fark hai?", "Mulank sirf janm tareekh (din) se nikalta hai aur kabhi nahi badalta. Personal Year har saal badalta hai, kyunki usmein saal ka ank judta hai. Mulank batata hai aap kaise hain; Personal Year batata hai ki yeh saal kis baare mein hai."),
    ("Is the 2027 personal year calculator free?", "Yes. It runs in your browser, needs no sign-up, and nothing you type is stored."),
]


def body_calc():
    rows = ""
    for d, m, mname in [(14, 3, "March"), (23, 11, "November"), (8, 7, "July"), (1, 1, "January"), (29, 12, "December"), (4, 5, "May")]:
        rd, rm = reduce(d), reduce(m)
        tot = rd + rm + 2
        work = f"{rd} + {rm} + 2 = {tot}" + (f" = {reduce(tot)}" if tot > 9 else "")
        rows += f"<tr><th>{d} {mname}</th><td>{work}</td><td><a href=\"{BLOG}personal-year-{reduce(tot)}-in-2027.html\">Personal Year {reduce(tot)}</a></td></tr>"
    meaning_rows = "".join(
        f'<tr><th><a href="{BLOG}personal-year-{n}-in-2027.html">{n}</a></th><td>{PLANET[n]}</td><td>{PY[n]["name"]}</td></tr>' for n in range(1, 10))
    pm_rows = "".join(f"<tr><th>{k}</th><td>{v}</td></tr>" for k, v in PERSONAL_MONTH.items())
    return f"""
{toc([("calculator", "2027 personal year calculator"), ("method", "How to calculate it by hand"), ("examples", "Worked examples"),
      ("eleven", "When the sum passes through 11"), ("meanings", "What each Personal Year means"), ("months", "Personal Months"),
      ("difference", "Personal Year, Mulank and life path"), ("faq", "Questions")])}

<h2 id="calculator">2027 personal year calculator</h2>
<p>Enter your birth day, month and year. The result appears as you type, with the working shown.</p>
{finder("-calc")}

<h2 id="method">How to calculate your personal year number for 2027</h2>
<p>Your Personal Year number describes the theme of one calendar year for you. It changes every year and moves through a cycle from 1 to 9. Three numbers go into it: your birth day, your birth month and the year itself.</p>
<ol>
<li><strong>Reduce your birth day to one digit.</strong> Born on the 23rd: 2 + 3 = 5. Born on the 8th: it stays 8.</li>
<li><strong>Reduce your birth month to one digit.</strong> January is 1, September is 9, October is 1 + 0 = 1, November is 1 + 1 = 2, December is 1 + 2 = 3.</li>
<li><strong>Reduce the year.</strong> 2027 is 2 + 0 + 2 + 7 = 11, and 1 + 1 = 2.</li>
<li><strong>Add the three and reduce to one digit.</strong> Born 23 November: 5 + 2 + 2 = 9. Personal Year 9.</li>
</ol>
<p>Your birth year is not part of this. It is used for your life path number, which stays the same all your life.</p>

<h2 id="examples">Worked examples for 2027</h2>
<div class="table-wrap"><table><thead><tr><th>Birthday</th><th>Working</th><th>2027 result</th></tr></thead><tbody>{rows}</tbody></table></div>

<h2 id="eleven">When the sum passes through 11</h2>
<p>If your birth day and month add up with 2 to exactly 11 before you reduce, as for someone born on 4 May (4 + 5 + 2 = 11), many numerologists call it an 11/2 Personal Year: a Personal Year 2 with the master number 11's sharper intuition and nervous energy. Read the <a href="{BLOG}personal-year-2-in-2027.html">Personal Year 2 post</a> and its section on 11/2.</p>

<h2 id="meanings">What each Personal Year means in 2027</h2>
<div class="table-wrap"><table><thead><tr><th>Number</th><th>Ruling planet</th><th>Theme</th></tr></thead><tbody>{meaning_rows}</tbody></table></div>

<h2 id="months">Personal Months inside the year</h2>
<p>Each month also has a number: your Personal Year plus the calendar month, reduced. If you are in Personal Year 3, March is 3 + 3 = 6 and October is 3 + 10 = 13, which reduces to 4. Each Personal Year post lists all twelve months for you.</p>
<div class="table-wrap"><table><thead><tr><th>Personal Month</th><th>What it is for</th></tr></thead><tbody>{pm_rows}</tbody></table></div>

<h2 id="difference">Personal Year, Mulank and life path: the difference</h2>
<p><strong>Personal Year</strong>: birth day + birth month + current year. Changes every year. Describes the year's theme.</p>
<p><strong>Mulank</strong> (birth number): your birth day reduced. Never changes. Describes your nature and how a year's ruling planet sits with yours. See <a href="{BLOG}mulank-predictions-2027.html">Mulank predictions 2027</a>.</p>
<p><strong>Life path number</strong> (Bhagyank): your full date of birth reduced. Never changes. Describes your life's direction. Calculate it with the <a href="/calculators/life-path-number.html">life path number calculator</a>.</p>
"""


add(slug="personal-year-number-2027-calculator", cat="2027 Forecast",
    title="Personal Year Number 2027 Calculator: How to Calculate Yours",
    h1="How to calculate your Personal Year number for 2027",
    desc="Free 2027 personal year calculator, plus how to calculate your personal year number for 2027 by hand, with worked examples, 11/2 years and Personal Months.",
    card="Free 2027 personal year calculator, the method step by step, and worked examples for different birthdays.",
    lede="Your Personal Year number sets the theme of 2027 for you. Use the free calculator below, or work it out by hand in four steps.",
    body=body_calc(), faqs=CALC_FAQ, question="Hi Veshannastro, I have a question about my 2027 Personal Year.",
    related=["2027-numerology-predictions", "personal-year-2-in-2027", "mulank-predictions-2027"])


# 3-11. Personal Year posts --------------------------------------------------------
def body_py(n):
    d = PY[n]
    months = personal_months(n)
    rows = "".join(f"<tr><th>{m}</th><td>{pm}</td><td>{PERSONAL_MONTH[pm]}</td></tr>" for m, pm in months)
    best = [m for m, pm in months if pm in (1, 8)]
    slow = [m for m, pm in months if pm in (7, 9)]
    ex_txt = ", ".join(f"{dd} {mm}" for dd, mm in example_birthdays(n))
    extra, extra_toc = "", []
    if d.get("extra"):
        h, paras = d["extra"]
        extra = f'<h2 id="eleven">{h}</h2>' + "".join(f"<p>{p}</p>" for p in paras)
        extra_toc = [("eleven", "The 11/2 year")]
    others = "".join(f'<li><a href="{BLOG}personal-year-{k}-in-2027.html">Personal Year {k} in 2027</a></li>' for k in range(1, 10) if k != n)
    items = [("who", f"Who is in Personal Year {n}")] + extra_toc + [("career", "Career"), ("love", "Love"), ("money", "Money"), ("health", "Health"),
             ("months", "2027 month by month"), ("avoid", "What to avoid"), ("remedy", "Remedy"), ("faq", "Questions")]
    return f"""
<dl class="facts"><div><dt>Ruling planet</dt><dd>{PLANET[n]}</dd></div><div><dt>Lucky colour</dt><dd>{d['colour']}</dd></div><div><dt>Lucky day</dt><dd>{d['day']}</dd></div><div><dt>Lucky numbers</dt><dd>{d['numbers']}</dd></div></dl>
{toc(items)}
<h2 id="who">Who is in Personal Year {n} in 2027?</h2>
<p>Reduce your birth day and your birth month to one digit each, add 2 for 2027, and reduce again. If you land on {n}, this post is yours. Some birthdays in Personal Year {n} for 2027: {ex_txt}. Check yours below.</p>
{finder(f"-py{n}")}
{extra}
<h2 id="career">Career in Personal Year {n}</h2><p>{d['career']}</p>
<h2 id="love">Love and relationships</h2><p>{d['love']}</p>
<h2 id="money">Money</h2><p>{d['money']}</p>
<h2 id="health">Health</h2><p>{d['health']}</p>
<h2 id="months">Personal Year {n}: 2027 month by month</h2>
<p>Each month has its own Personal Month number: {n} plus the calendar month, reduced. Your strongest months for decisive action in 2027 are <strong>{join_and(best)}</strong>. Go slower in <strong>{join_and(slow)}</strong>.</p>
<div class="table-wrap"><table><thead><tr><th>Month</th><th>Personal Month</th><th>What it is for</th></tr></thead><tbody>{rows}</tbody></table></div>
<h2 id="avoid">What to avoid in Personal Year {n}</h2><p>{d['avoid']}</p>
<h2 id="remedy">Remedy for Personal Year {n}</h2><p>{d['remedy']}</p>
<!--FAQ-->
<section class="related" aria-labelledby="other-py"><h2 id="other-py">Other Personal Years in 2027</h2><ul>{others}</ul></section>
"""


for n in range(1, 10):
    d = PY[n]
    faqs = list(d["faq"]) + [
        (f"Who is in Personal Year {n} in 2027?", f"Anyone whose birth day and birth month, each reduced to one digit, add up with 2 to {n}. Examples: {', '.join(f'{a} {b}' for a, b in example_birthdays(n))}."),
        (f"What are the lucky colour, day and numbers for Personal Year {n}?", f"Colour: {d['colour'].lower()}. Day: {d['day']}. Numbers: {d['numbers']}."),
    ]
    add(slug=f"personal-year-{n}-in-2027", cat="Personal Year 2027",
        title=f"Personal Year {n} in 2027: {d['name']} | Veshannastro",
        h1=f"Personal Year {n} in 2027",
        desc=(f"Personal Year {n} in 2027 ({d['name'].lower()}): career, love, money, health, month-by-month forecast, lucky colour and remedy."
              if n != 2 else "Personal Year 2 in 2027 meaning: a doubled 2 in an 11/2 year. Career, love, money and health predictions, month-by-month forecast, lucky colour, remedy."),
        card=f"{d['name']}. Career, love, money, health and your month-by-month 2027.",
        lede=f"{d['name']}. {d['summary']}",
        body=body_py(n), faqs=faqs, question=f"Hi Veshannastro, I am in Personal Year {n} for 2027 and have a question.",
        related=["2027-numerology-predictions", "personal-year-number-2027-calculator", "mulank-predictions-2027"])


# 12. Mulank predictions 2027 --------------------------------------------------------
MULANK_FAQ = [
    ("What is Mulank?", "Mulank, also spelled moolank, is your birth number in Indian numerology: the day you were born, reduced to one digit. Born on the 27th: 2 + 7 = 9, so Mulank 9."),
    ("How is Bhagyank calculated?", "Add every digit of your full date of birth and reduce to one digit. Born 27/09/1994: 2 + 7 + 0 + 9 + 1 + 9 + 9 + 4 = 41, and 4 + 1 = 5. Bhagyank 5."),
    ("Which Mulank is luckiest in 2027?", "In a Moon year, Mulank 1, 3 and 9 have the most natural support, and Mulank 2 has the year's energy doubled. Mulank 4 and 8 need more patience. Every Mulank has good months; they show up in your Personal Year."),
    ("2027 kaisa rahega mulank ke anusar?", "2027 ka ank 2 hai, jiska swami Chandrama hai. Mulank 1, 3 aur 9 ke liye saal sahayak hai, Mulank 2 ke liye Chandra ki urja dugni hai, Mulank 5, 6 aur 7 ke liye mila-jula hai, aur Mulank 4 aur 8 ke liye dhairya ka saal hai."),
    ("Moolank 2027 bhavishya kaise padhein?", "Apni janm tareekh ke ank jodiye jab tak ek ank na bache, wahi aapka moolank hai (27 tareekh: 2 + 7 = 9). Ank jyotish 2027 mein har moolank ka bhavishya uske grah aur Chandrama ke rishte se dekha jata hai. Upar apne moolank ka career, paisa, rishte, sehat, shubh rang aur upay padhiye, aur mahine ke hisaab se samay ke liye apna Personal Year bhi dekhiye."),
    ("What is the difference between Mulank and Personal Year?", "Mulank describes your nature and never changes. Your Personal Year uses your birth day and birth month with the current year, so it changes every year. Read both: Mulank for how the year sits with you, Personal Year for the year's theme."),
]


def body_mulank():
    quick = "".join(f'<tr><th><a href="#mulank-{n}">Mulank {n}</a></th><td>{PLANET[n]}</td><td>{MULANK[n]["tone"]}</td></tr>' for n in range(1, 10))
    sections = ""
    for n in range(1, 10):
        m = MULANK[n]
        sections += f"""
<section id="mulank-{n}">
<h2 class="mulank-head"><span class="n" aria-hidden="true">{n}</span><span>Mulank {n} prediction 2027 ({PLANET[n]})</span></h2>
<p class="mulank-sub hindi" lang="hi">मूलांक {n} के लिए 2027 कैसा रहेगा ({PLANET_HI[n]})</p>
<p><strong>{m['tone']}.</strong> {m['rel']} {m['body']}</p>
<div class="table-wrap"><table><tbody>
<tr><th>Career</th><td>{m['career']}</td></tr>
<tr><th>Money</th><td>{m['money']}</td></tr>
<tr><th>Love and family</th><td>{m['love']}</td></tr>
<tr><th>Health</th><td>{m['health']}</td></tr>
<tr><th>Lucky colour, day, numbers</th><td>{m['colour']}. {m['day']}. {m['numbers']}.</td></tr>
<tr><th>Remedy</th><td>{m['remedy']}</td></tr>
</tbody></table></div>
<p class="hindi" lang="hi">{m['hi']}</p>
</section>"""
    bh_rows = "".join(f"<tr><th>Bhagyank {n}</th><td>{PLANET[n]}</td><td>{t}</td></tr>" for n, t in BHAGYANK.items())
    return f"""
<p class="lede hindi" lang="hi" style="margin-top:-8px">मूलांक के अनुसार 2027 कैसा रहेगा: मूलांक 1 से 9 का 2027 भविष्यफल</p>
{toc([("calculator", "Mulank and Bhagyank calculator"), ("how", "How these predictions are read")] + [(f"mulank-{n}", f"Mulank {n}") for n in range(1, 10)] + [("bhagyank", "Bhagyank predictions 2027"), ("birth-number", "Birth number and life path"), ("faq", "Questions")])}

<h2 id="calculator">Mulank and Bhagyank calculator</h2>
<p>Enter your date of birth to find your Mulank (birth number), Bhagyank (destiny number) and 2027 Personal Year.</p>
<div class="finder" data-mulank-calc>
<form class="finder-form" autocomplete="off" aria-label="Mulank and Bhagyank calculator">
<div class="field"><label for="m-day">Birth day</label><input id="m-day" name="day" type="number" inputmode="numeric" min="1" max="31" placeholder="27"></div>
<div class="field"><label for="m-month">Birth month</label><select id="m-month" name="month"><option value="">Select</option></select></div>
<div class="field"><label for="m-year">Birth year</label><input id="m-year" name="year" type="number" inputmode="numeric" min="1900" placeholder="1994"></div>
</form>
<div class="finder-result" aria-live="polite"><p class="finder-empty">Enter your full date of birth to find your Mulank, Bhagyank and 2027 Personal Year.</p></div>
</div>

<h2 id="how">How these predictions are read</h2>
<p>2027 adds up to 11, which reduces to 2, and 2 is the Moon's number. Each Mulank is ruled by a planet: 1 Sun, 2 Moon, 3 Jupiter, 4 Rahu, 5 Mercury, 6 Venus, 7 Ketu, 8 Saturn, 9 Mars. The classical friendships between planets set the tone: the Sun, Jupiter and Mars are friends of the Moon; Rahu and Saturn are not. That gives each Mulank its starting point for the year.</p>
<div class="table-wrap"><table><thead><tr><th>Mulank</th><th>Planet</th><th>2027 tone</th></tr></thead><tbody>{quick}</tbody></table></div>
{sections}

<h2 id="bhagyank">Bhagyank predictions 2027</h2>
<p>Bhagyank, your destiny number, is your full date of birth reduced to one digit. It shows your life's direction; 2027's Moon shows how the year supports it. In Western numerology the same number is called the life path number, so this is also your life path number prediction for 2027.</p>
<div class="table-wrap"><table><thead><tr><th>Bhagyank</th><th>Planet</th><th>2027 for your direction</th></tr></thead><tbody>{bh_rows}</tbody></table></div>

<h2 id="birth-number">Birth number and life path number 2027 predictions</h2>
<p>Your birth number is your Mulank, so the sections above are your birth number predictions for 2027. Your life path number is your Bhagyank. For the theme of the year itself, use your <a href="{BLOG}personal-year-number-2027-calculator.html">2027 Personal Year</a>, which combines your birth day and month with 2027.</p>
"""


add(slug="mulank-predictions-2027", cat="Mulank 2027",
    title="Mulank Predictions 2027 in English & Hindi | Veshannastro",
    h1="Mulank Predictions 2027: Mulank 1 to 9",
    desc="Mulank 1 to 9 predictions for 2027 by ank jyotish: career, money, love, health, lucky colour and remedy, in English and Hindi. Free Mulank calculator.",
    card="Mulank 1 to 9 for 2027 by ank jyotish, in English and Hindi, with a free Mulank and Bhagyank calculator.",
    lede="2027 is a year of the number 2, ruled by the Moon. In ank jyotish, how the year treats you depends on whether your Mulank's planet is a friend of the Moon. Here is the 2027 prediction for every Mulank.",
    body=body_mulank(), faqs=MULANK_FAQ, question="Hi Veshannastro, I have a question about my Mulank for 2027.",
    related=["2027-numerology-predictions", "personal-year-number-2027-calculator", "personal-year-8-in-2027"])

# Supplied article: wording is maintained verbatim in a separate source file.
def supplied_article():
    from pathlib import Path
    text = Path(REPO, "content/blog/numerology-2027.txt").read_text(encoding="utf-8")
    lines = text.strip().splitlines()
    def linked(line):
        # Preserve the visible URL and wording, adding only crawlable link markup.
        return re.sub(r"https://[^\s<]+", lambda m: '<a href="' + m.group() + '">' + m.group() + '</a>', esc(line))
    out = ['<h1>' + esc(lines[0]) + '</h1>', '<p class="post-meta">' + esc(lines[1]) + '</p>']
    headings = {"How to find your Moolank", "Remedies for 2027, a Moon year", "A note on Moolank and Personal Year", "Also on Veshannastro - the full 2027 cluster"}
    out.append('<img src="/images/blog/numerology-2027.jpg" width="1200" height="630" alt="2027 numerology artwork" style="display:block;width:100%;height:auto;border-radius:16px;margin:24px 0">')
    for block in "\n".join(lines[2:]).strip().split("\n\n"):
        block = block.strip()
        if not block:
            continue
        if block.startswith("- "):
            out.append('<ul>' + ''.join('<li>' + linked(line[2:]) + '</li>' for line in block.splitlines()) + '</ul>')
        elif block in headings or block.startswith("Numerology Number "):
            anchor = re.sub(r"[^a-z0-9]+", "-", block.lower()).strip("-")
            out.append('<h2 id="' + anchor + '">' + esc(block) + '</h2>')
        else:
            out.append('<p>' + linked(block) + '</p>')
    return "\n".join(out)

add(slug="numerology-2027", cat="2027 Forecast",
    title="Numerology Horoscope 2027: Moolank 1 to 9 Predictions | Veshannastro",
    h1="Numerology 2027",
    desc="Numerology 2027 by Shashank Agrawal: a Moon-year horoscope for Moolank 1 to 9, covering career, money, relationships, personal growth and remedies.",
    card="A 2027 numerology horoscope for all nine Moolank numbers, with career, relationships and Moon-year remedies.",
    lede="", body=supplied_article(), faqs=[], verbatim=True,
    question="Hi Veshannastro, I have a question about Numerology 2027.",
    related=["2027-numerology-predictions", "mulank-predictions-2027", "personal-year-number-2027-calculator"])
for post in POSTS:
    if post["slug"] in ("2027-numerology-predictions", "mulank-predictions-2027", "personal-year-number-2027-calculator"):
        post["related"].append("numerology-2027")

BY_SLUG = {p["slug"]: p for p in POSTS}


# --------------------------------------------------------------------------- templates
def words(html):
    return len(re.sub(r"<[^>]+>", " ", html).split())


def read_mins(p):
    total = words(p["body"]) + words(p["lede"]) + sum(words(q) + words(a) for q, a in p["faqs"])
    return max(3, round(total / 200))


def video_block(slug):
    v = VIDEOS.get(slug)
    if not v:
        return "", None
    vid = v["id"]
    html = (f'<div class="video"><a href="https://www.youtube.com/watch?v={vid}" data-yt="{vid}" target="_blank" rel="noopener" aria-label="Play video: {esc(v["title"])}">'
            f'<img src="https://i.ytimg.com/vi/{vid}/hqdefault.jpg" alt="" loading="lazy" width="480" height="360"><span class="play">{PLAY}Watch the video</span></a></div>'
            f'<p class="video-caption">{esc(v["title"])}</p>')
    schema = {"@type": "VideoObject", "name": v["title"], "description": v.get("desc", v["title"]),
              "thumbnailUrl": f"https://i.ytimg.com/vi/{vid}/hqdefault.jpg", "uploadDate": v["upload"],
              "embedUrl": f"https://www.youtube.com/embed/{vid}", "contentUrl": f"https://www.youtube.com/watch?v={vid}"}
    return html, schema


def card(p, tag="h3"):
    mins = read_mins(p)
    return (f'<a class="post-card" href="{BLOG}{p["slug"]}.html"><img src="/images/blog/{p["slug"]}.jpg" width="1200" height="630" alt="" loading="lazy">'
            f'<div class="pc-body"><span class="pc-cat">{p["cat"]}</span><{tag}>{p["h1"]}</{tag}><p>{p["card"]}</p><span class="pc-meta">{mins} min read</span></div></a>')


def verbatim_post_page(p):
    path = f"{BLOG}{p['slug']}.html"
    crumbs = [("/2027-numerology-report/", "Home"), (BLOG, "Blog"), (path, p["h1"])]
    related = "".join(card(BY_SLUG[x]) for x in p["related"])
    html = f"""<div class="wrap">{crumb_html(crumbs)}
<p class="post-meta"><time datetime="2026-10-30">30 October 2026</time> · {read_mins(p)} min read</p>
<article class="article" id="supplied-article" style="overflow-wrap:anywhere">{p['body']}</article>
{AUTHOR_BOX}
<section class="blog-group" aria-labelledby="keep-reading"><h2 id="keep-reading">Keep reading</h2><div class="post-list">{related}</div></section></div>"""
    schema = [{"@type": "BlogPosting", "@id": url(path) + "#post", "headline": p["h1"], "description": p["desc"],
        "datePublished": "2026-10-30", "dateModified": "2026-10-30", "image": BASE + "/images/blog/numerology-2027.jpg",
        "author": {"@type": "Person", "@id": PERSON_ID, "name": "Shashank Agrawal", "url": BASE + "/about.html"},
        "publisher": {"@type": "Organization", "@id": ORG_ID, "name": "Veshannastro"},
        "mainEntityOfPage": url(path), "articleSection": p["cat"], "inLanguage": "en-IN", "wordCount": words(p["body"])}]
    return page(path, p["title"], p["desc"], html, crumbs=crumbs, schema=schema, og_type="article",
        og_image="/images/blog/numerology-2027.jpg", active=BLOG, wa_text=p["question"])


def post_page(p):
    if p.get("verbatim"):
        return verbatim_post_page(p)
    path = f"{BLOG}{p['slug']}.html"
    crumbs = [("/2027-numerology-report/", "Home"), (BLOG, "Blog"), (path, p["h1"])]
    mins = read_mins(p)
    vhtml, vschema = video_block(p["slug"])
    faq_block = f'<h2 id="faq">Questions</h2><div class="faq">{faq_html(p["faqs"])}</div>'
    body = p["body"]
    body = body.replace("<!--FAQ-->", faq_block) if "<!--FAQ-->" in body else body + faq_block
    related = "".join(card(BY_SLUG[s]) for s in p["related"] if s in BY_SLUG)
    html = f"""<div class="wrap">{crumb_html(crumbs)}
<article class="article">
<header class="article-head">
<p class="post-cat"><a href="{BLOG}#{p['cat'].lower().replace(' ', '-')}">{p['cat']}</a></p>
<h1>{p['h1']}</h1>
<p class="lede">{p['lede']}</p>
<p class="post-meta"><span>By <a href="/about.html">Shashank Agrawal</a></span><span><time datetime="{PUBLISHED}">{PUBLISHED_TEXT}</time></span><span>{mins} min read</span></p>
</header>
{vhtml}
{body}
{cta(p['question'])}
{AUTHOR_BOX}
</article>
<section class="blog-group" aria-labelledby="keep-reading"><h2 id="keep-reading">Keep reading</h2><div class="post-list">{related}</div></section>
</div>"""
    schema = [{"@type": "BlogPosting", "@id": url(path) + "#post", "headline": p["h1"], "description": p["desc"],
               "datePublished": PUBLISHED, "dateModified": UPDATED, "image": f"{BASE}/images/blog/{p['slug']}.jpg",
               "author": {"@type": "Person", "@id": PERSON_ID, "name": "Shashank Agrawal", "url": BASE + "/about.html"},
               "publisher": {"@type": "Organization", "@id": ORG_ID, "name": "Veshannastro", "logo": {"@type": "ImageObject", "url": BASE + "/images/logo.jpg"}},
               "mainEntityOfPage": url(path), "articleSection": p["cat"], "inLanguage": "en-IN", "wordCount": words(p["body"])},
              faq_ld(p["faqs"])]
    if vschema:
        schema.append(vschema)
    return page(path, p["title"], p["desc"], html, crumbs=crumbs, schema=schema, og_type="article",
                og_image=f"/images/blog/{p['slug']}.jpg", active=BLOG, wa_text=p["question"])


def index_page():
    crumbs = [("/2027-numerology-report/", "Home"), (BLOG, "Blog")]
    feat = BY_SLUG["2027-numerology-predictions"]
    groups = []
    for cat, intro in [("2027 Forecast", "What 2027 means in numerology, and how to find your own number."),
                       ("Personal Year 2027", "Find your Personal Year with the calculator, then read your year."),
                       ("Mulank 2027", "Indian numerology predictions for every birth number.")]:
        cards = "".join(card(p) for p in POSTS if p["cat"] == cat and p is not feat)
        if cards:
            gid = cat.lower().replace(" ", "-")
            groups.append(f'<section class="blog-group" id="{gid}" aria-labelledby="{gid}-h"><h2 id="{gid}-h">{cat}</h2><p class="muted" style="margin:-8px 0 18px">{intro}</p><div class="post-list">{cards}</div></section>')
    body = f"""<div class="wrap">{crumb_html(crumbs)}
<header class="blog-head"><h1>Numerology blog</h1><p class="lede">2027 predictions, Personal Year readings, Mulank and Bhagyank, and how to work your numbers out yourself. Written by Shashank Agrawal.</p></header>
<a class="featured" href="{BLOG}{feat['slug']}.html"><img src="/images/blog/{feat['slug']}.jpg" width="1200" height="630" alt=""><div class="pc-body"><span class="pc-cat">{feat['cat']}</span><h2>{feat['h1']}</h2><p>{feat['card']}</p><span class="text-link">Read the forecast</span></div></a>
{"".join(groups)}
</div>"""
    items = [{"@type": "ListItem", "position": i + 1, "url": url(f"{BLOG}{p['slug']}.html"), "name": p["h1"]} for i, p in enumerate(POSTS)]
    schema = org_graph() + [{"@type": "Blog", "@id": url(BLOG) + "#blog", "name": "Veshannastro Numerology Blog", "url": url(BLOG),
               "publisher": {"@type": "Organization", "@id": ORG_ID, "name": "Veshannastro"}, "inLanguage": "en-IN"},
              {"@type": "ItemList", "itemListElement": items}]
    return page(BLOG, "Numerology Blog: 2027 Predictions, Personal Year & Mulank",
                "Numerology articles by Shashank Agrawal: 2027 predictions, Personal Year 1 to 9 in 2027, Mulank predictions in English and Hindi, and a free 2027 calculator.",
                body, crumbs=crumbs, schema=schema, active=BLOG, wa_text="Hi Veshannastro, I have a question.")


def build():
    out = [write(REPO, BLOG, index_page())]
    for p in POSTS:
        out.append(write(REPO, f"{BLOG}{p['slug']}.html", post_page(p)))
    return out


if __name__ == "__main__":
    for f in build():
        print(os.path.relpath(f, REPO))
