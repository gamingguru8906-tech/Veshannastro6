"""Content for the 2027 pages.

Method used throughout:
  * 2027 = 2 + 0 + 2 + 7 = 11, which reduces to 2. Universal Year 11/2.
  * Indian numerology rulers: 1 Sun, 2 Moon, 3 Jupiter, 4 Rahu, 5 Mercury,
    6 Venus, 7 Ketu, 8 Saturn, 9 Mars. 2027's year number 2 is ruled by the Moon.
  * Personal Year = birth day (reduced) + birth month (reduced) + 2, reduced to 1-9.
  * Personal Month = Personal Year + calendar month, reduced to 1-9.
  * Mulank readings compare the Mulank's ruling planet with the Moon using the
    classical natural friendships (naisargika maitri).
Edit the wording here, then run tools/build_site.py.
"""

PLANET = {1: "Sun", 2: "Moon", 3: "Jupiter", 4: "Rahu", 5: "Mercury", 6: "Venus", 7: "Ketu", 8: "Saturn", 9: "Mars"}
PLANET_HI = {1: "सूर्य", 2: "चंद्रमा", 3: "गुरु (बृहस्पति)", 4: "राहु", 5: "बुध", 6: "शुक्र", 7: "केतु", 8: "शनि", 9: "मंगल"}


def reduce(n):
    while n > 9:
        n = sum(int(d) for d in str(n))
    return n


MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

PERSONAL_MONTH = {
    1: "Start something. Decisions, applications and launches.",
    2: "Slow down. Wait for replies, cooperate, handle agreements.",
    3: "Be visible. Meetings, events, content, sales and social plans.",
    4: "Get organised. Work, routines, documents, finishing tasks.",
    5: "Expect change. Travel, new contacts, negotiation. Sign nothing in a hurry.",
    6: "Home and people. Family, love, home purchases, responsibilities.",
    7: "Rest and review. Study, health, planning. Weak month for big launches.",
    8: "Push for results. Money, promotions, contracts, authority.",
    9: "Finish and clear. Close loose ends, let go, give back.",
}

# Universal months of 2027: universal year 2 + calendar month.
UNIVERSAL_MONTHS = [
    ("January", "3", "Plans are discussed more than executed. Good for networking and announcements."),
    ("February", "4", "Paperwork, budgets and systems. Steady work beats big moves."),
    ("March", "5", "Movement and change. Travel, job switches and negotiations pick up."),
    ("April", "6", "Family, marriage talks, homes and responsibilities."),
    ("May", "7", "A quieter month. Research, health and rethinking plans."),
    ("June", "8", "Money and authority. Strong month for business and career decisions."),
    ("July", "9", "Endings and clearing. Finish what is pending before the second half."),
    ("August", "1", "The year's second start. New projects launched now carry well."),
    ("September", "11/2", "The year's master-number month. Intuition, partnerships and agreements."),
    ("October", "3", "Expression and visibility. Festive season, events and sales."),
    ("November", "4", "Consolidation. Tie up structure, accounts and commitments."),
    ("December", "5", "Movement again. Travel and change as 2028, a 3 year, approaches."),
]

