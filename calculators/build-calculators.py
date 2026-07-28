#!/usr/bin/env python3
"""Generate the 13 standalone numerology calculator pages.

Each page is indexable, self-contained, and uses the same calculation engine
as the on-site modal (calc-engine.js, lifted verbatim from index.html).

Run from the repo root:  python3 calculators/build-calculators.py
"""
import io, os, datetime

BASE = "https://www.veshannastro.co.in"
OUT = os.path.dirname(os.path.abspath(__file__))
TODAY = datetime.date.today().isoformat()

# ── Shared number meanings, reused across several pages ────────────────
CORE = [
    ("1", "The Leader", "Independent, ambitious, pioneering. A number of new beginnings and self-reliance. Ruled by the Sun."),
    ("2", "The Diplomat", "Cooperative, sensitive, intuitive. Harmony and partnership define the path. Ruled by the Moon."),
    ("3", "The Creator", "Expressive, joyful, artistic. Communication and creative self-expression are the gifts. Ruled by Jupiter."),
    ("4", "The Builder", "Disciplined, practical, reliable. Structure and steady work lead to lasting results. Ruled by Rahu/Uranus."),
    ("5", "The Explorer", "Freedom-loving, adventurous, versatile. Change and curiosity fuel the journey. Ruled by Mercury."),
    ("6", "The Nurturer", "Compassionate, responsible, harmonious. Family, beauty and service are the calling. Ruled by Venus."),
    ("7", "The Seeker", "Analytical, introspective, spiritual. Inner wisdom and solitude are the treasures. Ruled by Ketu/Neptune."),
    ("8", "The Achiever", "Powerful, authoritative, materially focused. Business sense and endurance are the strengths. Ruled by Saturn."),
    ("9", "The Humanitarian", "Compassionate, idealistic, universal. Service to others is the highest purpose. Ruled by Mars."),
]

MASTER = [
    ("11", "The Intuitive", "A master number. Heightened spiritual awareness and inspirational leadership, with the nervous sensitivity that accompanies it."),
    ("22", "The Master Builder", "A master number. The rare capacity to turn a large vision into something tangible and lasting."),
    ("33", "The Master Teacher", "A master number. Nurturing on a wide scale, through compassion rather than authority."),
]

CHEIRO_NOTE = """<p>Veshannastro uses the <strong>Cheiro (Chaldean) system</strong>, not the
Pythagorean one you will find on most Western sites. The two assign different values to the same
letters, so they produce different results. Chaldean assigns values 1–8 based on the vibrational
quality of each sound, and deliberately never assigns 9, which is treated as sacred.</p>
<table class="meaning-table">
  <thead><tr><th>Value</th><th>Letters</th></tr></thead>
  <tbody>
    <tr><td>1</td><td>A, I, J, Q, Y</td></tr>
    <tr><td>2</td><td>B, K, R</td></tr>
    <tr><td>3</td><td>C, G, L, S</td></tr>
    <tr><td>4</td><td>D, M, T</td></tr>
    <tr><td>5</td><td>E, H, N, X</td></tr>
    <tr><td>6</td><td>U, V, W</td></tr>
    <tr><td>8</td><td>F, P</td></tr>
  </tbody>
</table>"""


def core_table(intro="", include_master=False):
    rows = "".join(
        "<tr><td>%s</td><td><strong>%s</strong><br>%s</td></tr>" % (n, t, d)
        for n, t, d in (CORE + (MASTER if include_master else []))
    )
    return (intro + '<table class="meaning-table"><thead><tr><th>Number</th>'
            '<th>Meaning</th></tr></thead><tbody>%s</tbody></table>' % rows)


