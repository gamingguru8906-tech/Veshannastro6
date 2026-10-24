"""Builds assets/r27/cities.json, the place-of-birth list for the 2027 report form.

India: every GeoNames place with 1,000+ people plus every city in the country-state-city list, each with its state.
Neighbours (Nepal, Bangladesh, Sri Lanka, Pakistan, Bhutan, the Gulf): places with 15,000+ people.
Everywhere else: cities with 100,000+ people. Old and common names (Bombay, Calcutta, Gurgaon...) are kept as aliases.

Regenerate (one-off, needs the two data packages):
    pip install geonamescache
    npm install country-state-city@3.2.1      # in any folder; pass its lib/assets folder below
    python3 tools/make_cities.py /path/to/node_modules/country-state-city/lib/assets
"""
import json
import math
import os
import re
import sys
import unicodedata

import geonamescache

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(REPO, "assets", "r27", "cities.json")
GN = os.path.join(os.path.dirname(geonamescache.__file__), "data")

NEIGHBOURS = {"NP", "BD", "LK", "PK", "BT", "AE", "SA", "QA", "KW", "OM", "BH", "MV", "MU", "SG", "MY"}

# Names people still use for renamed Indian cities (the GeoNames name is the current one).
ALIASES = {
    "Mumbai": "Bombay", "Kolkata": "Calcutta", "Chennai": "Madras", "Bengaluru": "Bangalore", "Gurugram": "Gurgaon",
    "Gurgaon": "Gurugram", "Prayagraj": "Allahabad", "Vadodara": "Baroda", "Pune": "Poona", "Thiruvananthapuram": "Trivandrum",
    "Kochi": "Cochin", "Mysuru": "Mysore", "Visakhapatnam": "Vizag", "Varanasi": "Banaras|Benares|Kashi", "Puducherry": "Pondicherry",
    "Kozhikode": "Calicut", "Mangaluru": "Mangalore", "Belagavi": "Belgaum", "Kalaburagi": "Gulbarga", "Shivamogga": "Shimoga",
    "Hubballi": "Hubli", "Ayodhya": "Faizabad", "Nashik": "Nasik", "Kanpur": "Cawnpore", "Guwahati": "Gauhati", "Shimla": "Simla",
    "Thrissur": "Trichur", "Tiruchirappalli": "Trichy", "Thanjavur": "Tanjore", "Kollam": "Quilon", "Vijayawada": "Bezawada",
    "Ballari": "Bellary", "Tumakuru": "Tumkur", "Vijayapura": "Bijapur", "Kanchipuram": "Conjeevaram", "Bhubaneswar": "Bhubaneshwar",
    "Odisha": "Orissa", "Darjeeling": "Darjiling", "Panaji": "Panjim", "Ujjain": "Avantika", "Aurangabad": "Chhatrapati Sambhajinagar",
    "Osmanabad": "Dharashiv", "Delhi": "Dilli", "Bhopal": "Bhupal", "Kashi": "Varanasi",
}


def norm(s):
    s = unicodedata.normalize("NFKD", str(s)).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z]", "", s.lower())


def ascii_name(s):
    """Indian names as people type them: Aurangābād -> Aurangabad."""
    return unicodedata.normalize("NFKD", str(s)).encode("ascii", "ignore").decode().strip()


def rank(pop):
    return int(round(math.log10(max(int(pop or 0), 0) + 1) * 10))


def load(name):
    d = json.load(open(os.path.join(GN, name), encoding="utf-8"))
    return list(d.values()) if isinstance(d, dict) else d


def main(csc_dir):
    countries = {c["iso"]: c["name"] for c in load("countries.json")}
    us_states = {k: v["name"] for k, v in json.load(open(os.path.join(GN, "us_states.json"))).items()}
    states = {(s["countryCode"], s["isoCode"]): s["name"] for s in json.load(open(os.path.join(csc_dir, "state.json"), encoding="utf-8"))}
    csc_in = [c for c in json.load(open(os.path.join(csc_dir, "city.json"), encoding="utf-8")) if c[1] == "IN"]
    india_states = {code: re.sub(r"\s+", " ", name) for (cc, code), name in states.items() if cc == "IN"}

    # India: GeoNames places with their population; the state comes from the nearest country-state-city city.
    ref = [(float(c[3]), float(c[4]), india_states.get(c[2], ""), norm(c[0])) for c in csc_in]
    def state_for(lat, lon, n):
        best, bd = "", 1e9
        for rl, ro, st, rn in ref:
            d = (rl - lat) ** 2 + ((ro - lon) * math.cos(math.radians(lat))) ** 2
            if rn == n:
                d *= 0.25  # same name nearby: almost certainly the same place
            if d < bd:
                best, bd = st, d
        return best if bd < 1.0 else ""  # about 110 km

    places = {}
    def add(name, region, cc, pop):
        key = (norm(name), norm(region), cc)
        if not key[0]:
            return
        if key not in places or pop > places[key][3]:
            places[key] = [name, region, cc, pop]

    for c in load("cities1000.json"):
        if c["countrycode"] == "IN":
            add(ascii_name(c["name"]), state_for(c["latitude"], c["longitude"], norm(c["name"])), "IN", c["population"])
    # Old names already covered as aliases (Gurgaon, Allahabad) and "Name (Other name)" entries are left out.
    alias_names = {norm(a) for v in ALIASES.values() for a in v.split("|")}
    for c in csc_in:
        if "(" in c[0] or norm(c[0]) in alias_names:
            continue
        add(ascii_name(c[0]), india_states.get(c[2], ""), "IN", 0)
    for c in load("cities15000.json"):
        cc = c["countrycode"]
        if cc == "IN" or not (cc in NEIGHBOURS or c["population"] >= 100000):
            continue
        add(c["name"], us_states.get(c["admin1code"], "") if cc == "US" else "", cc, c["population"])

    # A place known twice in India, once with no state: keep the one with the state.
    named = {(k[0], k[2]) for k in places if k[1]}
    rows = [v for k, v in places.items() if k[1] or (k[0], k[2]) not in named or k[2] != "IN"]

    cc_list = sorted({r[2] for r in rows}, key=lambda c: (c != "IN", countries.get(c, c)))
    ci = {c: i for i, c in enumerate(cc_list)}
    rows.sort(key=lambda r: (-rank(r[3]), r[0]))
    data = {
        "v": 1,
        "countries": [countries.get(c, c) for c in cc_list],
        "places": [[r[0], r[1], ci[r[2]], rank(r[3])] + ([ALIASES[r[0]]] if r[2] == "IN" and r[0] in ALIASES else []) for r in rows],
    }
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
    india = sum(1 for r in rows if r[2] == "IN")
    print(f"{os.path.relpath(OUT, REPO)}: {len(rows)} places ({india} in India), {os.path.getsize(OUT) // 1024} KB")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "node_modules/country-state-city/lib/assets")