PY = {
    1: dict(
        name="The year of beginnings",
        summary="Personal Year 1 is the first year of a new nine-year cycle, so what you start in 2027 sets your direction until 2035. The catch is that 2027 is a 2 year for the world: slow and driven by relationships. Your fresh start moves faster when you bring the right people along instead of going alone.",
        career="The best year of the cycle to change jobs, launch a business, ask for a lead role or choose a new specialisation. Decide early. Expect bosses and clients to take longer to say yes than you would like, because a 2 world year rewards patience over pushing.",
        love="Singles meet people through new activities, a new workplace or a new city. In a relationship, your need for independence can read as distance to your partner. Tell them what you are starting and why.",
        money="Spend on what builds earning power: a course, tools, a website, a registration. Avoid lending large sums or standing guarantee for anyone this year. The income from what you start usually shows later in the cycle, not in the first months.",
        health="Energy is usually high. The Sun's traditional areas are the heart, eyes and vitality, so keep a routine, sleep on time and do not run on adrenaline for months at a stretch.",
        avoid="Waiting for permission, and doing everything alone. In a 2 world year, partnerships open doors your effort alone will not.",
        remedy="Offer water to the rising Sun (Surya arghya) on Sunday mornings, and begin important work on a Sunday or Monday.",
        colour="Gold, orange", day="Sunday", numbers="1, 2, 3, 9",
        crystal=("Tiger eye", "/products/tiger-eye-bracelet"),
        faq=[("Is Personal Year 1 in 2027 good for starting a business?", "Yes. It is the most suitable year of the nine-year cycle to start one. Plan the launch for a Personal Month 1 or 8 and line up a partner, mentor or first client before you go, because 2027's world energy favours collaboration.")],
    ),
    2: dict(
        name="The year of patience and partnership",
        summary="Personal Year 2 follows last year's fresh start. It is the year seeds take root underground: slower, quieter and built on cooperation. 2027 is also a 2 year for the world, so the theme is doubled. Partnerships, marriage talks, joint ventures and agreements dominate, and people who rush tend to lose ground.",
        career="Work through people: partnerships, client relationships, teams, and roles that support a leader. Promotions come through someone vouching for you rather than self-promotion. Read contracts and agreements carefully. A good year to earn a reputation for reliability.",
        love="Alongside Personal Year 6, this is the strongest year of the cycle for commitment, engagement and marriage talks. Feelings run deep and are easily hurt. Say what you need instead of waiting to be understood.",
        money="Steady rather than spectacular. Joint finances, family money and partnership income matter most. Save, and avoid speculative trades you cannot watch daily.",
        health="In traditional texts the Moon governs the mind, sleep and fluids. Stress shows up first in sleep and digestion. Routine, water and walks help more than willpower.",
        avoid="Forcing decisions, taking criticism personally, and saying yes to everything to keep the peace.",
        remedy="On Mondays, offer water or milk to a Shivling, wear white or silver, and spend time with your mother or an elder woman in the family.",
        colour="White, silver, cream", day="Monday", numbers="2, 1, 5",
        crystal=("White moonstone", "/products/white-moonstone-bracelet"),
        extra=("What a 2 Personal Year means in an 11/2 world year",
               ["2027 adds up to 11 before it reduces to 2 (2 + 0 + 2 + 7 = 11), which is why many numerologists call it an 11/2 year. Eleven is a master number: sharper intuition, more nervous energy, and a pull towards teaching, counselling, healing and creative work.",
                "If your own calculation also passes through 11, you are in an 11/2 Personal Year. For example, someone born on 4 May adds 4 + 5 + 2 = 11. Someone born on 1 August adds 1 + 8 + 2 = 11. Read everything on this page, and add one rule for yourself: protect your sleep and your nerves, because 11 runs hot.",
                "For everyone in Personal Year 2, the doubled 2 makes this one of the most sensitive years of the whole cycle. That sensitivity is useful. It is how you read people correctly in negotiations and relationships. It becomes a problem only when every comment feels personal."]),
        faq=[("What does Personal Year 2 in 2027 mean?", "It is a year of patience, partnership and slow growth after last year's new start. Because 2027 is itself a 2 (or 11/2) year, the theme is doubled: agreements, relationships and cooperation decide most outcomes."),
             ("Is Personal Year 2 a bad year?", "No. It is a slower year. Plans started in 2026 take root quietly, and results come through other people. It feels frustrating only if you expect Personal Year 1 speed.")],
    ),
    3: dict(
        name="The year of expression and growth",
        summary="Personal Year 3 is the social, expressive year of the cycle. After two slower years, things open up: invitations, visibility, and ideas that people respond to. In a 2 world year the best results come from collaboration: co-creating, teaching together, partnering on sales or content.",
        career="Strong for sales, marketing, teaching, writing, media, design and any role where you are seen. Ask for the stage. Jupiter rules teachers and advisers, so mentors open doors this year. The risk is scattered energy, so finish what you start.",
        love="A socially active year. Singles meet people at gatherings and through friends. Couples enjoy more outings and travel together. Watch careless words: a joke can land badly in a sensitive 2 world year.",
        money="Money comes through networking, sales and creative work. Spending rises too: celebrations, clothes, outings. Set a monthly limit and keep to it.",
        health="Jupiter is linked with the liver and weight in traditional texts. Celebrations add up, so balance them with daily movement.",
        avoid="Overcommitting, gossip, and starting five projects without finishing one.",
        remedy="On Thursdays, wear yellow, donate chana dal or turmeric, and touch the feet of a teacher or elder.",
        colour="Yellow, gold", day="Thursday", numbers="3, 1, 2, 9",
        crystal=("Citrine", "/products/natural-citrine-bracelet"),
        faq=[("Is Personal Year 3 in 2027 good for marriage?", "It is good for meeting people and for celebrations. For formal commitment, the Personal Months 2 and 6 within the year are the better windows.")],
    ),
    4: dict(
        name="The year of foundations",
        summary="Personal Year 4 is the work year of the cycle: foundations, systems, paperwork and steady effort. In Indian numerology 4 is ruled by Rahu, which brings sudden turns, so this year rewards structure and punishes shortcuts. In a 2 world year, the people you build with matter as much as the plan.",
        career="Build the unglamorous parts: processes, skills, certifications, the back office of a business. By the end of the year, your effort is visible to the people who matter. Expect delays and sudden changes in rules or management. Document everything and read the fine print.",
        love="Practical love: shared plans, budgets, a home. Romance can start to feel scheduled, so make time for it on purpose. Avoid secrets; Rahu magnifies misunderstandings.",
        money="Good for disciplined saving, clearing loans and property paperwork. Stay away from quick-money schemes, tips from friends and anything that sounds too clever.",
        health="Overwork is the main risk. Keep fixed sleep and meal times, look after your back and joints, and take breaks from screens.",
        avoid="Shortcuts, ignored paperwork, and cutting yourself off from the team.",
        remedy="Keep your home and desk free of clutter, feed birds, and recite the Durga Chalisa on Saturdays.",
        colour="Grey, smoky blue", day="Saturday", numbers="4, 5, 6, 8",
        crystal=("Black tourmaline", "/products/black-tourmaline-bracelet"),
        faq=[("Why does Personal Year 4 feel so heavy?", "It is the year of the cycle where you lay foundations, which means more work and fewer visible rewards. The reward shows up in Personal Years 5 to 8, when what you built carries you.")],
    ),
    5: dict(
        name="The year of change",
        summary="Personal Year 5 is the turning point of the cycle: change, travel, new people and new ideas. The world's 2 energy pulls the other way, towards staying put and keeping the peace, which is why the year can feel restless. Change what needs changing, but sign nothing in a hurry.",
        career="Good for job changes, travel-based work, sales, trading, marketing, communication and anything digital. Mercury rules speech and commerce, so pitch, negotiate and learn a new skill. Read contracts twice. Quick decisions are this year's weak point.",
        love="Exciting and unsettled. Singles meet people while travelling or online. Couples need new experiences together because routine feels heavy. Avoid impulsive endings.",
        money="Money moves in and out quickly. Trading and commission income can be good; impulse buys and risky bets are the leak. Keep an emergency fund untouched.",
        health="Nerves, skin and breathing are Mercury's areas in tradition. Too much screen time and too little sleep show first. Take regular breaks.",
        avoid="Impulsive decisions, overspending and scattered attention.",
        remedy="On Wednesdays, worship Lord Ganesha, feed green grass to a cow, and keep your promises small and kept.",
        colour="Green", day="Wednesday", numbers="5, 1, 6",
        crystal=("Green aventurine", "/products/green-aventurine-bracelet"),
        faq=[("Is Personal Year 5 in 2027 good for a job change?", "Yes, it is one of the better years of the cycle for one. Interview and negotiate in a Personal Month 1, 5 or 8, and give yourself a few days before signing.")],
    ),
    6: dict(
        name="The year of home, love and responsibility",
        summary="Personal Year 6 is the year of home, love and responsibility. Family matters, marriage, children, a home purchase or renovation, and caring for others take most of your attention. Combined with 2027's 2 world year, it is one of the most relationship-friendly years of the cycle.",
        career="Strong for service, hospitality, beauty, fashion, design, health care, teaching and counselling. Clients stay loyal when they feel looked after. Your load of responsibility grows, so delegate before you burn out.",
        love="Alongside Personal Year 2, the strongest year of the cycle for marriage, engagement and commitment. Existing relationships either deepen or face honest questions. Family opinions weigh heavily on decisions.",
        money="Spending on home, family, vehicles and comfort rises. Venus also brings income through creative and client work. Plan big purchases instead of buying on emotion.",
        health="Venus governs the throat, kidneys and reproductive health in traditional texts. Comfort eating and sugar are the usual traps.",
        avoid="Carrying everyone's problems, perfectionism at home, and people-pleasing.",
        remedy="On Fridays, worship Goddess Lakshmi, offer white sweets, and keep your home clean and lightly fragranced.",
        colour="White, pink, light blue", day="Friday", numbers="6, 5, 8",
        crystal=("Rose quartz", "/products/rose-quartz-bracelet"),
        faq=[("Is Personal Year 6 in 2027 good for marriage?", "Yes. It is one of the two strongest years of the cycle for commitment. Personal Months 2 and 6 within the year are the most supportive for fixing dates and family talks.")],
    ),
    7: dict(
        name="The year of reflection",
        summary="Personal Year 7 is the inward year of the cycle: study, research, health, spiritual practice and getting honest with yourself. In Indian numerology 7 is ruled by Ketu, the planet of detachment. In a 2 world year that already moves slowly, this is a year to think, learn and prepare rather than chase.",
        career="Good for research, analysis, specialised skills, writing, technology, healing work and higher studies. Do not expect quick promotions; expect depth. Use this year to become the expert, and Personal Year 8 next year to get paid for it.",
        love="You need more space, so say so kindly. Singles meet people through study or spiritual circles. Couples do best with quiet time together rather than a packed calendar.",
        money="Avoid big speculative moves and anything you have not researched yourself. Insurance, savings and long-term plans are well placed.",
        health="Rest is productive this year. Meditation, walks and proper sleep. Get check-ups done instead of ignoring small problems.",
        avoid="Cutting everyone off, overthinking, and big money decisions made on a hunch.",
        remedy="Worship Lord Ganesha, feed dogs, and keep fifteen minutes of silent practice every morning.",
        colour="Smoky grey, multicolour", day="Tuesday", numbers="7, 6, 9",
        crystal=("Amethyst", "/products/amethyst-bracelet"),
        faq=[("Why does Personal Year 7 feel lonely?", "Because the year turns your attention inward. It is preparation for Personal Year 8, the money and recognition year. Use the quiet for skills and clarity.")],
    ),
    8: dict(
        name="The year of money and authority",
        summary="Personal Year 8 is the money and power year of the cycle. Effort from the last seven years is measured: promotions, business growth, property and recognition come to people who did the work. Saturn rules 8, so results are fair but slow. In a 2 world year, partners and authorities decide a lot, so keep those relationships clean.",
        career="The strongest year of the cycle to ask for a raise, scale a business, take on authority or sign large contracts. Expect more responsibility and more scrutiny. Do things by the book.",
        love="Work can crowd out the relationship, so put time together on the calendar. In Indian numerology 8 and 2 (2027's number) are not natural friends, which makes emotional misunderstandings more likely. Be clear and patient.",
        money="The best year for earning, planned investing, property and settling debts. Do not cut corners on tax or compliance. Saturn's lesson is that it gets noticed.",
        health="Bones, joints, teeth and chronic tiredness are Saturn's areas in tradition. Managing stress is not optional this year.",
        avoid="Arrogance with authority, shortcuts on legal matters, and ignoring family for work.",
        remedy="On Saturdays, light a mustard-oil lamp, read the Hanuman Chalisa, and help people who work for you or do physical labour.",
        colour="Dark blue, black in moderation", day="Saturday", numbers="8, 5, 6",
        crystal=("Iolite (neeli)", "/products/iolite-neeli-bracelet"),
        faq=[("Is Personal Year 8 in 2027 good for money?", "It is the strongest money year of the cycle. Plan major financial moves for Personal Months 1 and 8, keep paperwork spotless, and expect results to build through the year rather than arrive at once.")],
    ),
    9: dict(
        name="The year of completion",
        summary="Personal Year 9 closes the nine-year cycle. It is the year to finish, release and give back: end what has run its course, clear clutter, forgive, and make room for the new start that arrives in 2028. In a 2 world year, endings go more smoothly when handled with care rather than drama.",
        career="Complete projects, wrap up roles, hand over work and finish courses. A job ending now often leads to a better start next year. Save launches of something completely new for 2028, your Personal Year 1.",
        love="Relationships that are complete may end; strong ones deepen through forgiveness. Avoid starting something new mainly to escape the old.",
        money="Clear debts, donate, sell what you do not use. Money from past efforts can arrive. Avoid large new commitments in the last quarter.",
        health="Mars governs blood, energy and inflammation in tradition. Put frustration into exercise and avoid accidents caused by rushing.",
        avoid="Holding on, anger, and launching major new ventures late in the year.",
        remedy="On Tuesdays, read the Hanuman Chalisa, donate red lentils (masoor dal), and do one act of service every week.",
        colour="Red, coral", day="Tuesday", numbers="9, 1, 2, 3",
        crystal=("Red jasper", "/products/red-jasper-bracelet"),
        faq=[("Should I start a business in Personal Year 9?", "Usually it is better to prepare in 2027 and launch in 2028, your Personal Year 1. If you must launch now, do it in a Personal Month 1 or 8 and keep the first phase small.")],
    ),
}