# ── Page definitions ───────────────────────────────────────────────────
PAGES = [
{
 "slug":"lo-shu-grid", "calc":"loshu",
 "title":"Lo Shu Grid Calculator — Free Online, With Missing Numbers Explained",
 "desc":"Free Lo Shu grid calculator. Enter your date of birth to see your 3×3 grid, which numbers are missing or repeated, and what each one means.",
 "h1":"Lo Shu Grid Calculator",
 "eyebrow":"Ancient Chinese Numerology",
 "kw":"lo shu grid calculator, lo shu grid, missing numbers numerology",
 "lede":"Enter your date of birth to build your Lo Shu grid, see which numbers repeat, which are absent, and what those gaps actually indicate.",
 "sections":[
  ("How the Lo Shu grid is built",
   """<p>The Lo Shu grid is a 3×3 square that has been used in Chinese metaphysics for
   centuries. The arrangement is fixed — 4-9-2 on the top row, 3-5-7 in the middle,
   8-1-6 at the bottom — and every row, column and diagonal sums to 15.</p>
   <p>Your personal grid is made by taking every digit of your date of birth and placing
   each one in its corresponding cell. A digit that appears three times fills that cell
   three times. Zeros are ignored — they have no placement in the grid.</p>
   <p>So someone born on 14 March 1992 contributes the digits 1, 4, 3, 1, 9, 9, 2. Their
   grid would show 1 twice, 9 twice, and 2, 3 and 4 once each. Cells 5, 6, 7 and 8 would
   be empty.</p>"""),
  ("What each cell represents",
   """<table class="meaning-table"><thead><tr><th>Cell</th><th>Governs</th></tr></thead><tbody>
   <tr><td>1</td><td><strong>Mind</strong><br>Self-expression, how clearly you communicate what you think.</td></tr>
   <tr><td>2</td><td><strong>Intuition</strong><br>Sensitivity, emotional reading of situations and people.</td></tr>
   <tr><td>3</td><td><strong>Action</strong><br>Memory, imagination, the impulse to begin things.</td></tr>
   <tr><td>4</td><td><strong>Will</strong><br>Discipline, organisation, physical and practical capability.</td></tr>
   <tr><td>5</td><td><strong>Balance</strong><br>The centre of the grid. Emotional steadiness and adaptability.</td></tr>
   <tr><td>6</td><td><strong>Logic</strong><br>Creativity applied with structure; domestic and material care.</td></tr>
   <tr><td>7</td><td><strong>Patience</strong><br>Learning through experience, often the harder way.</td></tr>
   <tr><td>8</td><td><strong>Detail</strong><br>Method, precision, the ability to finish what was started.</td></tr>
   <tr><td>9</td><td><strong>Ambition</strong><br>Drive, purpose, and the scale of what you reach for.</td></tr>
   </tbody></table>"""),
  ("Missing numbers are not a verdict",
   """<p>Most people arrive at the Lo Shu grid worried about their empty cells. It is worth
   being clear about what an absence actually means: a missing number describes a quality
   that does not come to you automatically. It is a tendency, not a sentence, and it says
   nothing about what you are capable of developing deliberately.</p>
   <p>A missing 4, for example, suggests that organisation is not instinctive — not that
   you cannot become organised. Plenty of highly disciplined people have no 4 in their
   grid and built the habit consciously. That is the useful reading.</p>
   <p>Repeated numbers work the same way in reverse. Three 1s does not mean brilliant
   communication; it often means the opposite — an excess that becomes noise. Balance
   across the grid tends to matter more than any single cell.</p>"""),
  ("What the grid does not tell you",
   """<p>The Lo Shu grid is built from your date of birth alone. It knows nothing about
   your birth time, your birthplace, or your name — so it cannot speak to timing, and it
   cannot tell you when a particular period of your life will open or close. For that you
   need a full birth chart with dasha periods, which is a different calculation entirely.</p>
   <p>Treat the grid as a personality sketch rather than a forecast. It is genuinely useful
   for understanding your default settings. It is not a prediction engine.</p>"""),
 ],
 "faqs":[
  ("Do I need my birth time for the Lo Shu grid?",
   "No. The grid uses only the digits of your date of birth. Birth time matters for a Vedic birth chart, not for this calculation."),
  ("What does it mean if a number appears three or more times?",
   "An excess usually behaves like a distortion rather than a strength. Three 1s can indicate someone who talks past people rather than communicating well. Balance across the grid is generally healthier than concentration in one cell."),
  ("Is the Lo Shu grid the same as Vedic numerology?",
   "No. The Lo Shu grid comes from Chinese metaphysics; Vedic and Chaldean numerology are separate traditions. Veshannastro reads them together because they answer different questions, but they are distinct systems."),
 ],
},
{
 "slug":"life-path-number", "calc":"lifepath",
 "title":"Life Path Number Calculator — Free, With Full Meanings",
 "desc":"Calculate your Life Path number from your date of birth. Free calculator with the meaning of numbers 1 to 9 and master numbers 11, 22 and 33.",
 "h1":"Life Path Number Calculator",
 "eyebrow":"The Soul's Journey",
 "kw":"life path number calculator, life path number, numerology life path",
 "lede":"Your Life Path number is the broad theme of your life — the terrain you keep returning to. Enter your date of birth to find it.",
 "sections":[
  ("How the Life Path number is calculated",
   """<p>Add every digit of your date of birth together, then keep reducing the total until
   a single digit remains. The exception is 11, 22 and 33 — the master numbers — which are
   left unreduced.</p>
   <p>For 14 March 1992: 1+4 = 5, 0+3 = 3, 1+9+9+2 = 21 → 2+1 = 3. Then 5+3+3 = 11. Because
   11 is a master number, it stays as 11 rather than reducing to 2.</p>
   <p>This is the most stable number in your chart. Unlike your name, which you can change,
   your date of birth is fixed — so your Life Path does not move.</p>"""),
  ("What each Life Path number means", core_table(include_master=True)),
  ("Reading your number honestly",
   """<p>A Life Path number describes a theme, not a job title. A Life Path 8 is not obliged
   to go into business, and a Life Path 7 is not required to become a monk. What the number
   describes is the kind of problem you will keep being handed, and the quality you will
   keep being asked to develop.</p>
   <p>The most common misreading is treating a number as a ceiling. A Life Path 4 sometimes
   gets described as "limited to routine work" — which is nonsense. It describes someone for
   whom structure is the natural route to whatever they want, including ambitious things.</p>
   <p>Master numbers deserve a caution of their own. An 11 or 22 is not a superior number.
   They describe a higher-tension version of 2 and 4 respectively — more potential, and more
   difficulty regulating it. Many people with master numbers live most of their lives on the
   reduced digit and only occasionally on the master vibration.</p>"""),
 ],
 "faqs":[
  ("What is the difference between a Life Path number and a Destiny number?",
   "Your Life Path comes from your date of birth and describes the terrain you walk. Your Destiny number comes from your name and describes what you are meant to build. One is given; the other can be adjusted."),
  ("Should I reduce 11, 22 and 33?",
   "No. These are master numbers and are conventionally left unreduced. Some practitioners note both forms — 11/2, 22/4 — because most people express the reduced number most of the time."),
  ("Does my Life Path number change?",
   "No. It is derived from your date of birth, which does not change. Name-based numbers can shift if you change your name; your Life Path cannot."),
 ],
},
{
 "slug":"name-numerology", "calc":"name",
 "title":"Name Numerology Calculator — Free Chaldean Name Number",
 "desc":"Free name numerology calculator using the Chaldean (Cheiro) system. Enter your name to get its vibration number and what that vibration projects.",
 "h1":"Name Numerology Calculator",
 "eyebrow":"Name Vibration Analysis",
 "kw":"name numerology calculator, chaldean numerology, name number calculator",
 "lede":"Every letter carries a numeric value. Enter the name you actually go by and see the vibration it projects.",
 "sections":[
  ("Which system this uses", CHEIRO_NOTE),
  ("Use the name you are actually called",
   """<p>This is the single most common mistake. Numerology reads the name that is <em>used</em>,
   not the name on your certificate. If your passport says Rajendra and everyone has called you
   Raju for thirty years, Raju is the vibration operating in your life.</p>
   <p>If you use different names in different contexts — a formal name at work, a short name at
   home — it is worth calculating both. They will often explain why those two areas of your life
   feel so different.</p>"""),
  ("What each name number projects", core_table()),
  ("On name correction",
   """<p>Name correction — changing a spelling to shift its numeric value — is a real practice,
   and it is also the part of numerology most heavily oversold. A changed spelling only carries
   weight once it is genuinely in use: on your signature, in how people address you, on the
   things you put your name to. Changing a spelling on paper and continuing to be called the
   old name accomplishes very little.</p>
   <p>It is also worth saying plainly that a name change is not a substitute for the underlying
   work. A well-chosen spelling can reduce friction. It does not replace competence, timing or
   effort, and anyone promising that it will is selling something.</p>"""),
 ],
 "faqs":[
  ("Should I include my surname?",
   "Include whatever you are actually addressed by. If you introduce yourself with both names, calculate both. If nobody uses your surname day to day, its influence is weaker."),
  ("Why does this give a different answer from other websites?",
   "Most Western calculators use the Pythagorean system, which assigns letters differently. This one uses Chaldean (Cheiro) values, which is the system used in Indian numerology practice."),
  ("Does changing my name really change anything?",
   "It changes the vibration that is projected, but only once the new form is genuinely in use. A spelling changed on paper and nowhere else has little practical effect."),
 ],
},
{
 "slug":"destiny-number", "calc":"destiny",
 "title":"Destiny Number Calculator — Free Expression Number Tool",
 "desc":"Calculate your Destiny (Expression) number from your full name using Chaldean numerology. Free calculator with meanings for each number.",
 "h1":"Destiny Number Calculator",
 "eyebrow":"Expression Number",
 "kw":"destiny number calculator, expression number, numerology destiny",
 "lede":"Where your Life Path asks who you are, your Destiny number asks what you are meant to build. It comes from your full name.",
 "sections":[
  ("How the Destiny number is calculated",
   """<p>Every letter of your full name is converted to its Chaldean value, the values are
   totalled, and the total is reduced to a single digit. Master numbers 11, 22 and 33 are
   retained.</p>
   <p>Unlike your Life Path, this number can shift — because names can change. Marriage,
   a legal change, or simply adopting a shorter form all alter the calculation.</p>"""),
  ("Which system this uses", CHEIRO_NOTE),
  ("What each Destiny number means", core_table(include_master=True)),
  ("Destiny and Life Path together",
   """<p>The interesting reading is not either number alone but the relationship between them.
   When your Life Path and Destiny numbers are compatible, life tends to feel coherent — what
   you are drawn to and what you are good at point the same way.</p>
   <p>When they conflict, people often describe a persistent sense of working against
   themselves: a Life Path 7 that wants solitude paired with a Destiny 3 that pushes toward
   visibility, for instance. That tension is not a flaw. It usually just means the two need
   deliberate sequencing rather than being forced to happen simultaneously.</p>"""),
 ],
 "faqs":[
  ("Is the Destiny number the same as the Expression number?",
   "Yes. The two terms are used interchangeably. Both refer to the number derived from the full name."),
  ("Should I use my birth name or my current name?",
   "Traditional practice uses the full birth name for the Destiny number, on the basis that it describes what you arrived to do. Your current name is read separately as the vibration you project now."),
  ("What if my Destiny and Life Path numbers are the same?",
   "That is generally read as a strong, single-minded chart — clear direction, with less internal conflict, though sometimes less flexibility."),
 ],
},
{
 "slug":"lucky-number", "calc":"lucky",
 "title":"Lucky Number Calculator — Free, Based on Your Date of Birth",
 "desc":"Find your personal lucky number from your date of birth. Free numerology calculator with an explanation of what the number actually governs.",
 "h1":"Lucky Number Calculator",
 "eyebrow":"Personal Fortune",
 "kw":"lucky number calculator, my lucky number, numerology lucky number",
 "lede":"Your lucky number is derived from your date of birth and describes the vibration you work most easily with.",
 "sections":[
  ("How it is calculated",
   """<p>All digits of your date of birth are added and reduced to a single digit, with master
   numbers retained. It is the same base calculation as the Life Path number — the difference
   is in how it is applied. The Life Path describes your journey; the lucky number is used
   practically, for choosing dates, numbers and timings that will not work against you.</p>"""),
  ("What each number favours", core_table()),
  ("A realistic view of 'lucky'",
   """<p>It is worth being straightforward about this. A lucky number does not make things
   happen. What numerology claims is narrower and more plausible: that certain vibrations sit
   more comfortably with your own, and that when you have a free choice between otherwise
   equivalent options, choosing the aligned one removes a small amount of friction.</p>
   <p>Choosing a house number, a phone number or a date for something significant is where
   this is genuinely useful. Gambling on it is not — and no honest practitioner will encourage
   that reading.</p>"""),
 ],
 "faqs":[
  ("Is my lucky number the same as my Life Path number?",
   "They share the same calculation. The difference is in use: the Life Path is interpretive, the lucky number is applied to practical choices like dates and numbers."),
  ("Can I have more than one lucky number?",
   "Yes. Most charts have a primary number from the date of birth and secondary favourable numbers from the ruling planet and name. A full reading covers all of them."),
  ("Should I use my lucky number for lottery or betting?",
   "No. Numerology describes tendencies and compatibility, not outcomes. Anyone claiming a number will win you money is not practising numerology honestly."),
 ],
},
{
 "slug":"lucky-mobile-number", "calc":"mobile",
 "title":"Lucky Mobile Number Calculator — Free Numerology Check",
 "desc":"Check whether your mobile number is numerologically compatible with you. Free calculator that totals your digits and explains the resulting vibration.",
 "h1":"Lucky Mobile Number Calculator",
 "eyebrow":"Digital Frequency",
 "kw":"lucky mobile number calculator, mobile number numerology, phone number numerology",
 "lede":"Your phone number is one of the numbers you carry every day. Enter it to see the vibration it totals to.",
 "sections":[
  ("How a mobile number is read",
   """<p>Every digit of the number is added together and reduced to a single digit. That
   final digit is the vibration the number carries.</p>
   <p>The reading that matters is not the number in isolation but whether it sits well with
   your own birth number. A phone number totalling 8 is not inherently bad — but paired with
   a birth number that already carries heavy Saturn influence, it can compound a tendency
   toward delay and obstruction rather than balancing it.</p>"""),
  ("What each total tends to support",
   """<table class="meaning-table"><thead><tr><th>Total</th><th>Tends to support</th></tr></thead><tbody>
   <tr><td>1</td><td>Leadership, independent work, starting things. Good for founders and sole practitioners.</td></tr>
   <tr><td>2</td><td>Partnership, negotiation, counselling. Softer, more receptive contact.</td></tr>
   <tr><td>3</td><td>Communication, teaching, creative and client-facing work. Generally favourable for business.</td></tr>
   <tr><td>4</td><td>Structure and routine, but can bring unexpected disruption. Handle with care.</td></tr>
   <tr><td>5</td><td>Networking, sales, travel, high call volume. The most commercially active vibration.</td></tr>
   <tr><td>6</td><td>Relationships, family, hospitality, beauty and care work. Warm and attractive.</td></tr>
   <tr><td>7</td><td>Research and solitude. Often too withdrawn for a business line.</td></tr>
   <tr><td>8</td><td>Money and authority, but slow and heavy. Rewards patience; punishes haste.</td></tr>
   <tr><td>9</td><td>Broad reach and service, but scattered. Can bring conflict if poorly placed.</td></tr>
   </tbody></table>"""),
  ("Before you change your number",
   """<p>Changing a mobile number is genuinely disruptive — clients, banks, two-factor codes,
   years of contacts. It is worth being sure the change is warranted before making it, and
   worth knowing that the numerological gain is usually modest.</p>
   <p>If your number is broadly compatible, leave it. Numerological tuning is for cases where
   a number actively clashes with your chart, not for chasing a marginally better total.</p>"""),
 ],
 "faqs":[
  ("Should I include the country code?",
   "No. Use the 10-digit subscriber number as you would dial it locally. The country code is not part of your personal number."),
  ("Does changing my phone number really make a difference?",
   "The claim is modest: a compatible number removes a small amount of friction from something you use constantly. It will not transform your circumstances, and any practitioner promising that is overselling."),
  ("What if my number totals to an unfavourable digit?",
   "Compatibility depends on your own birth number, not on the total alone. A number that suits one person poorly may suit another well. Check both before deciding anything."),
 ],
},
{
 "slug":"lucky-house-number", "calc":"house",
 "title":"House Number Numerology Calculator — Free Online Tool",
 "desc":"Find the numerology of your house or flat number and what energy it brings to a home. Free calculator handling letters and numbers like B-14.",
 "h1":"House Number Numerology Calculator",
 "eyebrow":"Sacred Space Numerology",
 "kw":"house number numerology, flat number numerology calculator, lucky house number",
 "lede":"The number on your door shapes the energy inside it. Enter your house or flat number — letters included.",
 "sections":[
  ("How a house number is read",
   """<p>Digits are added and reduced to a single number. Where the address includes a letter —
   B-14, 4A, Flat C-302 — the letter is converted to its Chaldean value and added in.</p>
   <p>Use the number of your actual dwelling, not the building or the block. If you live in
   flat 12 of a building numbered 7, your home vibration is 3 (1+2), not 7. The building
   number describes the collective; the flat number describes you.</p>"""),
  ("What each house number brings",
   """<table class="meaning-table"><thead><tr><th>Number</th><th>The home tends to be</th></tr></thead><tbody>
   <tr><td>1</td><td>Independent and self-directed. Suits someone living alone or leading a household. Can feel isolating for a large family.</td></tr>
   <tr><td>2</td><td>Gentle and partnership-oriented. Good for couples. Emotions run close to the surface here.</td></tr>
   <tr><td>3</td><td>Social and expressive. Guests, conversation, creative work. Less good for deep concentration.</td></tr>
   <tr><td>4</td><td>Stable and grounded, built for routine. Can feel constricting if you need change.</td></tr>
   <tr><td>5</td><td>Busy, changeable, full of movement. Unsettled for those who want quiet, energising for those who do not.</td></tr>
   <tr><td>6</td><td>The classic family home — warm, nurturing, focused on care and beauty.</td></tr>
   <tr><td>7</td><td>Quiet and inward. Excellent for study, writing and recovery. Can feel lonely for a social household.</td></tr>
   <tr><td>8</td><td>Ambitious and material. Supports wealth-building, but demands discipline and can feel heavy.</td></tr>
   <tr><td>9</td><td>Open and generous, with a lot of coming and going. Compassionate but rarely private.</td></tr>
   </tbody></table>"""),
  ("If your house number does not suit you",
   """<p>You are not obliged to move. The practical remedies are modest and involve adjusting
   how the number is presented — writing the number differently, adding a nameplate whose
   letters shift the total, or working with the entrance rather than the digits.</p>
   <p>A house number is also only one factor. Direction, layout and the people inside matter
   considerably more. It is not worth losing a home you like over a number.</p>"""),
 ],
 "faqs":[
  ("Should I use my flat number or the building number?",
   "Your flat number. The building number describes the collective energy of everyone in it; your flat number describes your own household."),
  ("What if my address has letters, like B-14?",
   "Include them. The calculator converts letters to Chaldean values and adds them to the digits."),
  ("Do I need to move if the number is unfavourable?",
   "No. Numbers are one factor among many, and there are presentational remedies. Direction, layout and the household itself matter more."),
 ],
},
{
 "slug":"lucky-bank-account", "calc":"bank",
 "title":"Bank Account Number Numerology — Free Calculator",
 "desc":"Check the numerology of your bank account number and what financial vibration it carries. Free calculator with meanings for each total.",
 "h1":"Bank Account Number Calculator",
 "eyebrow":"Financial Frequency",
 "kw":"bank account number numerology, lucky bank account number",
 "lede":"Enter your account number to see the vibration it totals to and what that tends to support financially.",
 "sections":[
  ("How it is read",
   """<p>All digits of the account number are added and reduced to a single digit. That digit
   describes the financial character of the account — whether it favours accumulation,
   circulation, or steady disciplined saving.</p>
   <p>This is one of the lighter applications of numerology, and it is worth treating it as
   such. Your account number is not a significant driver of your financial life. Your income,
   your spending and your discipline are.</p>"""),
  ("What each total tends toward",
   """<table class="meaning-table"><thead><tr><th>Total</th><th>Financial character</th></tr></thead><tbody>
   <tr><td>1</td><td>Wealth through independent initiative. Suits a primary earning account.</td></tr>
   <tr><td>2</td><td>Steady accumulation, often through partnership or joint arrangements.</td></tr>
   <tr><td>3</td><td>Expansion and growth, with a tendency toward generous spending.</td></tr>
   <tr><td>4</td><td>Disciplined saving. Slow and reliable rather than dynamic.</td></tr>
   <tr><td>5</td><td>High circulation — money moves quickly in and out. Good for business, poor for savings.</td></tr>
   <tr><td>6</td><td>Money directed toward home, family and comfort.</td></tr>
   <tr><td>7</td><td>Reserved and withdrawn. Better for long-term holdings than daily use.</td></tr>
   <tr><td>8</td><td>The traditional wealth vibration — but slow, and demanding of patience.</td></tr>
   <tr><td>9</td><td>Broad and giving. Money arrives and is dispersed; hard to retain.</td></tr>
   </tbody></table>"""),
  ("A note on privacy",
   """<p>This calculator runs entirely in your browser. Nothing you type is transmitted,
   stored or logged anywhere. That said, there is no need to enter a full real account
   number to satisfy curiosity — the calculation only reads digits, so any accurate
   digit sequence gives you the same total.</p>"""),
 ],
 "faqs":[
  ("Is my account number sent anywhere?",
   "No. The calculation runs entirely in your browser. Nothing is transmitted or stored."),
  ("Should I open a new account if the number is unfavourable?",
   "Generally not. This is a minor factor. Your earning, spending and saving habits shape your finances far more than an account number does."),
  ("Which account should I check?",
   "The one you use most — usually your primary salary or business account. Dormant accounts carry little weight."),
 ],
},
{
 "slug":"vehicle-number", "calc":"vehicle",
 "title":"Vehicle Number Numerology Calculator — Free Check",
 "desc":"Check your vehicle registration number's numerology. Free calculator handling Indian plate formats like MH12AB1234.",
 "h1":"Vehicle Number Calculator",
 "eyebrow":"Transit Energy",
 "kw":"vehicle number numerology, car number numerology calculator, lucky vehicle number",
 "lede":"Enter your registration number — letters and digits — to see the vibration it carries.",
 "sections":[
  ("How a registration number is read",
   """<p>Both letters and digits count. Letters are converted using Chaldean values, digits
   are added as they are, and the total is reduced to a single number. An Indian plate like
   MH12AB1234 is read in full, not just the numeric portion.</p>"""),
  ("What each total tends to bring",
   """<table class="meaning-table"><thead><tr><th>Total</th><th>On the road</th></tr></thead><tbody>
   <tr><td>1</td><td>Assertive and fast. Suits confident drivers; encourages haste in the impatient.</td></tr>
   <tr><td>2</td><td>Gentle and steady. A calm vehicle, well suited to family use.</td></tr>
   <tr><td>3</td><td>Sociable and well-travelled. Favourable for vehicles used with company.</td></tr>
   <tr><td>4</td><td>Reliable but prone to unexpected disruption. Keep maintenance current.</td></tr>
   <tr><td>5</td><td>Movement and long distance. The natural vibration for a commercial vehicle.</td></tr>
   <tr><td>6</td><td>Comfortable and protective. Among the more favourable family vibrations.</td></tr>
   <tr><td>7</td><td>Solitary. Fine for personal use, less suited to shared or commercial vehicles.</td></tr>
   <tr><td>8</td><td>Heavy and slow. Traditionally the most cautioned vibration for a vehicle.</td></tr>
   <tr><td>9</td><td>Energetic and far-reaching, with a tendency toward friction and haste.</td></tr>
   </tbody></table>"""),
  ("Keeping this in proportion",
   """<p>A number on a plate is not a safety measure. Careful driving, a serviced vehicle and
   a rested driver protect you; a favourable total does not. Where numerology is genuinely
   useful here is at the point of choice — if you are allotted a set of options for a new
   registration, there is no cost to picking the one that suits your chart.</p>"""),
 ],
 "faqs":[
  ("Do the state letters count, like MH or DL?",
   "Yes. The full registration is read, letters included, using Chaldean letter values."),
  ("Can I choose a favourable number when registering?",
   "In many Indian states you can pay for a preferred series. If you are choosing anyway, choosing something compatible costs nothing extra."),
  ("Does an unfavourable number mean accidents?",
   "No, and nobody should tell you otherwise. Numerology describes tendencies, not events. Driving and maintenance determine safety."),
 ],
},
{
 "slug":"lucky-colour", "calc":"colour",
 "title":"Lucky Colour Calculator — Find Your Colour by Date of Birth",
 "desc":"Find your lucky colour from your date of birth. Free numerology calculator showing your ruling planet's colour and how to use it.",
 "h1":"Lucky Colour Calculator",
 "eyebrow":"Chromatic Destiny",
 "kw":"lucky colour calculator, lucky color by date of birth, numerology colour",
 "lede":"Colours carry frequencies that either amplify or mute your own. Enter your date of birth to find yours.",
 "sections":[
  ("How your colour is derived",
   """<p>Your birth number is calculated from your date of birth, and each number is governed
   by a planet. The colour associated with that planet becomes your primary colour.</p>
   <p>This is why the system produces consistent answers across traditions — the colour is not
   arbitrary, it follows the planetary ruler.</p>"""),
  ("Colours by number",
   """<table class="meaning-table"><thead><tr><th>No.</th><th>Ruler and colour</th></tr></thead><tbody>
   <tr><td>1</td><td><strong>Sun</strong> — gold, orange, deep yellow. Confidence and visibility.</td></tr>
   <tr><td>2</td><td><strong>Moon</strong> — white, silver, pale cream. Calm and receptivity.</td></tr>
   <tr><td>3</td><td><strong>Jupiter</strong> — yellow, saffron, violet. Expansion and teaching.</td></tr>
   <tr><td>4</td><td><strong>Rahu</strong> — grey, electric blue, khaki. Grounding the unpredictable.</td></tr>
   <tr><td>5</td><td><strong>Mercury</strong> — green, light grey. Communication and quickness.</td></tr>
   <tr><td>6</td><td><strong>Venus</strong> — pink, pastel blue, white. Warmth and attraction.</td></tr>
   <tr><td>7</td><td><strong>Ketu</strong> — smoky grey, purple, sea green. Introspection.</td></tr>
   <tr><td>8</td><td><strong>Saturn</strong> — dark blue, black, deep brown. Endurance and gravity.</td></tr>
   <tr><td>9</td><td><strong>Mars</strong> — red, coral, crimson. Drive and courage.</td></tr>
   </tbody></table>"""),
  ("Using colour practically",
   """<p>The usual advice — wear it constantly — is neither practical nor necessary. Colour is
   most useful used deliberately at specific moments: an interview, a negotiation, a first
   meeting, a day you need to feel steady.</p>
   <p>It does not need to be the whole outfit. A tie, a scarf, a shirt, a notebook you carry
   in. The point is that you know it is there, and there is a plain psychological argument
   for that quite apart from the astrological one.</p>
   <p>Colours to avoid matter too. If Saturn's dark blue tends to weigh you down, that is
   worth knowing before you choose what to wear to something that requires energy.</p>"""),
 ],
 "faqs":[
  ("Do I have to wear my colour every day?",
   "No. Most practitioners suggest using it deliberately at moments that matter rather than constantly. A small accent is enough."),
  ("Can I have more than one lucky colour?",
   "Yes. Most charts have a primary colour from the birth number and secondary colours from the Life Path and the Moon sign in a full Vedic reading."),
  ("Does this replace gemstone advice?",
   "No. Gemstones are prescribed from the full birth chart, not from the date of birth alone. Colour is the gentler, lower-commitment version of the same principle."),
 ],
},
{
 "slug":"main-planet-number", "calc":"planet",
 "title":"Ruling Planet Calculator — Find Your Planet by Date of Birth",
 "desc":"Find which planet rules your birth number. Free calculator covering the Sun, Moon, Jupiter, Rahu, Mercury, Venus, Ketu, Saturn and Mars.",
 "h1":"Ruling Planet Calculator",
 "eyebrow":"Planetary Ruler",
 "kw":"ruling planet calculator, main planet number, planet by date of birth",
 "lede":"One celestial body governs your core frequency. Enter your date of birth to find which.",
 "sections":[
  ("How your ruling planet is found",
   """<p>Your birth number is reduced from your date of birth, and each of the nine numbers is
   governed by a planet in the Vedic system. Note that this includes Rahu and Ketu — the lunar
   nodes — which have no equivalent in Western astrology.</p>"""),
  ("The nine rulers",
   """<table class="meaning-table"><thead><tr><th>No.</th><th>Planet and character</th></tr></thead><tbody>
   <tr><td>1</td><td><strong>Sun ☉</strong> — vitality, authority, self-expression. Leadership comes naturally; so can pride.</td></tr>
   <tr><td>2</td><td><strong>Moon ☽</strong> — emotion, intuition, cycles. Highly perceptive, and changeable with it.</td></tr>
   <tr><td>3</td><td><strong>Jupiter ♃</strong> — expansion, wisdom, teaching. Generous and optimistic; prone to overreach.</td></tr>
   <tr><td>4</td><td><strong>Rahu ☊</strong> — disruption, ambition, the unconventional. Sudden change, for better and worse.</td></tr>
   <tr><td>5</td><td><strong>Mercury ☿</strong> — intellect, speech, commerce. Quick and adaptable; can be restless.</td></tr>
   <tr><td>6</td><td><strong>Venus ♀</strong> — love, beauty, comfort. Magnetic and artistic; can be indulgent.</td></tr>
   <tr><td>7</td><td><strong>Ketu ☋</strong> — detachment, spirituality, past-life residue. Introspective, sometimes withdrawn.</td></tr>
   <tr><td>8</td><td><strong>Saturn ♄</strong> — discipline, delay, endurance. Rewards patience; punishes shortcuts.</td></tr>
   <tr><td>9</td><td><strong>Mars ♂</strong> — courage, energy, conflict. Decisive and forceful; can be combative.</td></tr>
   </tbody></table>"""),
  ("What this is and is not",
   """<p>Your numerological ruling planet is derived from your date of birth alone. It is not
   the same as the planetary strengths in your Vedic birth chart, which are calculated from
   your exact birth time and place and are considerably more specific.</p>
   <p>Where the two agree, the indication is strong. Where they disagree, the birth chart is
   the more reliable reading — it is working with far more information. Treat this as a useful
   first orientation rather than a substitute for the chart.</p>"""),
 ],
 "faqs":[
  ("Is this the same as my Vedic birth chart planet?",
   "No. This uses your date of birth only. A birth chart uses exact time and place and gives a far more specific reading of planetary strength."),
  ("Why are Rahu and Ketu included?",
   "They are the lunar nodes and are central to Vedic astrology, where they are treated as shadow planets. Western systems generally substitute Uranus and Neptune."),
  ("Does my ruling planet change?",
   "The numerological ruler does not — it comes from your date of birth. What changes is which planetary period, or dasha, you are running through, and that requires a full chart."),
 ],
},
{
 "slug":"compound-destiny", "calc":"compound",
 "title":"Compound Number Calculator — Free Chaldean Compound Numerology",
 "desc":"Calculate your compound number and what the two-digit vibration behind your single digit reveals. Free Chaldean numerology calculator.",
 "h1":"Compound Number Calculator",
 "eyebrow":"Compound Reading",
 "kw":"compound number calculator, chaldean compound number, compound numerology",
 "lede":"Beyond the single digit lies a two-digit vibration carrying its own meaning. This is where Chaldean numerology goes deeper than most systems.",
 "sections":[
  ("Why compound numbers matter",
   """<p>Most numerology stops at the single digit. Chaldean numerology does not — it holds
   that the two-digit number <em>before</em> reduction carries meaning of its own, and that
   two people who both reduce to 7 can have quite different charts depending on whether they
   arrived there from 16 or from 25.</p>
   <p>The single digit describes the outer expression. The compound describes what sits behind
   it — the karmic texture, in traditional language.</p>"""),
  ("Notable compound numbers",
   """<table class="meaning-table"><thead><tr><th>No.</th><th>Traditional reading</th></tr></thead><tbody>
   <tr><td>10</td><td>The Wheel of Fortune. Rise and fall; honour and reversal in equal measure.</td></tr>
   <tr><td>11</td><td>A warning number in Chaldean practice. Hidden difficulty; treachery from others.</td></tr>
   <tr><td>13</td><td>Not unlucky, but a number of upheaval. Power gained through disruption and change.</td></tr>
   <tr><td>14</td><td>Movement and risk. Favourable for dealings with the public; unstable for money.</td></tr>
   <tr><td>16</td><td>A cautioned number. A fall from a height; requires humility to navigate.</td></tr>
   <tr><td>19</td><td>Considered among the most fortunate. Success, honour and fulfilment.</td></tr>
   <tr><td>22</td><td>A warning of illusion. Good judgement is needed; things are not as they appear.</td></tr>
   <tr><td>23</td><td>The Royal Star of the Lion. Traditionally the most favourable compound of all.</td></tr>
   <tr><td>26</td><td>Difficulty through association. Poor partnerships and bad advice.</td></tr>
   <tr><td>27</td><td>Authority earned through intellect. A number of command.</td></tr>
   </tbody></table>"""),
  ("How to read this without alarm",
   """<p>Chaldean tradition attaches strong language to some compound numbers — words like
   treachery and downfall. That language is inherited from a much older text and it is easy
   to read it far more literally than it deserves.</p>
   <p>A cautioned compound number describes a pattern to be aware of, not a fate awaiting you.
   Someone with a 16 in their chart is not doomed; the traditional reading is that they should
   be careful about building on unstable foundations. That is ordinary, actionable advice
   dressed in dramatic language.</p>
   <p>If a numerologist uses a compound number to frighten you into a purchase, that is a
   reason to leave, not a reason to buy.</p>"""),
 ],
 "faqs":[
  ("What is the difference between a compound and a single number?",
   "The single digit is the reduced total and describes outward expression. The compound is the two-digit number before reduction and describes the underlying texture."),
  ("Are some compound numbers genuinely unlucky?",
   "Chaldean tradition marks several as cautionary. Read them as patterns to be aware of rather than fates. Nobody's life is decided by a two-digit number."),
  ("Which compound number should I use?",
   "The one from the name you actually use is the most commonly read. Your date of birth also produces a compound, and a full reading covers both."),
 ],
},
{
 "slug":"lucky-business-name", "calc":"business",
 "title":"Business Name Numerology Calculator — Free Check",
 "desc":"Check the numerology of your business or brand name before you register it. Free Chaldean calculator with meanings for each vibration.",
 "h1":"Business Name Numerology Calculator",
 "eyebrow":"Enterprise Vibration",
 "kw":"business name numerology calculator, company name numerology, brand name numerology",
 "lede":"Your business name is its energetic foundation as well as its first impression. Test it before you print it on anything.",
 "sections":[
  ("How a business name is read",
   """<p>Every letter is converted to its Chaldean value, totalled, and reduced. Use the name
   as customers will actually say it — the trading name, not the registered legal entity, if
   the two differ.</p>
   <p>Leave out suffixes like Pvt Ltd or LLP unless people genuinely use them when referring
   to you. Almost nobody does.</p>"""),
  ("What each business vibration supports",
   """<table class="meaning-table"><thead><tr><th>No.</th><th>Suits</th></tr></thead><tbody>
   <tr><td>1</td><td>Founder-led ventures, original products, category creators. Poor for partnerships.</td></tr>
   <tr><td>2</td><td>Partnerships, agencies, consultancies, mediation. Cooperative rather than aggressive.</td></tr>
   <tr><td>3</td><td>Creative, education, media, hospitality. One of the strongest commercial vibrations.</td></tr>
   <tr><td>4</td><td>Construction, logistics, infrastructure. Solid but slow, and prone to sudden disruption.</td></tr>
   <tr><td>5</td><td>Retail, trading, travel, communications. Fast-moving and highly commercial.</td></tr>
   <tr><td>6</td><td>Beauty, wellness, food, interiors, anything caring or aesthetic. Attractive to customers.</td></tr>
   <tr><td>7</td><td>Research, analysis, spiritual and niche work. Poor for mass-market retail.</td></tr>
   <tr><td>8</td><td>Finance, real estate, heavy industry. Builds wealth slowly; unforgiving of impatience.</td></tr>
   <tr><td>9</td><td>Non-profits, healthcare, service at scale. Broad reach, harder to monetise.</td></tr>
   </tbody></table>"""),
  ("Where this fits in the decision",
   """<p>Naming a business well involves a great many things that matter more than numerology:
   whether the domain is available, whether it is trademarkable, whether people can spell it
   after hearing it once, whether it still fits in five years.</p>
   <p>Numerology is a reasonable tie-breaker once you have two or three names that pass all
   those tests. It is a poor primary criterion. A numerologically perfect name that customers
   cannot pronounce will lose to an ordinary name that they can.</p>"""),
 ],
 "faqs":[
  ("Should I include Pvt Ltd or LLP?",
   "Only if people actually say it. Numerology reads the name in use, and almost nobody includes the suffix in conversation."),
  ("What if my existing business name is unfavourable?",
   "A spelling adjustment is usually less disruptive than a full rename — an added or doubled letter can shift the total while keeping the name recognisable."),
  ("Is this enough to choose a name?",
   "No. Availability, trademark, pronunciation and longevity all matter more. Use numerology to choose between finalists, not to generate them."),
 ],
},
]

