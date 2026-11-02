"""Checks that every page quotes the current prices.

The generated pages (blog, report page) take prices from tools/prices.py. The hand-made pages (calculators, booking
pages) and calculators/calc-engine.js carry them as text, so after a price change run:

    python3 tools/check_prices.py

It lists every "from ₹..." report price and every consultation fee that does not match, and exits 1 if any do.
"""
import glob
import os
import re
import sys

sys.path.insert(0, os.path.dirname(__file__))
from prices import from_inr  # noqa: E402
from build_report import CONSULTS  # noqa: E402

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
RUPEE = r"(?:₹|&#8377;|%E2%82%B9)"
FROM = from_inr()
FEES = {c["name"]: c["price"] for c in CONSULTS}
NUM_FEE = FEES["Online Numerology Consultation"]
# Services sold at the one numerology consultation fee.
NUM_SERVICES = ["Name Frequency Alignment", "Mobile Number Energy Audit", "Online Numerology Consultation"]
OLD = ["974", "1,124", "1124", "824", "2,249", "2249"]

problems = []
files = [f for f in glob.glob(os.path.join(REPO, "**", "*.*"), recursive=True)
         if f.endswith((".html", ".js", ".txt")) and "/node_modules/" not in f and "/.git/" not in f]
for f in files:
    text = open(f, encoding="utf-8", errors="ignore").read()
    rel = os.path.relpath(f, REPO)
    for m in re.finditer(r"[Ff]rom " + RUPEE + r"\s?([\d,]+)", text):
        if int(m.group(1).replace(",", "")) != FROM:
            problems.append(f"{rel}: report price '{m.group(0)}' should be from ₹{FROM}")
    for old in OLD:
        for m in re.finditer(RUPEE + re.escape(old) + r"(?![\d,])", text):
            problems.append(f"{rel}: old consultation price '{m.group(0)}'")
    for svc in NUM_SERVICES:
        for m in re.finditer(re.escape(svc) + r"[^₹&%<]{0,60}" + RUPEE + r"\s?([\d,]+)", text):
            if int(m.group(1).replace(",", "")) != NUM_FEE:
                problems.append(f"{rel}: {svc} at '{m.group(0)[-12:]}' should be ₹{NUM_FEE}")

engine = open(os.path.join(REPO, "calculators", "calc-engine.js"), encoding="utf-8").read()
for var, want in (("REPORT_FROM_INR", FROM), ("CONSULT_INR", NUM_FEE)):
    m = re.search(var + r"\s*=\s*(\d+)", engine)
    if not m or int(m.group(1)) != want:
        problems.append(f"calculators/calc-engine.js: {var} should be {want}")

if problems:
    print("\n".join(problems))
    sys.exit(1)
print(f"Prices match: reports from ₹{FROM}, numerology consultation ₹{NUM_FEE}, in {len(files)} files.")