# Mulank readings for 2027 (year number 2, the Moon).
MULANK = {
    1: dict(tone="Supportive", rel="The Sun and the Moon are natural friends, so 2027 works with Mulank 1 rather than against it.",
            body="Leadership comes more easily when it is paired with listening. Recognition through seniors, government contacts and established institutions is likely. Watch ego in partnerships: the Moon year rewards warmth more than command.",
            career="Leadership roles, administration, government work and running your own venture.",
            money="Steady. Avoid spending to keep up appearances.",
            love="A warmer year for relationships if you listen as much as you lead.",
            health="Routine for the eyes, heart and blood pressure.",
            colour="Gold, orange", day="Sunday", numbers="1, 2, 3, 9", remedy="Offer water to the rising Sun on Sunday mornings.",
            crystal=("Tiger eye", "/products/tiger-eye-bracelet"),
            hi="मूलांक 1 वालों के लिए 2027 सहयोगी वर्ष है, क्योंकि सूर्य और चंद्रमा मित्र ग्रह हैं। नेतृत्व के अवसर मिलेंगे, बस अहंकार से बचें और लोगों की बात ध्यान से सुनें।"),
    2: dict(tone="Amplified", rel="2027's year number is your own number, so the Moon's energy is doubled for Mulank 2.",
            body="Intuition, popularity and your connection with people rise. So do mood swings. Public-facing work does well; decisions made in an emotional moment do not. Give big choices a night's sleep.",
            career="Public dealing, hospitality, counselling, healthcare and creative work.",
            money="Family and partnership money. Avoid emotional spending.",
            love="Deep and sensitive. Avoid becoming dependent on one person's approval.",
            health="Sleep, water intake and a calm mind.",
            colour="White, silver", day="Monday", numbers="2, 1, 5", remedy="Offer water or milk to a Shivling on Mondays and respect your mother.",
            crystal=("White moonstone", "/products/white-moonstone-bracelet"),
            hi="मूलांक 2 के लिए 2027 दोहरी चंद्र ऊर्जा का वर्ष है। लोगों से जुड़ाव और अंतर्ज्ञान बढ़ेगा, पर भावनाओं में बहकर कोई बड़ा निर्णय न लें।"),
    3: dict(tone="Supportive", rel="Jupiter treats the Moon as a friend, so 2027 brings growth through family, teachers and advisers.",
            body="One of the better years for Mulank 3. Promotions come through mentors, and teaching, advising and finance work gain. Marriage and family matters move forward with elders' blessings.",
            career="Teaching, consulting, finance, law and spiritual work.",
            money="Growing. Good for savings; avoid lending without paperwork.",
            love="Good marriage prospects and family support.",
            health="Liver, weight and sugar need attention.",
            colour="Yellow", day="Thursday", numbers="3, 1, 2, 9", remedy="Wear yellow on Thursdays and donate chana dal.",
            crystal=("Citrine", "/products/natural-citrine-bracelet"),
            hi="मूलांक 3 के लिए 2027 शुभ और विस्तार का वर्ष है। गुरु और चंद्रमा का मेल शिक्षा, विवाह और परिवार के मामलों में सहायता देता है।"),
    4: dict(tone="Needs care", rel="Rahu and the Moon pull against each other (think of the eclipse), so Mulank 4 can feel confusion and sudden change in 2027.",
            body="Overthinking and unexpected turns are the theme. Technology, research, foreign connections and unconventional work do well. Office politics and unread documents do not. Double-check every agreement.",
            career="Technology, research, foreign links and unconventional fields.",
            money="Avoid speculation and loans to friends.",
            love="Misunderstandings are likely. Say things plainly.",
            health="Anxiety and sleep. Cut late-night screen time.",
            colour="Grey, blue", day="Saturday", numbers="4, 5, 6, 8", remedy="Keep the home free of clutter, feed birds and recite the Durga Chalisa.",
            crystal=("Black tourmaline", "/products/black-tourmaline-bracelet"),
            hi="मूलांक 4 के लिए 2027 में सावधानी ज़रूरी है। राहु और चंद्रमा का तनाव भ्रम और अचानक बदलाव ला सकता है, इसलिए हर कागज़ ध्यान से पढ़ें और जल्दबाज़ी में निवेश न करें।"),
    5: dict(tone="Mixed", rel="The Moon is friendly towards Mercury, but Mercury does not return the friendship, so 2027 is head against heart for Mulank 5.",
            body="Business, trading and communication thrive and the network grows. The friction is between quick logic and other people's feelings. Listen before you argue a point you can win.",
            career="Business, trading, sales, media and communication.",
            money="Quick gains and quick spending. Keep records.",
            love="Do not intellectualise feelings. Listen.",
            health="Nerves and skin. Regular breaks from screens.",
            colour="Green", day="Wednesday", numbers="5, 1, 6", remedy="Worship Lord Ganesha on Wednesdays and feed green grass to a cow.",
            crystal=("Green aventurine", "/products/green-aventurine-bracelet"),
            hi="मूलांक 5 के लिए 2027 व्यापार और संवाद में अच्छा है, पर दिल और दिमाग में संतुलन रखना होगा। जल्दी फैसले और बेवजह खर्च से बचें।"),
    6: dict(tone="Pleasant, with friction", rel="Venus does not count the Moon as a friend, though both govern comfort and feeling. For Mulank 6, 2027 is pleasant on the surface with friction over expectations.",
            body="Love, family, comfort and beauty are active. Demand for creative and client work is good. The friction is unspoken expectations at home, so say what you want instead of hoping it is understood.",
            career="Creative work, beauty, fashion, hospitality and design.",
            money="Comfort spending rises. Plan large purchases.",
            love="Romance is active. Avoid jealousy and keep expectations clear. Family approval matters.",
            health="Sugar, throat and kidneys.",
            colour="White, pink", day="Friday", numbers="6, 5, 8", remedy="Worship Goddess Lakshmi on Fridays and offer white sweets.",
            crystal=("Rose quartz", "/products/rose-quartz-bracelet"),
            hi="मूलांक 6 के लिए 2027 प्रेम, परिवार और सुख-सुविधा से जुड़ा वर्ष है। रिश्तों में अपेक्षाएँ साफ़ रखें और भावनाओं में आकर बड़े खर्च न करें।"),
    7: dict(tone="Inward", rel="Ketu, the planet of detachment, meets the emotional Moon. For Mulank 7, 2027 is intuitive and spiritual, with a feeling of distance from people.",
            body="Intuition is sharp and spiritual practice deepens. Research and healing work go well. The risk is withdrawal: partners and family can feel shut out. Job changes made on a whim tend to disappoint.",
            career="Research, healing, spirituality, technology and analysis.",
            money="Careful. Avoid speculative bets.",
            love="You need space; explain that, so it is not read as rejection.",
            health="Rest and a daily practice for the mind.",
            colour="Smoky grey, multicolour", day="Tuesday", numbers="7, 6, 9", remedy="Worship Lord Ganesha, feed dogs and meditate daily.",
            crystal=("Amethyst", "/products/amethyst-bracelet"),
            hi="मूलांक 7 के लिए 2027 आत्मचिंतन और आध्यात्मिक उन्नति का वर्ष है। अंतर्ज्ञान तेज़ रहेगा, पर अकेलेपन और ज़्यादा सोचने से बचें।"),
    8: dict(tone="Demanding", rel="Saturn does not count the Moon as a friend, and 8 with 2 is a well-known friction pair in Indian numerology. For Mulank 8, 2027 asks for patience.",
            body="Results are slower and emotions heavier, but Saturn rewards discipline, and whatever you build properly this year lasts. Avoid conflict with seniors and be careful with legal and compliance matters.",
            career="Steady progress through hard work. Keep relations with seniors smooth.",
            money="Slow but durable. Property is fine with clean paperwork; avoid new loans.",
            love="Emotional distance is the risk. Show care in plain ways.",
            health="Joints, fatigue and low mood. Keep a routine.",
            colour="Dark blue", day="Saturday", numbers="8, 5, 6", remedy="Light a mustard-oil lamp on Saturdays, read the Hanuman Chalisa and help workers.",
            crystal=("Iolite (neeli)", "/products/iolite-neeli-bracelet"),
            hi="मूलांक 8 के लिए 2027 धैर्य की परीक्षा का वर्ष है। शनि और चंद्रमा की असहजता से काम में देरी हो सकती है, पर अनुशासन और ईमानदारी से किया गया हर प्रयास टिकाऊ फल देगा।"),
    9: dict(tone="Supportive", rel="Mars treats the Moon as a friend, so for Mulank 9, 2027 adds emotional drive to your natural energy.",
            body="Courage and initiative are rewarded, especially in property, land and family matters. Bold moves work after planning, not before. Temper is the one thing to manage.",
            career="Defence, police, sports, engineering, real estate and hands-on leadership.",
            money="Property and land matters are favoured. Avoid impulsive spending.",
            love="Passionate, with family support. Watch your temper.",
            health="Blood pressure, injuries and inflammation. Exercise regularly.",
            colour="Red", day="Tuesday", numbers="9, 1, 2, 3", remedy="Read the Hanuman Chalisa on Tuesdays and donate masoor dal.",
            crystal=("Red jasper", "/products/red-jasper-bracelet"),
            hi="मूलांक 9 के लिए 2027 ऊर्जा और साहस का वर्ष है। मंगल और चंद्रमा मित्र हैं, इसलिए संपत्ति और परिवार के मामलों में लाभ के योग हैं, बस गुस्से पर नियंत्रण रखें।"),
}

BHAGYANK = {
    1: "Your life direction is leadership. In 2027 lead through alliances rather than solo moves.",
    2: "Your life direction already matches the year. Partnerships and patience pay more than usual.",
    3: "Your direction is expression. Teach, write and advise with others; collaboration multiplies reach.",
    4: "Your direction is building. Expect delays from others; your systems carry you through.",
    5: "Your direction is change. The year asks you to commit more than you like. Commit to fewer things.",
    6: "Your direction is care and responsibility. A strong year for family and marriage decisions.",
    7: "Your direction is inner work. A quiet year suits you; protect it from other people's urgency.",
    8: "Your direction is achievement. Slower results this year; keep relationships with authority clean.",
    9: "Your direction is service. Endings and giving back come naturally; finish before you begin again.",
}


def personal_months(py):
    return [(MONTHS[m - 1], reduce(py + m)) for m in range(1, 13)]


def example_birthdays(py, k=6):
    """Birthdays (day, month) whose 2027 Personal Year is py, spread over the year."""
    out = []
    for m in range(1, 13):
        for d in range(1, 29):
            if reduce(reduce(d) + reduce(m) + 2) == py:
                out.append((d, MONTHS[m - 1]))
                break
    step = max(1, len(out) // k)
    return out[::step][:k]