# ── Templates ──────────────────────────────────────────────────────────
NAV = """<nav class="site-nav" aria-label="Primary">
  <a class="nav-logo" href="/">Veshann<em>astro</em></a>
  <ul>
    <li><a href="/#numerology-section">All calculators</a></li>
    <li><a href="/vedic-kundli-booking.html">Kundli reading</a></li>
    <li><a href="/numerology-booking.html">Numerology</a></li>
    <li><a class="nav-cta" href="/numerology-booking.html">Book a session</a></li>
  </ul>
</nav>"""

FOOT = """<footer class="site-foot">
  <div class="wrap">
    <ul>
      <li><a href="/">Home</a></li>
      <li><a href="/about.html">About</a></li>
      <li><a href="/contact.html">Contact</a></li>
      <li><a href="/terms.html">Terms</a></li>
      <li><a href="/privacy-policy.html">Privacy</a></li>
      <li><a href="/refund-policy.html">Refunds</a></li>
    </ul>
    <p class="disclaimer">These calculators are provided free for personal interest.
    Numerology is interpretive and advisory. It is not a guarantee of any outcome, and it is
    not a substitute for medical, legal or financial advice.</p>
    <p>&copy; %s Veshannastro &middot; Delhi, India</p>
  </div>
</footer>""" % datetime.date.today().year


def related_block(current):
    items = [p for p in PAGES if p["slug"] != current][:6]
    lis = "".join('<li><a href="/calculators/%s.html">%s</a></li>' % (p["slug"], p["h1"])
                  for p in items)
    return ('<section class="related"><h2>Other free calculators</h2><ul>%s</ul></section>'
            % lis)


def faq_html(faqs):
    return "".join(
        "<details><summary>%s</summary><p>%s</p></details>" % (q, a) for q, a in faqs)


def jsonld(p):
    faq_items = ",".join(
        '{"@type":"Question","name":%s,"acceptedAnswer":{"@type":"Answer","text":%s}}'
        % (json_str(q), json_str(a)) for q, a in p["faqs"])
    url = "%s/calculators/%s.html" % (BASE, p["slug"])
    return """{
 "@context":"https://schema.org",
 "@graph":[
  {"@type":"WebApplication","@id":"%(url)s#app","name":%(name)s,
   "url":"%(url)s","applicationCategory":"UtilitiesApplication",
   "operatingSystem":"Any (web browser)","browserRequirements":"Requires JavaScript",
   "description":%(desc)s,
   "offers":{"@type":"Offer","price":"0","priceCurrency":"INR"},
   "publisher":{"@id":"%(base)s/#organization"},
   "isAccessibleForFree":true},
  {"@type":"FAQPage","@id":"%(url)s#faq","mainEntity":[%(faq)s]},
  {"@type":"BreadcrumbList","@id":"%(url)s#crumb","itemListElement":[
    {"@type":"ListItem","position":1,"name":"Home","item":"%(base)s/"},
    {"@type":"ListItem","position":2,"name":"Numerology calculators","item":"%(base)s/#numerology-section"},
    {"@type":"ListItem","position":3,"name":%(name)s,"item":"%(url)s"}]}
 ]}""" % {"url": url, "base": BASE, "name": json_str(p["h1"]),
          "desc": json_str(p["desc"]), "faq": faq_items}


def json_str(s):
    return '"' + s.replace("\\", "\\\\").replace('"', '\\"').replace("\n", " ") + '"'


PAGE = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta name="keywords" content="{kw}">
<meta name="robots" content="index, follow">
<meta name="author" content="Shashank Agrawal">
<link rel="canonical" href="{base}/calculators/{slug}.html">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Veshannastro">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="{base}/calculators/{slug}.html">
<meta property="og:image" content="{base}/images/og-image.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{title}">
<meta name="twitter:description" content="{desc}">
<link rel="alternate" type="text/plain" href="{base}/llms.txt" title="llms.txt">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600&family=Cormorant+Garamond:wght@400;500;600&family=Jost:wght@300;400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/calculators/calc.css">
<script type="application/ld+json">
{ld}
</script>
</head>
<body>
<a class="skip-link" href="#main">Skip to the calculator</a>
{nav}
<main id="main">
  <div class="wrap">

    <nav class="crumb" aria-label="Breadcrumb">
      <ol>
        <li><a href="/">Home</a></li>
        <li><a href="/#numerology-section">Calculators</a></li>
        <li aria-current="page">{h1}</li>
      </ol>
    </nav>

    <p class="eyebrow">{eyebrow}</p>
    <h1>{h1}</h1>
    <p class="lede">{lede}</p>

    <section class="calc-card" aria-labelledby="calc-heading">
      <h2 id="calc-heading">Calculate now</h2>
      <div id="calc-status" role="status" aria-live="polite" aria-atomic="true" class="sr-only"></div>
      <div id="calc-mount" data-calc="{calc}">
        <noscript>
          <p>This calculator needs JavaScript to run. The explanation below works without it,
          and you are welcome to <a href="/contact.html">ask us directly</a> instead.</p>
        </noscript>
      </div>
    </section>

{body}

    <section class="faq" aria-labelledby="faq-heading">
      <h2 id="faq-heading">Common questions</h2>
      {faq}
    </section>

    <aside class="callout" aria-labelledby="cta-heading">
      <h2 id="cta-heading" style="margin-top:0">Want this read properly?</h2>
      <p>A calculator gives you a number. It cannot tell you how that number interacts with
      the rest of your chart, or what to do about it. A full reading is conducted personally
      by Shashank Agrawal — a practising numerologist and author of
      <em>Numbers &amp; Navgraha: Untold Secret of Numerology</em> — over live video, with a
      written report afterwards.</p>
      <div class="cta-row">
        <a class="btn btn-primary" href="/numerology-booking.html">Book a numerology session</a>
        <a class="btn btn-ghost" href="/vedic-kundli-booking.html">Full Vedic kundli reading</a>
      </div>
    </aside>

    {related}

  </div>
</main>
{foot}
<script src="/calculators/calc-engine.js" defer></script>
</body>
</html>
"""

count = 0
for p in PAGES:
    body = "\n".join(
        '    <section aria-labelledby="s%d"><h2 id="s%d">%s</h2>%s</section>\n'
        % (i, i, title, html) for i, (title, html) in enumerate(p["sections"]))
    out = PAGE.format(
        title=p["title"], desc=p["desc"], kw=p["kw"], slug=p["slug"], base=BASE,
        h1=p["h1"], eyebrow=p["eyebrow"], lede=p["lede"], calc=p["calc"],
        body=body, faq=faq_html(p["faqs"]), related=related_block(p["slug"]),
        nav=NAV, foot=FOOT, ld=jsonld(p))
    path = os.path.join(OUT, p["slug"] + ".html")
    io.open(path, "w", encoding="utf-8").write(out)
    words = len(__import__("re").sub(r"<[^>]+>", " ", out).split())
    print("  %-26s %6d bytes  ~%d words" % (p["slug"] + ".html", len(out), words))
    count += 1

print("\n%d calculator pages generated." % count)
